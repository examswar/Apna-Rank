import { randomBytes } from 'crypto';
import { prisma } from '@apna-rank/db';
import { redis, KEYS } from '../../lib/redis';
import { config } from '../../lib/config';
import { NotFoundError, ConflictError, ForbiddenError, DpaRequiredError } from '../../lib/errors';

const BATCH_INVITE_TTL = 7 * 24 * 3600; // 7 days
const devInviteCache = new Map<string, string>(); // token → batchId (dev-only fallback)

// ── Registration ──────────────────────────────────────────────────────────────

export async function create(
  userId: string,
  data: {
    name: string;
    type: 'coaching' | 'school' | 'college';
    city?: string;
    state?: string;
    hasMinorStudents: boolean;
  },
) {
  const existing = await prisma.institute.findUnique({ where: { contactUserId: userId } });
  if (existing) throw new ConflictError('Institute already registered for this account');

  await prisma.user.update({ where: { id: userId }, data: { role: 'institute_admin' } });

  return prisma.institute.create({
    data: { ...data, contactUserId: userId },
    select: { id: true, name: true, type: true, city: true, state: true,
              hasMinorStudents: true, dpaSigned: true, createdAt: true },
  });
}

// ── Profile ───────────────────────────────────────────────────────────────────

export async function getProfile(userId: string) {
  const institute = await prisma.institute.findUnique({
    where: { contactUserId: userId },
    select: {
      id: true, name: true, type: true, city: true, state: true,
      hasMinorStudents: true, dpaSigned: true, dpaSignedAt: true, createdAt: true,
      _count: { select: { batches: true } },
    },
  });
  if (!institute) throw new NotFoundError('Institute');
  return institute;
}

// ── DPA ───────────────────────────────────────────────────────────────────────

export async function signDpa(
  userId: string,
  signedBy: string,
  ipAddress: string,
) {
  const institute = await prisma.institute.findUnique({
    where: { contactUserId: userId },
    select: { id: true, dpaSigned: true },
  });
  if (!institute) throw new NotFoundError('Institute');
  if (institute.dpaSigned) throw new ConflictError('DPA already signed');

  await prisma.$transaction([
    prisma.dpaRecord.create({
      data: {
        instituteId: institute.id,
        version:     '1.0',
        signedAt:    new Date(),
        signedBy,
        ipAddress,
      },
    }),
    prisma.institute.update({
      where: { id: institute.id },
      data:  { dpaSigned: true, dpaSignedAt: new Date() },
    }),
  ]);

  return { signed: true, version: '1.0', signedAt: new Date().toISOString() };
}

// ── Batches ───────────────────────────────────────────────────────────────────

export async function listBatches(userId: string) {
  const institute = await prisma.institute.findUnique({
    where: { contactUserId: userId },
    select: { id: true },
  });
  if (!institute) throw new NotFoundError('Institute');

  return prisma.batch.findMany({
    where:   { instituteId: institute.id, isActive: true },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true, name: true, examCategory: true, isActive: true, createdAt: true,
      _count: { select: { students: true } },
    },
  });
}

export async function createBatch(
  userId: string,
  data: { name: string; examCategory: string },
) {
  const institute = await prisma.institute.findUnique({
    where: { contactUserId: userId },
    select: { id: true },
  });
  if (!institute) throw new NotFoundError('Institute');

  return prisma.batch.create({
    data: {
      instituteId:  institute.id,
      name:         data.name,
      examCategory: data.examCategory as any,
    },
    select: { id: true, name: true, examCategory: true, isActive: true, createdAt: true },
  });
}

// ── Batch invite link (student self-enrolment) ────────────────────────────────

export async function generateBatchInvite(batchId: string, userId: string) {
  const batch = await prisma.batch.findUnique({
    where:   { id: batchId },
    include: { institute: { select: { contactUserId: true } } },
  });
  if (!batch) throw new NotFoundError('Batch');
  if (batch.institute.contactUserId !== userId) throw new ForbiddenError();

  const token     = randomBytes(20).toString('hex');
  const expiresAt = new Date(Date.now() + BATCH_INVITE_TTL * 1000);

  // Redis may be unavailable in dev — store invite token; if Redis is down,
  // log the token so manual testing is still possible.
  try {
    await redis.set(KEYS.batchInvite(token), batchId, 'EX', BATCH_INVITE_TTL);
  } catch {
    console.warn(`[invite] Redis unavailable — token ${token} stored in-memory only (dev)`);
    if (config.isDev) {
      devInviteCache.set(token, batchId);
    }
  }

  return {
    inviteUrl: `${config.appBaseUrl}/batches/join/${token}`,
    token,
    batchName:  batch.name,
    expiresAt,
  };
}

// ── Batch heatmap — topic weakness aggregation ────────────────────────────────

export async function getBatchHeatmap(batchId: string, userId: string) {
  await assertBatchAccess(batchId, userId);

  // Resolve batch students → student profile IDs → user IDs
  const batchStudents = await prisma.batchStudent.findMany({
    where:  { batchId },
    select: { studentId: true },
  });
  if (batchStudents.length === 0) return [];

  const profileIds = batchStudents.map((bs) => bs.studentId);
  const profiles   = await prisma.studentProfile.findMany({
    where:  { id: { in: profileIds }, isMinorData: false },
    select: { userId: true },
  });
  if (profiles.length === 0) return [];

  const userIds = profiles.map((p) => p.userId);

  // Pull attempt answers for all enrolled (non-minor) students — capped at 10k rows
  const answers = await prisma.attemptAnswer.findMany({
    where: {
      attempt: { studentId: { in: userIds }, status: 'submitted', isMinorData: false },
      isCorrect: { not: null },
    },
    select: {
      isCorrect: true,
      question:  { select: { topic: true, subject: true } },
      attempt:   { select: { studentId: true } },
    },
    take: 10000,
  });

  // Aggregate by topic
  const topicMap = new Map<string, {
    subject: string | null;
    correct: number;
    wrong:   number;
    weakStudents: Set<string>;
  }>();

  for (const a of answers) {
    const topic = a.question.topic ?? 'General';
    const entry = topicMap.get(topic) ?? {
      subject: a.question.subject ?? null,
      correct: 0,
      wrong:   0,
      weakStudents: new Set<string>(),
    };
    if (a.isCorrect) {
      entry.correct++;
    } else {
      entry.wrong++;
      entry.weakStudents.add(a.attempt.studentId);
    }
    topicMap.set(topic, entry);
  }

  return Array.from(topicMap.entries())
    .map(([topic, s]) => ({
      topic,
      subject:          s.subject,
      totalAttempts:    s.correct + s.wrong,
      errorRate:        s.correct + s.wrong > 0
        ? Math.round((s.wrong / (s.correct + s.wrong)) * 100)
        : 0,
      weakStudentCount: s.weakStudents.size,
    }))
    .sort((a, b) => b.errorRate - a.errorRate);
}

// ── Batch lesson plan (rule-based Hindi weekly plan) ─────────────────────────

export async function getLessonPlan(batchId: string, userId: string) {
  const heatmap = await getBatchHeatmap(batchId, userId);

  const weak = heatmap.filter((t) => t.errorRate >= 30).slice(0, 5);
  if (weak.length === 0) {
    return {
      batchId,
      message: 'Badhai ho! Koi weak topic nahi mila. Batch ne bahut achha perform kiya.',
      plan: [],
    };
  }

  const dayNames = ['Somvar', 'Mangalvar', 'Budhvar', 'Guruvar', 'Shukravar'];

  const plan = weak.map((topic, i) => ({
    day:          i + 1,
    dayName:      dayNames[i] ?? `Din ${i + 1}`,
    topic:        topic.topic,
    subject:      topic.subject ?? 'General',
    errorRate:    topic.errorRate,
    weakStudents: topic.weakStudentCount,
    activities:   buildActivities(topic.topic, topic.errorRate),
    tip:          buildTeachingTip(topic.topic, topic.errorRate),
  }));

  return { batchId, generatedAt: new Date().toISOString(), plan };
}

function buildActivities(topic: string, errorRate: number): string[] {
  const list = [
    `"${topic}" ke core concepts 20 minute mein explain karo — visual / diagram ke saath`,
    `5 solved examples dikhao (easy → medium progression)`,
    `10 practice questions — students silently solve karein, phir discuss karo`,
  ];
  if (errorRate >= 60) list.push(`Ghar ke liye worksheet do — agle din check karo`);
  if (errorRate >= 80) list.push(`Repeat session next week ke liye schedule karo`);
  return list;
}

function buildTeachingTip(topic: string, errorRate: number): string {
  if (errorRate >= 70) return `"${topic}" mein bahut zyada galtiyan hain. Basics se shuru karo, formulas baad mein.`;
  if (errorRate >= 50) return `"${topic}" thoda samajh aaya hai lekin practice kam hai. Worked examples zyada dikhao.`;
  return `"${topic}" ok hai — mostly speed ki problem. Timed drills se improve hoga.`;
}

// ── Dropout alerts — students inactive 5+ days ────────────────────────────────

export async function getDropoutAlerts(userId: string) {
  const institute = await prisma.institute.findUnique({
    where:  { contactUserId: userId },
    select: { id: true },
  });
  if (!institute) throw new NotFoundError('Institute');

  const cutoff = new Date(Date.now() - 5 * 24 * 3600 * 1000);

  const students = await prisma.studentProfile.findMany({
    where: {
      batches: {
        some: { batch: { instituteId: institute.id, isActive: true } },
      },
      isMinorData: false,
      OR: [
        { lastActiveAt: null },
        { lastActiveAt: { lt: cutoff } },
      ],
    },
    select: {
      userId:       true,
      lastActiveAt: true,
      examCategory: true,
      user:         { select: { name: true } },
      batches: {
        where:  { batch: { instituteId: institute.id, isActive: true } },
        select: { batch: { select: { id: true, name: true } } },
        take:   1,
      },
    },
    orderBy: { lastActiveAt: 'asc' },
    take:    100,
  });

  return students.map((s) => ({
    userId:         s.userId,
    name:           s.user.name,
    examCategory:   s.examCategory,
    lastActiveAt:   s.lastActiveAt,
    daysSinceActive: s.lastActiveAt
      ? Math.floor((Date.now() - s.lastActiveAt.getTime()) / 86_400_000)
      : null,
    batchName:      s.batches[0]?.batch.name ?? 'Unknown',
  }));
}

// ── Internal helpers ──────────────────────────────────────────────────────────

async function assertBatchAccess(batchId: string, userId: string) {
  const batch = await prisma.batch.findUnique({
    where:   { id: batchId },
    include: { institute: { select: { contactUserId: true } } },
  });
  if (!batch) throw new NotFoundError('Batch');
  if (batch.institute.contactUserId !== userId) throw new ForbiddenError();
  return batch;
}
