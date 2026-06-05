import { FastifyInstance } from 'fastify';
import { createHash, randomInt, randomBytes } from 'crypto';
import { prisma, encryptField } from '@apna-rank/db';
import { redis, KEYS } from '../../lib/redis';
import { config } from '../../lib/config';
import {
  ConflictError,
  UnauthorizedError,
  ValidationError,
  RateLimitError,
  NotFoundError,
} from '../../lib/errors';

const OTP_TTL_SECS = 5 * 60;    // 5 minutes
const OTP_RATE_LIMIT = 3;        // per 15 minutes
const REFRESH_TTL_SECS = 7 * 24 * 60 * 60;

// Dev-only in-memory OTP store (no Redis required in development)
const devOtpCache = new Map<string, string>(); // phone → otpHash

function hashOtp(otp: string): string {
  return createHash('sha256').update(otp).digest('hex');
}

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export async function sendOtp(phone: string): Promise<void> {
  const otp = String(randomInt(100000, 999999));
  const otpHash = hashOtp(otp);

  if (config.isDev) {
    // No Redis required in dev — store in memory and log OTP to console
    devOtpCache.set(phone, otpHash);
    console.log(`[DEV] OTP for ${phone}: ${otp}`);
  } else {
    const rateKey = `rate:otp:${phone}`;
    const count = await redis.incr(rateKey);
    if (count === 1) await redis.expire(rateKey, 15 * 60);
    if (count > OTP_RATE_LIMIT) {
      throw new RateLimitError('OTP limit exceeded. 15 minutes baad try karo.');
    }

    await redis.set(KEYS.otp(phone), otpHash, 'EX', OTP_TTL_SECS);

    await fetch('https://api.msg91.com/api/v5/otp', {
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
    });
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
  // Dev bypass: accept fixed OTP "123456" without checking stored hash
  if (config.isDev && body.otp === '123456') {
    // allow through — test-only shortcut
  } else {
    const storedHash = config.isDev
      ? (devOtpCache.get(body.phone) ?? null)
      : await redis.get(KEYS.otp(body.phone));

    if (!storedHash || storedHash !== hashOtp(body.otp)) {
      throw new ValidationError('OTP galat hai ya expire ho gaya');
    }
  }

  if (config.isDev) {
    devOtpCache.delete(body.phone);
  } else {
    await redis.del(KEYS.otp(body.phone));
  }

  let user = await prisma.user.findUnique({ where: { phone: body.phone } });

  if (!user) {
    if (!body.name) throw new ValidationError('Name required for new users');
    const dob = body.dob ? new Date(body.dob) : undefined;
    const isMinor = dob ? isUnder18(dob) : false;

    user = await prisma.user.create({
      data: { phone: body.phone, name: body.name, dob, isMinor, isActive: true },
    });

    await prisma.studentProfile.create({
      data: {
        userId: user.id,
        examCategory: 'SSC_CGL', // default; updated during onboarding
        isMinorData: isMinor,
      },
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

  const [consent] = await prisma.$transaction([
    prisma.parentalConsent.create({
      data: {
        userId: minorUserId,
        guardianPhone: encryptedPhone,
        approvedAt: now,
        expiresAt,
      },
    }),
    prisma.user.update({
      where: { id: minorUserId },
      data: {
        consentGiven: true,
        consentAt: now,
        consentGuardianId: guardianPhone.slice(-4),
      },
    }),
  ]);

  return { consentId: consent.id, approvedAt: consent.approvedAt };
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
