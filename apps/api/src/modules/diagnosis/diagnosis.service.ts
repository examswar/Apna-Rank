import { prisma } from '@apna-rank/db';
import { NotFoundError, ForbiddenError } from '../../lib/errors';

export async function getHistory(userId: string, page: number, limit: number) {
  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    prisma.diagnosisResult.findMany({
      where: { studentId: userId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      select: {
        id: true,
        attemptId: true,
        knowledgeRank: true,
        strategyRank: true,
        overconfidentCount: true,
        underconfidentCount: true,
        topMistakeType: true,
        aajKaKaam: true,
        readinessPct: true,
        createdAt: true,
        attempt: {
          select: { score: true, totalMarks: true, submittedAt: true },
        },
      },
    }),
    prisma.diagnosisResult.count({ where: { studentId: userId } }),
  ]);
  return { items, total };
}

export async function getForAttempt(attemptId: string, userId: string) {
  const result = await prisma.diagnosisResult.findUnique({
    where: { attemptId },
    select: {
      id: true,
      attemptId: true,
      studentId: true,
      knowledgeRank: true,
      strategyRank: true,
      overconfidentCount: true,
      underconfidentCount: true,
      topMistakeType: true,
      aajKaKaam: true,
      readinessPct: true,
      createdAt: true,
      attempt: {
        select: { score: true, totalMarks: true, timeTakenSecs: true, submittedAt: true },
      },
    },
  });
  if (!result) throw new NotFoundError('Diagnosis result');
  if (result.studentId !== userId) throw new ForbiddenError();

  // Per-answer Mistake DNA breakdown
  const mistakeDna = await prisma.mistakeClassification.findMany({
    where: {
      studentId: userId,
      attemptAnswer: { attemptId },
    },
    select: {
      mistakeType: true,
      aiConfidence: true,
      question: { select: { id: true, topic: true, subject: true } },
    },
    orderBy: { createdAt: 'asc' },
  });

  // Aggregate counts per type
  const dnaSummary: Record<string, number> = {};
  for (const m of mistakeDna) {
    dnaSummary[m.mistakeType] = (dnaSummary[m.mistakeType] ?? 0) + 1;
  }

  return {
    ...result,
    mistakeDna,
    dnaSummary,
  };
}

export async function getMistakeDna(userId: string) {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const mistakes = await prisma.mistakeClassification.groupBy({
    by: ['mistakeType'],
    where: { studentId: userId, createdAt: { gte: since } },
    _count: { mistakeType: true },
    orderBy: { _count: { mistakeType: 'desc' } },
  });

  return mistakes.map((m) => ({
    type: m.mistakeType,
    count: m._count.mistakeType,
  }));
}

export async function getLeaderboard(userId: string) {
  const myLatest = await prisma.diagnosisResult.findFirst({
    where: { studentId: userId, isMinorData: false },
    orderBy: { createdAt: 'desc' },
    select: { readinessPct: true },
  });

  if (!myLatest?.readinessPct) {
    return { rank: null, percentile: null, total: 0 };
  }

  const myScore = Number(myLatest.readinessPct);

  const [total, below] = await Promise.all([
    prisma.diagnosisResult.count({ where: { isMinorData: false } }),
    prisma.diagnosisResult.count({
      where: { isMinorData: false, readinessPct: { lt: myScore } },
    }),
  ]);

  const percentile = total > 0 ? Math.round((below / total) * 100) : null;
  const rank = total > 0 ? total - below : null;

  return { rank, percentile, total };
}

export async function getAajKaKaam(userId: string) {
  const latest = await prisma.diagnosisResult.findFirst({
    where: { studentId: userId },
    orderBy: { createdAt: 'desc' },
    select: { aajKaKaam: true, readinessPct: true, topMistakeType: true, createdAt: true },
  });

  return {
    kaam: latest?.aajKaKaam ?? null,
    readinessPct: latest?.readinessPct ? Number(latest.readinessPct) : null,
    topMistakeType: latest?.topMistakeType ?? null,
    generatedAt: latest?.createdAt ?? null,
  };
}
