import { FastifyInstance } from 'fastify';
import { createHash, randomInt, randomBytes } from 'crypto';
import { prisma, encryptField } from '../../shared/db';
import { redis, KEYS } from '../../shared/redis';
import { AppError, ConflictError, UnauthorizedError, ValidationError, RateLimitError } from '../../shared/errors';
import { Prisma } from '@prisma/client';
import axios from 'axios';
import { config } from '../../shared/config';

const OTP_TTL_SECS = 5 * 60; // 5 minutes
const OTP_RATE_LIMIT = 3;     // per phone per 15 minutes
const OTP_IP_LIMIT = 10;      // per IP per 15 minutes (blocks SMS-bombing across phones)
const OTP_MAX_VERIFY_ATTEMPTS = 5; // wrong guesses before the OTP is burned
const REFRESH_TTL_SECS = 7 * 24 * 60 * 60;

function hashOtp(otp: string): string {
  return createHash('sha256').update(otp).digest('hex');
}

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export async function sendOtp(phone: string, ip: string): Promise<void> {
  // Limit 1: 3 OTPs per phone per 15 minutes.
  const rateKey = `rate:otp:${phone}`;
  const count = await redis.incr(rateKey);
  if (count === 1) {
    await redis.expire(rateKey, 15 * 60, 'NX'); // NX: only set if no expiry exists yet
  }
  if (count > OTP_RATE_LIMIT) {
    throw new RateLimitError('OTP limit exceeded. 15 minutes baad try karo.');
  }

  // Limit 2: 10 OTPs per source IP per 15 minutes. Without this, an attacker
  // rotates through thousands of valid-format phone numbers (each under its
  // own per-phone limit) to run up SMS cost / toll fraud. This cap is on the
  // real client IP — only meaningful because trustProxy is now a fixed hop
  // count, so X-Forwarded-For can't be forged to mint fresh IP buckets.
  const ipKey = `rate:otp:ip:${ip}`;
  const ipCount = await redis.incr(ipKey);
  if (ipCount === 1) {
    await redis.expire(ipKey, 15 * 60, 'NX');
  }
  if (ipCount > OTP_IP_LIMIT) {
    throw new RateLimitError('Bahut zyada requests. 15 minutes baad try karo.');
  }

  const otp = String(randomInt(100000, 999999));
  const otpHash = hashOtp(otp);

  // Store hashed OTP in Redis (5min TTL)
  await redis.set(KEYS.otp(phone), otpHash, 'EX', OTP_TTL_SECS);

  // Also log in DB for audit
  await prisma.otpRequest.create({
    data: {
      phone,
      otpHash,
      expiresAt: new Date(Date.now() + OTP_TTL_SECS * 1000),
    },
  });

  // Send via MSG91. Always set a timeout: without it, a hung upstream keeps the
  // request (and its DB/Redis work) pinned open up to the 30s connection
  // timeout, and enough concurrent hangs exhaust the worker.
  await axios.post(
    'https://api.msg91.com/api/v5/otp',
    { mobile: `91${phone}`, template_id: config.MSG91_TEMPLATE_ID, otp },
    { headers: { authkey: config.MSG91_AUTH_KEY }, timeout: 5_000 },
  );
}

export async function verifyOtpAndIssueTokens(
  body: { phone: string; otp: string; name?: string; dob?: string },
  app: FastifyInstance,
) {
  const storedHash = await redis.get(KEYS.otp(body.phone));
  if (!storedHash || storedHash !== hashOtp(body.otp)) {
    // Brute-force lockout: a 6-digit OTP is only 900k combinations and lives
    // for 5 minutes. Without a per-OTP attempt cap, an attacker can guess it.
    // Count wrong guesses against this phone; burn the OTP after 5 so the
    // window can't be exhausted.
    const attemptKey = `otp:attempts:${body.phone}`;
    const attempts = await redis.incr(attemptKey);
    if (attempts === 1) await redis.expire(attemptKey, OTP_TTL_SECS);
    if (attempts >= OTP_MAX_VERIFY_ATTEMPTS) {
      await redis.del(KEYS.otp(body.phone));
    }
    throw new ValidationError('OTP galat hai ya expire ho gaya');
  }

  // Look up the user BEFORE consuming the OTP. A first-time user's first
  // verify call won't carry name/dob — if we burned the OTP before telling
  // them, the retry with details would fail with "OTP galat" and signup
  // would be impossible. The OTP is only consumed once we can proceed.
  let user = await prisma.user.findUnique({ where: { phone: body.phone } });

  // DOB is mandatory at signup. If it were optional, a minor could simply
  // omit it and be recorded as isMinor=false, walking straight past every
  // blockMinors guard and the DPDP minor-data firewall.
  if (!user && (!body.name || !body.dob)) {
    throw new AppError(
      422,
      'NEW_USER_DETAILS_REQUIRED',
      'Naya account: naam aur date of birth zaroori hai',
    );
  }

  // Delete from Redis atomically before touching DB — prevents replay on network retry
  await redis.del(KEYS.otp(body.phone));
  await redis.del(`otp:attempts:${body.phone}`);

  // Mark OTP request verified in DB (audit trail)
  await prisma.otpRequest.updateMany({
    where: { phone: body.phone, otpHash: storedHash, verified: false },
    data: { verified: true },
  });

  if (!user) {
    const dob = new Date(body.dob!);
    const isMinor = isUnder18(dob);

    try {
      user = await prisma.user.create({
        data: {
          phone: body.phone,
          name: body.name!, // guarded above with NEW_USER_DETAILS_REQUIRED
          dob,
          isMinor,
          isActive: true,
        },
      });

      // Auto-create student profile stub
      await prisma.studentProfile.create({
        data: {
          userId: user.id,
          examCategory: 'SSC_CGL', // default; user updates in onboarding
          isMinorData: isMinor,
        },
      });

      // DPDP: minor self-registration requires parental consent flow
      if (isMinor) {
        // Consent flow initiated separately — account stays active for 48h
        // If consent not received → auto-deleted (DPDP requirement)
        // TODO: queue consent-request job
      }
    } catch (err) {
      // Race condition: another concurrent request created the user between our
      // findUnique and create. Fetch the now-existing record and continue.
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        user = await prisma.user.findUniqueOrThrow({ where: { phone: body.phone } });
      } else {
        throw err;
      }
    }
  }

  if (!user.isActive) throw new UnauthorizedError('Account deactivated');

  return issueTokens(user, app);
}

export async function rotateTokens(
  refreshToken: string | undefined,
  app: FastifyInstance,
) {
  if (!refreshToken) throw new UnauthorizedError();

  const tokenHash = hashToken(refreshToken);
  const stored = await prisma.refreshToken.findFirst({
    where: { tokenHash, revokedAt: null, expiresAt: { gt: new Date() } },
    include: { user: true },
  });

  if (!stored) throw new UnauthorizedError('Refresh token invalid or expired');

  // Rotate: revoke old, issue new
  await prisma.refreshToken.update({
    where: { id: stored.id },
    data: { revokedAt: new Date() },
  });

  return issueTokens(stored.user, app);
}

export async function revokeRefreshToken(
  refreshToken: string | undefined,
): Promise<void> {
  if (!refreshToken) return;
  const tokenHash = hashToken(refreshToken);
  await prisma.refreshToken.updateMany({
    where: { tokenHash, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function getCurrentUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      phone: true,
      email: true,
      name: true,
      role: true,
      languagePref: true,
      isMinor: true,
      isActive: true,
      studentProfile: {
        select: { examCategory: true, examSubType: true, currentStreak: true, baselineLevel: true },
      },
    },
  });
  return user;
}

// ── Helpers ──────────────────────────────────────────────────

async function issueTokens(
  user: { id: string; role: string; isMinor: boolean },
  app: FastifyInstance,
) {
  const profile = await prisma.studentProfile.findUnique({
    where: { userId: user.id },
    select: { examCategory: true, instituteId: true },
  });

  const payload = {
    sub: user.id,
    role: user.role as import('../../shared/types').UserRole,
    isMinor: user.isMinor,
    examCategory: profile?.examCategory ?? null,
    instituteId: profile?.instituteId ?? null,
  };

  const accessToken = app.jwt.sign(payload); // 15m expiry set in plugin config

  // Refresh token — opaque random string, stored as hash
  const rawRefresh = randomBytes(64).toString('hex');
  const tokenHash = hashToken(rawRefresh);

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt: new Date(Date.now() + REFRESH_TTL_SECS * 1000),
    },
  });

  return {
    accessToken,
    refreshToken: rawRefresh,
    user: { id: user.id, role: user.role, isMinor: user.isMinor },
  };
}

function isUnder18(dob: Date): boolean {
  const today = new Date();
  const age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  return age < 18 || (age === 18 && m < 0) || (age === 18 && m === 0 && today.getDate() < dob.getDate());
}
