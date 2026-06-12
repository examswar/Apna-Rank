import { prisma } from '@apna-rank/db';
import { redis } from '../../lib/redis';
import { config } from '../../lib/config';
import { NotFoundError, ForbiddenError, ValidationError } from '../../lib/errors';

// In-memory fallback for baseline session state when Redis is unavailable (dev without Redis)
const devBaselineCache = new Map<string, string>();

async function cacheGet(key: string): Promise<string | null> {
  if (config.isDev) {
    return devBaselineCache.get(key) ?? null;
  }
  return redis.get(key);
}

async function cacheSet(key: string, value: string, ttlSecs: number): Promise<void> {
  if (config.isDev) {
    devBaselineCache.set(key, value);
    // No TTL enforcement needed in dev
    return;
  }
  await redis.set(key, value, 'EX', ttlSecs);
}

async function cacheDel(key: string): Promise<void> {
  if (config.isDev) {
    devBaselineCache.delete(key);
    return;
  }
  await redis.del(key);
}

// ─── Profile ──────────────────────────────────────────────────

export async function getProfile(userId: string) {
  const profile = await prisma.studentProfile.findUnique({
    where: { userId },
    include: {
      user: {
        select: {
          id: true,
          phone: true,
          email: true,
          name: true,
          role: true,
          languagePref: true,
          isMinor: true,
        },
      },
    },
  });
  if (!profile) throw new NotFoundError('Student profile');
  return profile;
}

export async function upsertProfile(
  userId: string,
  data: {
    examCategory?: string;
    examSubType?: string;
    targetYear?: number;
    examDate?: string;
    languagePref?: string;
  },
) {
  const profileData = {
    ...(data.examCategory && { examCategory: data.examCategory as any }),
    ...(data.examSubType !== undefined && { examSubType: data.examSubType }),
    ...(data.targetYear !== undefined && { targetYear: data.targetYear }),
    ...(data.examDate && { examDate: new Date(data.examDate) }),
  };

  const profile = await prisma.studentProfile.upsert({
    where: { userId },
    update: profileData,
    create: {
      userId,
      examCategory: (data.examCategory ?? 'SSC_CGL') as any,
      ...profileData,
    },
  });

  if (data.languagePref) {
    await prisma.user.update({
      where: { id: userId },
      data: { languagePref: data.languagePref as any },
    });
  }

  return profile;
}

// ─── Onboarding ───────────────────────────────────────────────

export async function onboardingExam(
  userId: string,
  data: {
    examCategory: string;
    examSubType?: string;
    targetYear?: number;
    attemptNumber?: number; // TODO: add attempt_number INT column to student_profiles via migration
  },
) {
  const profileData = {
    examCategory: data.examCategory as any,
    ...(data.examSubType !== undefined && { examSubType: data.examSubType }),
    ...(data.targetYear !== undefined && { targetYear: data.targetYear }),
  };
  return prisma.studentProfile.upsert({
    where: { userId },
    update: profileData,
    create: { userId, ...profileData },
  });
}

// ─── Baseline (Adaptive IRT) ──────────────────────────────────

interface BaselineState {
  attemptId: string;
  theta: number;       // ability estimate, range roughly [-6, 6]
  count: number;       // questions answered so far
  answeredIds: string[];
  examCategory: string;
}

const BASELINE_KEY = (userId: string) => `baseline:${userId}`;
const BASELINE_TTL = 7200; // 2 hours
const MIN_QUESTIONS = 5;
const MAX_QUESTIONS = 7;

// Rasch-inspired weight per difficulty
const DIFF_WEIGHTS: Record<string, number> = { easy: 0.5, medium: 1.0, hard: 1.5 };

const Q_SELECT = {
  id: true,
  questionText: true,
  options: true,
  difficultyTag: true,
  subject: true,
  topic: true,
} as const;

function nextDifficulty(theta: number): 'easy' | 'medium' | 'hard' {
  if (theta >= 1.5) return 'hard';
  if (theta <= -1.5) return 'easy';
  return 'medium';
}

// Map theta [-6, 6] linearly to level [0, 100]
function computeBaselineLevel(theta: number): number {
  const clamped = Math.max(-6, Math.min(6, theta));
  return Math.round(((clamped + 6) / 12) * 100);
}

function isBaselineDone(count: number, theta: number): boolean {
  if (count >= MAX_QUESTIONS) return true;
  // Clear ability signal after minimum questions
  if (count >= MIN_QUESTIONS && Math.abs(theta) >= 3.0) return true;
  return false;
}

async function findOrCreateBaselineTest(examCategory: string, userId: string) {
  const existing = await prisma.test.findFirst({
    where: { type: 'baseline', examCategory: examCategory as any, isPublished: true },
  });
  if (existing) return existing;

  return prisma.test.create({
    data: {
      title: `Baseline — ${examCategory}`,
      examCategory: examCategory as any,
      type: 'baseline',
      createdBy: userId,
      durationSecs: 600,
      totalMarks: 7,
      isPublished: true,
    },
  });
}

async function pickQuestion(
  examCategory: string,
  difficulty: 'easy' | 'medium' | 'hard',
  excludeIds: string[],
) {
  return prisma.question.findFirst({
    where: {
      examCategory: examCategory as any,
      difficultyTag: difficulty as any,
      isActive: true,
      ...(excludeIds.length && { id: { notIn: excludeIds } }),
    },
    select: Q_SELECT,
  });
}

async function pickAnyQuestion(examCategory: string, excludeIds: string[]) {
  return prisma.question.findFirst({
    where: {
      examCategory: examCategory as any,
      isActive: true,
      ...(excludeIds.length && { id: { notIn: excludeIds } }),
    },
    select: Q_SELECT,
  });
}

async function finalizeBaseline(
  userId: string,
  attemptId: string,
  theta: number,
  count: number,
) {
  const level = computeBaselineLevel(theta);
  await Promise.all([
    prisma.studentProfile.update({
      where: { userId },
      data: { baselineLevel: level },
    }),
    prisma.attempt.update({
      where: { id: attemptId },
      data: { status: 'submitted', submittedAt: new Date(), score: level, totalMarks: 100 },
    }),
    cacheDel(BASELINE_KEY(userId)),
  ]);
  return { done: true as const, level, questionsAnswered: count };
}

export async function startBaseline(userId: string) {
  const profile = await prisma.studentProfile.findUnique({ where: { userId } });
  if (!profile) throw new NotFoundError('Student profile');

  // Resume existing session if one is in-flight
  const cached = await cacheGet(BASELINE_KEY(userId));
  if (cached) {
    const state: BaselineState = JSON.parse(cached);
    const diff = nextDifficulty(state.theta);
    const question =
      (await pickQuestion(state.examCategory, diff, state.answeredIds)) ??
      (await pickAnyQuestion(state.examCategory, state.answeredIds));
    if (!question) throw new NotFoundError('Questions for this baseline session');
    return {
      attemptId: state.attemptId,
      question,
      questionNumber: state.count + 1,
      totalQuestions: MAX_QUESTIONS,
    };
  }

  const test = await findOrCreateBaselineTest(profile.examCategory as string, userId);

  const firstQuestion = await pickQuestion(profile.examCategory as string, 'medium', []);
  if (!firstQuestion) {
    throw new NotFoundError('Baseline questions for this exam category');
  }

  const attempt = await prisma.attempt.create({
    data: {
      testId: test.id,
      studentId: userId,
      startedAt: new Date(),
      status: 'in_progress',
      isMinorData: profile.isMinorData,
    },
  });

  const state: BaselineState = {
    attemptId: attempt.id,
    theta: 0,
    count: 0,
    answeredIds: [],
    examCategory: profile.examCategory as string,
  };
  await cacheSet(BASELINE_KEY(userId), JSON.stringify(state), BASELINE_TTL);

  return {
    attemptId: attempt.id,
    question: firstQuestion,
    questionNumber: 1,
    totalQuestions: MAX_QUESTIONS,
  };
}

export async function answerBaseline(
  userId: string,
  data: { attemptId: string; questionId: string; selectedOption: string },
) {
  const cached = await cacheGet(BASELINE_KEY(userId));
  if (!cached) {
    throw new ValidationError('No active baseline session. Call GET /baseline/start first.');
  }

  const state: BaselineState = JSON.parse(cached);
  if (state.attemptId !== data.attemptId) throw new ForbiddenError('Attempt ID mismatch');

  const question = await prisma.question.findUnique({
    where: { id: data.questionId },
    select: { correctOption: true, difficultyTag: true },
  });
  if (!question) throw new NotFoundError('Question');

  const isCorrect = question.correctOption === data.selectedOption;
  const weight = DIFF_WEIGHTS[question.difficultyTag as string] ?? 1.0;

  await prisma.attemptAnswer.create({
    data: {
      attemptId: data.attemptId,
      questionId: data.questionId,
      selectedOption: data.selectedOption,
      isCorrect,
    },
  });

  state.theta += isCorrect ? weight : -weight;
  state.count++;
  state.answeredIds.push(data.questionId);

  if (isBaselineDone(state.count, state.theta)) {
    return finalizeBaseline(userId, data.attemptId, state.theta, state.count);
  }

  await cacheSet(BASELINE_KEY(userId), JSON.stringify(state), BASELINE_TTL);

  const diff = nextDifficulty(state.theta);
  const next =
    (await pickQuestion(state.examCategory, diff, state.answeredIds)) ??
    (await pickAnyQuestion(state.examCategory, state.answeredIds));

  if (!next) {
    // Exhausted question bank — force completion
    return finalizeBaseline(userId, data.attemptId, state.theta, state.count);
  }

  return { done: false as const, nextQuestion: next, questionNumber: state.count + 1 };
}

// ─── Dashboard ────────────────────────────────────────────────

export async function getDashboard(userId: string) {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const [profile, latestDiagnosis, recentAttempts] = await Promise.all([
    prisma.studentProfile.findUnique({
      where: { userId },
      select: {
        currentStreak: true,
        maxStreak: true,
        baselineLevel: true,
        examCategory: true,
        lastActiveAt: true,
      },
    }),
    prisma.diagnosisResult.findFirst({
      where: { studentId: userId },
      orderBy: { createdAt: 'desc' },
      select: { aajKaKaam: true, readinessPct: true },
    }),
    prisma.attempt.findMany({
      where: {
        studentId: userId,
        status: 'submitted',
        submittedAt: { gte: sevenDaysAgo },
      },
      select: { submittedAt: true, score: true, totalMarks: true },
      orderBy: { submittedAt: 'asc' },
    }),
  ]);

  // Group attempts by calendar date
  const dayMap = new Map<string, { count: number; totalPct: number }>();
  for (const a of recentAttempts) {
    const key = a.submittedAt!.toISOString().slice(0, 10);
    if (!dayMap.has(key)) dayMap.set(key, { count: 0, totalPct: 0 });
    const d = dayMap.get(key)!;
    d.count++;
    if (a.score != null && a.totalMarks != null && Number(a.totalMarks) > 0) {
      d.totalPct += (Number(a.score) / Number(a.totalMarks)) * 100;
    }
  }

  const progressSnapshot: Array<{
    date: string;
    attemptCount: number;
    avgScorePct: number | null;
  }> = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const day = dayMap.get(key);
    progressSnapshot.push({
      date: key,
      attemptCount: day?.count ?? 0,
      avgScorePct: day && day.count > 0 ? Math.round(day.totalPct / day.count) : null,
    });
  }

  return {
    streak: profile?.currentStreak ?? 0,
    maxStreak: profile?.maxStreak ?? 0,
    todaysKaam: latestDiagnosis?.aajKaKaam ?? null,
    progressSnapshot,
    readinessPct: latestDiagnosis?.readinessPct != null
      ? Number(latestDiagnosis.readinessPct)
      : null,
    baselineLevel: profile?.baselineLevel != null
      ? Number(profile.baselineLevel)
      : null,
  };
}

// ─── Progress (30-day activity calendar) ─────────────────────

export async function getProgress(userId: string) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
  thirtyDaysAgo.setHours(0, 0, 0, 0);

  const attempts = await prisma.attempt.findMany({
    where: {
      studentId: userId,
      status: 'submitted',
      submittedAt: { gte: thirtyDaysAgo },
    },
    select: { submittedAt: true, score: true, totalMarks: true },
    orderBy: { submittedAt: 'asc' },
  });

  const dayMap = new Map<string, { count: number; totalPct: number }>();
  for (const a of attempts) {
    const key = a.submittedAt!.toISOString().slice(0, 10);
    if (!dayMap.has(key)) dayMap.set(key, { count: 0, totalPct: 0 });
    const d = dayMap.get(key)!;
    d.count++;
    if (a.score != null && a.totalMarks != null && Number(a.totalMarks) > 0) {
      d.totalPct += (Number(a.score) / Number(a.totalMarks)) * 100;
    }
  }

  const days: Array<{ date: string; attemptCount: number; avgScorePct: number | null }> = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const day = dayMap.get(key);
    days.push({
      date: key,
      attemptCount: day?.count ?? 0,
      avgScorePct: day && day.count > 0 ? Math.round(day.totalPct / day.count) : null,
    });
  }

  return { days };
}

// ─── Readiness (topic-level accuracy breakdown) ───────────────

export async function getReadiness(userId: string) {
  const profile = await prisma.studentProfile.findUnique({
    where: { userId },
    select: { examCategory: true, baselineLevel: true },
  });
  if (!profile) throw new NotFoundError('Student profile');

  const answers = await prisma.attemptAnswer.findMany({
    where: {
      attempt: { studentId: userId, status: 'submitted' },
      isCorrect: { not: null },
      question: { examCategory: profile.examCategory as any },
    },
    select: {
      isCorrect: true,
      question: { select: { topic: true, subject: true } },
    },
    take: 1000,
  });

  const topicStats: Record<string, { correct: number; total: number }> = {};
  for (const a of answers) {
    const label = a.question.topic ?? a.question.subject ?? 'General';
    topicStats[label] ??= { correct: 0, total: 0 };
    topicStats[label].total++;
    if (a.isCorrect) topicStats[label].correct++;
  }

  const readyTopics: string[] = [];
  const remainingTopics: string[] = [];
  for (const [topic, stats] of Object.entries(topicStats)) {
    if (stats.total >= 3) {
      (stats.correct / stats.total >= 0.7 ? readyTopics : remainingTopics).push(topic);
    }
  }

  const totalTopics = readyTopics.length + remainingTopics.length;
  const readinessPct =
    totalTopics > 0
      ? Math.round((readyTopics.length / totalTopics) * 100)
      : (profile.baselineLevel ? Number(profile.baselineLevel) : 0);

  return { readyTopics, remainingTopics, readinessPct };
}

// ─── Galti Notebook ───────────────────────────────────────────

export async function getGaltiNotebook(userId: string, page: number, limit: number) {
  const skip = (page - 1) * limit;

  const [entries, total] = await Promise.all([
    prisma.galtiNotebookEntry.findMany({
      where: { studentId: userId },
      orderBy: [{ wrongCount: 'desc' }, { createdAt: 'desc' }],
      skip,
      take: limit,
      select: {
        id: true,
        mistakeType: true,
        studentNote: true,
        wrongCount: true,
        reviewCount: true,
        lastReviewed: true,
        isResolved: true,
        createdAt: true,
        question: {
          select: {
            id: true,
            questionText: true,
            options: true,
            correctOption: true,
            explanation: true,
            subject: true,
            topic: true,
            difficultyTag: true,
          },
        },
      },
    }),
    prisma.galtiNotebookEntry.count({ where: { studentId: userId } }),
  ]);

  return { entries, total, page, limit };
}

export async function updateGaltiEntry(
  entryId: string,
  userId: string,
  data: { studentNote?: string; isResolved?: boolean },
) {
  const entry = await prisma.galtiNotebookEntry.findUnique({ where: { id: entryId } });
  if (!entry) throw new NotFoundError('Galti notebook entry');
  if (entry.studentId !== userId) throw new ForbiddenError('Access denied');

  return prisma.galtiNotebookEntry.update({
    where: { id: entryId },
    data: {
      ...(data.studentNote !== undefined && { studentNote: data.studentNote }),
      ...(data.isResolved !== undefined && { isResolved: data.isResolved }),
      reviewCount: { increment: 1 },
      lastReviewed: new Date(),
    },
  });
}
