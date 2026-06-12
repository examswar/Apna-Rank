import { FastifyInstance } from 'fastify';
import { createHash, randomInt, randomBytes } from 'crypto';
import { prisma, encryptField } from '@apna-rank/db';
import { redis, KEYS } from '../../lib/redis';
import { config } from '../../lib/config';
import {
  AppError,
  ConflictError,
  UnauthorizedError,
  ValidationError,
  RateLimitError,
  NotFoundError,
} from '../../lib/errors';

const OTP_TTL_SECS = 5 * 60;     // 5 minutes
const OTP_RATE_LIMIT = 3;         // sends per phone per 15 minutes
const OTP_IP_LIMIT = 10;          // sends per IP per 15 minutes (anti SMS-bombing)
const OTP_MAX_VERIFY_ATTEMPTS = 5; // wrong guesses before the OTP is burned
const REFRESH_TTL_SECS = 7 * 24 * 60 * 60;

// Dev-only in-memory OTP store. Used ONLY when config.devOtp is true
// (AUTH_DEV_OTP=true and NODE_ENV !== production). Never reachable in prod.
const devOtpCache = new Map<string, string>(); // phone → otpHash

function hashOtp(otp: string): string {
  return createHash('sha256').update(otp).digest('hex');
}

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export async function sendOtp(phone: string, ip: string): Promise<void> {
  const otp = String(randomInt(100000, 999999));
  const otpHash = hashOtp(otp);

  if (config.devOtp) {
    // Explicit local-dev shortcut only. Never reachable in production.
    devOtpCache.set(phone, otpHash);
    console.log(`[DEV] OTP for ${phone}: ${otp}`);
  } else {
    // Limit 1: OTP sends per phone per 15 minutes. incr returns the post-increment
    // value, so the Nth allowed send has count === N. Block once it EXCEEDS the
    // limit (count > OTP_RATE_LIMIT), so exactly OTP_RATE_LIMIT sends are allowed.
    const rateKey = `rate:otp:${phone}`;
    const [count] = await redis.pipeline().incr(rateKey).expire(rateKey, 15 * 60, 'NX').exec() as [number, ...any[]];
    if (count > OTP_RATE_LIMIT) {
      throw new RateLimitError('OTP limit exceeded. 15 minutes baad try karo.');
    }

    // Limit 2: OTP sends per source IP per 15 minutes. Stops an attacker rotating
    // through thousands of valid-format numbers (each under its own per-phone cap)
    // to run up SMS cost / toll fraud. Meaningful only because trustProxy is now a
    // fixed hop count, so X-Forwarded-For can't mint fresh IP buckets.
    const ipKey = `rate:otp:ip:${ip}`;
    const [ipCount] = await redis.pipeline().incr(ipKey).expire(ipKey, 15 * 60, 'NX').exec() as [number, ...any[]];
    if (ipCount > OTP_IP_LIMIT) {
      throw new RateLimitError('Bahut zyada requests. 15 minutes baad try karo.');
    }

    await redis.set(KEYS.otp(phone), otpHash, 'EX', OTP_TTL_SECS);
    // Reset any stale verify-attempt counter from a previous OTP for this phone.
    await redis.del(`otp:attempts:${phone}`);

    // Always bound the upstream call: a hung MSG91 would otherwise hold the
    // request (and its DB/Redis work) open and exhaust the worker under load.
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5_000);
    try {
      const smsResp = await fetch('https://api.msg91.com/api/v5/otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          authkey: config.MSG91_AUTH_KEY,
        },
        body: JSON.stringify({
          mobile: `91${phone}`,
          template_id: config.MSG91_TEMPLATE_ID,
          otp,
        }),
        signal: controller.signal,
      });
      if (!smsResp.ok) {
        const errBody = await smsResp.text().catch(() => '');
        console.error(`[auth] MSG91 error ${smsResp.status}: ${errBody}`);
        throw new ValidationError('SMS delivery failed — thodi der baad try karo');
      }
    } catch (err) {
      if (err instanceof ValidationError) throw err;
      throw new ValidationError('SMS delivery failed — thodi der baad try karo');
    } finally {
      clearTimeout(timeout);
    }
  }

  await prisma.otpRequest.create({
    data: {
      phone,
      otpHash,
      expiresAt: new Date(Date.now() + OTP_TTL_SECS * 1000),
    },
  });
}

export async function verifyOtpAndIssueTokens(
  body: { phone: string; otp: string; name?: string; dob?: string },
  app: FastifyInstance,
) {
  // No master/bypass OTP. The stored hash must match the submitted OTP.
  const storedHash = config.devOtp
    ? (devOtpCache.get(body.phone) ?? null)
    : await redis.get(KEYS.otp(body.phone));

  if (!storedHash || storedHash !== hashOtp(body.otp)) {
    // Brute-force lockout: a 6-digit OTP is only 900k combinations and lives
    // 5 minutes. Without a per-OTP attempt cap an attacker can guess it. Count
    // wrong guesses for this phone and burn the OTP after OTP_MAX_VERIFY_ATTEMPTS.
    if (!config.devOtp) {
      const attemptKey = `otp:attempts:${body.phone}`;
      const [attempts] = await redis.pipeline().incr(attemptKey).expire(attemptKey, OTP_TTL_SECS, 'NX').exec() as [number, ...any[]];
      if (attempts >= OTP_MAX_VERIFY_ATTEMPTS) {
        await redis.del(KEYS.otp(body.phone));
        await redis.del(attemptKey);
      }
    }
    throw new ValidationError('OTP galat hai ya expire ho gaya');
  }

  // Look up the user BEFORE consuming the OTP. A first-time user's first
  // verify call won't carry name/dob — if we burned the OTP before telling
  // them, the retry with details would fail with "OTP galat" and signup
  // would be impossible. The OTP is only consumed once we can proceed.
  let user = await prisma.user.findUnique({ where: { phone: body.phone } });

  // DOB is mandatory at signup. If it were optional, a minor could simply omit
  // it, be stored as isMinor=false, and walk past every blockMinors guard and
  // the DPDP minor-data firewall.
  if (!user && (!body.name || !body.dob)) {
    throw new AppError(
      422,
      'NEW_USER_DETAILS_REQUIRED',
      'Naya account: naam aur date of birth zaroori hai',
    );
  }

  if (config.devOtp) {
    devOtpCache.delete(body.phone);
  } else {
    await redis.del(KEYS.otp(body.phone));
    await redis.del(`otp:attempts:${body.phone}`);
  }

  // Mark the most recent OtpRequest row as verified so the DB reflects the consumed state.
  await prisma.otpRequest.updateMany({
    where: { phone: body.phone, verified: false, expiresAt: { gt: new Date() } },
    data: { verified: true },
  });

  if (!user) {
    // captured as consts — TS narrowing on body.* doesn't survive into the
    // transaction closure below
    const name = body.name!;
    const dob = new Date(body.dob!);
    const isMinor = isUnder18(dob);

    // Create user + profile in a single transaction — if profile create fails the
    // user row is rolled back, preventing an orphaned user with no profile.
    user = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: { phone: body.phone, name, dob, isMinor, isActive: true },
      });
      await tx.studentProfile.create({
        data: {
          userId: created.id,
          examCategory: 'SSC_CGL', // default; updated during onboarding
          isMinorData: isMinor,
        },
      });
      return created;
    });

    // DPDP: minor self-registration requires parental consent within 48h
    // TODO: queue consent-request job via notificationQueue
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

  // Issue new tokens BEFORE revoking the old one.
  // If issueTokens fails, the old token remains valid and the user stays logged in.
  const tokens = await issueTokens(stored.user, app);

  await prisma.refreshToken.update({
    where: { id: stored.id },
    data: { revokedAt: new Date() },
  });

  return tokens;
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
  return prisma.user.findUnique({
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
        select: {
          examCategory: true,
          examSubType: true,
          currentStreak: true,
          baselineLevel: true,
        },
      },
    },
  });
}

export async function selectRole(
  userId: string,
  role: 'student' | 'teacher' | 'institute_admin',
  app: FastifyInstance,
) {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { role },
  });

  if (role === 'teacher') {
    await prisma.teacher.upsert({
      where: { userId },
      update: {},
      create: { userId, examCategories: [] },
    });
  }

  return issueTokens(user, app);
}

export async function setDob(
  userId: string,
  dob: string,
  app: FastifyInstance,
) {
  const dobDate = new Date(dob);
  const isMinor = isUnder18(dobDate);

  const user = await prisma.user.update({
    where: { id: userId },
    data: { dob: dobDate, isMinor },
  });

  await prisma.studentProfile.updateMany({
    where: { userId },
    data: { isMinorData: isMinor },
  });

  const tokens = await issueTokens(user, app);
  return { ...tokens, isMinor };
}

export async function submitParentalConsent(
  minorUserId: string,
  guardianPhone: string,
) {
  const user = await prisma.user.findUnique({ where: { id: minorUserId } });
  if (!user) throw new NotFoundError('User');
  if (!user.isMinor) throw new ValidationError('User is not a minor');

  const encryptedPhone = encryptField(guardianPhone);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 48 * 60 * 60 * 1000);

  // Create a PENDING consent record — approvedAt stays null until the guardian
  // completes OTP verification via a separate /consent/verify step.
  // Do NOT set consentGiven: true here; that is set only after guardian OTP is confirmed.
  const consent = await prisma.parentalConsent.create({
    data: {
      userId: minorUserId,
      guardianPhone: encryptedPhone,
      approvedAt: null,
      expiresAt,
    },
  });

  // TODO: enqueue guardian OTP via notificationQueue so guardian can verify consent

  return { consentId: consent.id, status: 'pending', expiresAt: consent.expiresAt };
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
    role: user.role,
    isMinor: user.isMinor,
    examCategory: profile?.examCategory ?? null,
    instituteId: profile?.instituteId ?? null,
  };

  const accessToken = app.jwt.sign(payload); // 15m expiry set in plugin config

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
  return (
    age < 18 ||
    (age === 18 && m < 0) ||
    (age === 18 && m === 0 && today.getDate() < dob.getDate())
  );
}
