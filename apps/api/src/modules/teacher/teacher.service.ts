import { prisma, encryptField } from '@apna-rank/db';
import { NotFoundError, ConflictError, ForbiddenError } from '../../lib/errors';

// ── Registration ──────────────────────────────────────────────────────────────

export async function register(
  userId: string,
  data: { panNumber: string; examCategories: string[] },
) {
  // select-role('teacher') creates a skeleton Teacher row with no PAN/categories.
  // This endpoint fills it in. Use upsert so both flows work.
  await prisma.user.update({ where: { id: userId }, data: { role: 'teacher' } });

  return prisma.teacher.upsert({
    where:  { userId },
    create: {
      userId,
      panNumber:      encryptField(data.panNumber),
      examCategories: data.examCategories as any,
      status:         'pending',
    },
    update: {
      panNumber:      encryptField(data.panNumber),
      examCategories: data.examCategories as any,
      status:         'pending',
      panVerified:    false,
    },
    select: { id: true, status: true, examCategories: true, panVerified: true, verifiedAt: true },
  });
}

// ── PAN submission / update ───────────────────────────────────────────────────

export async function submitPan(userId: string, panNumber: string) {
  const teacher = await prisma.teacher.findUnique({ where: { userId } });
  if (!teacher) throw new NotFoundError('Teacher profile');

  await prisma.teacher.update({
    where: { userId },
    data: {
      panNumber: encryptField(panNumber),
      panVerified: false, // reset until admin re-verifies
      status: 'pending',
    },
  });

  return { message: 'PAN submit ho gaya. Verification 2–3 business days mein hogi.', status: 'pending' };
}

// ── Profile ───────────────────────────────────────────────────────────────────

export async function getProfile(userId: string) {
  const teacher = await prisma.teacher.findUnique({
    where: { userId },
    include: { user: { select: { id: true, name: true, phone: true, email: true } } },
  });
  if (!teacher) throw new NotFoundError('Teacher profile');

  // Never return raw PAN value — only whether it was submitted
  const { panNumber, ...rest } = teacher;
  return { ...rest, panSubmitted: !!panNumber };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

export async function listTests(userId: string, page: number, limit: number) {
  const skip = (page - 1) * limit;
  const [tests, total] = await Promise.all([
    prisma.test.findMany({
      where:    { createdBy: userId },
      orderBy:  { createdAt: 'desc' },
      skip,
      take:     limit,
      select: {
        id: true, title: true, examCategory: true, type: true,
        price: true, durationSecs: true, isPublished: true, createdAt: true,
        _count: { select: { testQuestions: true, attempts: true, testPurchases: true } },
      },
    }),
    prisma.test.count({ where: { createdBy: userId } }),
  ]);

  return {
    tests: tests.map((t) => ({
      ...t,
      price:           Number(t.price),
      questionCount:   t._count.testQuestions,
      attemptCount:    t._count.attempts,
      purchaseCount:   t._count.testPurchases,
    })),
    total,
  };
}

// ── Test analytics — aggregate only, zero student PII ─────────────────────────

export async function getTestAnalytics(testId: string, userId: string) {
  const test = await prisma.test.findUnique({ where: { id: testId } });
  if (!test) throw new NotFoundError('Test');
  if (test.createdBy !== userId) throw new ForbiddenError();

  const [totalAttempts, submittedAttempts, scoreAgg, revenueAgg] = await Promise.all([
    prisma.attempt.count({ where: { testId } }),
    prisma.attempt.count({ where: { testId, status: 'submitted' } }),
    prisma.attempt.aggregate({
      where: { testId, status: 'submitted', score: { not: null }, isMinorData: false },
      _avg: { score: true },
      _min: { score: true },
      _max: { score: true },
    }),
    prisma.testPurchase.aggregate({
      where: { testId, status: 'paid' },
      _sum: { amountPaid: true },
      _count: { id: true },
    }),
  ]);

  // Wrong answers grouped by question, then merged to topics — no PII exposed
  const wrongByQuestion = await prisma.attemptAnswer.groupBy({
    by:    ['questionId'],
    where: { attempt: { testId, status: 'submitted', isMinorData: false }, isCorrect: false },
    _count: { questionId: true },
    orderBy: { _count: { questionId: 'desc' } },
    take: 20,
  });

  const qIds = wrongByQuestion.map((w) => w.questionId);
  const qMeta = await prisma.question.findMany({
    where:  { id: { in: qIds } },
    select: { id: true, topic: true, subject: true },
  });
  const qMap = new Map(qMeta.map((q) => [q.id, q]));

  // Collapse question-level counts to topic-level counts
  const topicMap = new Map<string, { subject: string | null; wrong: number }>();
  for (const w of wrongByQuestion) {
    const q     = qMap.get(w.questionId);
    const topic = q?.topic ?? 'General';
    const entry = topicMap.get(topic) ?? { subject: q?.subject ?? null, wrong: 0 };
    entry.wrong += w._count.questionId;
    topicMap.set(topic, entry);
  }

  const topWeakTopics = Array.from(topicMap.entries())
    .map(([topic, s]) => ({ topic, subject: s.subject, wrongCount: s.wrong }))
    .sort((a, b) => b.wrongCount - a.wrongCount)
    .slice(0, 10);

  return {
    testId,
    title:          test.title,
    examCategory:   test.examCategory,
    totalAttempts,
    submittedAttempts,
    completionRate: totalAttempts > 0
      ? Math.round((submittedAttempts / totalAttempts) * 100)
      : 0,
    avgScore:   scoreAgg._avg.score  ? +Number(scoreAgg._avg.score).toFixed(2) : null,
    minScore:   scoreAgg._min.score  ? Number(scoreAgg._min.score)  : null,
    maxScore:   scoreAgg._max.score  ? Number(scoreAgg._max.score)  : null,
    totalMarks: test.totalMarks,
    revenue: {
      totalPaid:     revenueAgg._count.id,
      totalAmount:   Number(revenueAgg._sum.amountPaid ?? 0),
    },
    topWeakTopics,
  };
}

// ── Earnings ──────────────────────────────────────────────────────────────────

export async function getEarnings(userId: string, page: number, limit: number) {
  const teacher = await prisma.teacher.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!teacher) throw new NotFoundError('Teacher profile');

  const skip = (page - 1) * limit;
  const [earnings, total, sums] = await Promise.all([
    prisma.teacherEarning.findMany({
      where:   { teacherId: teacher.id },
      orderBy: { testPurchase: { purchasedAt: 'desc' } },
      skip,
      take:    limit,
      select: {
        id: true, grossAmount: true, platformCut: true,
        teacherAmount: true, status: true, paidAt: true,
        testPurchase: {
          select: {
            testId: true, amountPaid: true, purchasedAt: true,
            test: { select: { title: true } },
          },
        },
      },
    }),
    prisma.teacherEarning.count({ where: { teacherId: teacher.id } }),
    prisma.teacherEarning.aggregate({
      where: { teacherId: teacher.id },
      _sum:  { grossAmount: true, teacherAmount: true },
    }),
  ]);

  return {
    earnings: earnings.map((e) => ({
      ...e,
      grossAmount:   Number(e.grossAmount),
      platformCut:   Number(e.platformCut),
      teacherAmount: Number(e.teacherAmount),
    })),
    total,
    totals: {
      totalGross:   Number(sums._sum.grossAmount   ?? 0),
      teacherTotal: Number(sums._sum.teacherAmount ?? 0),
    },
  };
}
