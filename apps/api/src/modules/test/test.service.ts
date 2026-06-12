import { prisma } from '@apna-rank/db';
import { diagnosisQueue, JOBS } from '../../lib/redis';
import { getRazorpay } from '../../lib/razorpay';
import { config } from '../../lib/config';
import { NotFoundError, ForbiddenError, ConflictError, ValidationError } from '../../lib/errors';

// ─── Browse / Detail ──────────────────────────────────────────

export async function browseMarketplace(
  filters: { examCategory?: string },
  page: number,
  limit: number,
) {
  const skip = (page - 1) * limit;
  const where: Record<string, unknown> = {
    isPublished: true,
    type: 'marketplace',
    ...(filters.examCategory && { examCategory: filters.examCategory }),
  };

  const [tests, total] = await Promise.all([
    prisma.test.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      select: {
        id: true,
        title: true,
        examCategory: true,
        type: true,
        price: true,
        durationSecs: true,
        negativeMarking: true,
        totalMarks: true,
        createdAt: true,
        creator: { select: { id: true, name: true } },
        _count: { select: { testQuestions: true, attempts: true } },
      },
    }),
    prisma.test.count({ where }),
  ]);

  return {
    tests: tests.map((t) => ({
      ...t,
      price: Number(t.price),
      negativeMarking: Number(t.negativeMarking),
      questionCount: t._count.testQuestions,
      attemptCount: t._count.attempts,
    })),
    total,
  };
}

export async function getTestDetail(testId: string, userId: string) {
  const test = await prisma.test.findUnique({
    where: { id: testId },
    include: {
      creator: { select: { id: true, name: true } },
      testQuestions: {
        orderBy: { orderIndex: 'asc' },
        take: 2, // preview: first 2 questions only (no correct answer exposed)
        select: {
          orderIndex: true,
          marks: true,
          question: {
            select: {
              id: true,
              questionText: true,
              options: true,
              difficultyTag: true,
              subject: true,
              topic: true,
            },
          },
        },
      },
      _count: { select: { testQuestions: true } },
    },
  });
  if (!test) throw new NotFoundError('Test');

  const hasPurchased =
    Number(test.price) === 0
      ? true
      : !!(await prisma.testPurchase.findUnique({
          where: { testId_studentId: { testId, studentId: userId } },
        }));

  const inProgress = await prisma.attempt.findFirst({
    where: { testId, studentId: userId, status: 'in_progress' },
    select: { id: true },
  });

  return {
    id: test.id,
    title: test.title,
    examCategory: test.examCategory,
    type: test.type,
    price: Number(test.price),
    durationSecs: test.durationSecs,
    negativeMarking: Number(test.negativeMarking),
    totalMarks: test.totalMarks,
    isPublished: test.isPublished,
    questionCount: test._count.testQuestions,
    creator: test.creator,
    preview: test.testQuestions,
    hasPurchased,
    activeAttemptId: inProgress?.id ?? null,
  };
}

// ─── Create / Update / Publish ────────────────────────────────

export async function createTest(
  userId: string,
  data: {
    title: string;
    examCategory: string;
    type: string;
    price?: number;
    durationSecs: number;
    negativeMarking?: number;
    totalMarks: number;
  },
) {
  return prisma.test.create({
    data: {
      title: data.title,
      examCategory: data.examCategory as any,
      type: data.type as any,
      price: data.price ?? 0,
      durationSecs: data.durationSecs,
      negativeMarking: data.negativeMarking ?? 0,
      totalMarks: data.totalMarks,
      createdBy: userId,
      isPublished: false,
    },
    select: {
      id: true,
      title: true,
      examCategory: true,
      type: true,
      price: true,
      durationSecs: true,
      negativeMarking: true,
      totalMarks: true,
      isPublished: true,
      createdAt: true,
    },
  });
}

export async function updateTest(
  testId: string,
  userId: string,
  data: {
    title?: string;
    price?: number;
    durationSecs?: number;
    negativeMarking?: number;
    totalMarks?: number;
  },
) {
  const test = await prisma.test.findUnique({ where: { id: testId } });
  if (!test) throw new NotFoundError('Test');
  if (test.createdBy !== userId) throw new ForbiddenError();
  if (test.isPublished) throw new ValidationError('Published test cannot be edited');

  return prisma.test.update({
    where: { id: testId },
    data: {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.price !== undefined && { price: data.price }),
      ...(data.durationSecs !== undefined && { durationSecs: data.durationSecs }),
      ...(data.negativeMarking !== undefined && { negativeMarking: data.negativeMarking }),
      ...(data.totalMarks !== undefined && { totalMarks: data.totalMarks }),
    },
    select: {
      id: true,
      title: true,
      examCategory: true,
      type: true,
      price: true,
      durationSecs: true,
      negativeMarking: true,
      totalMarks: true,
      isPublished: true,
    },
  });
}

export async function addQuestionToTest(
  testId: string,
  userId: string,
  questionId: string,
  marks: number,
) {
  const [test, question] = await Promise.all([
    prisma.test.findUnique({ where: { id: testId } }),
    prisma.question.findUnique({ where: { id: questionId, isActive: true } }),
  ]);

  if (!test) throw new NotFoundError('Test');
  if (test.createdBy !== userId) throw new ForbiddenError();
  if (test.isPublished) throw new ValidationError('Cannot add questions to a published test');
  if (!question) throw new NotFoundError('Question');

  if (test.examCategory !== question.examCategory) {
    throw new ValidationError('Question exam category does not match test');
  }

  const duplicate = await prisma.testQuestion.findUnique({
    where: { testId_questionId: { testId, questionId } },
    select: { id: true },
  });
  if (duplicate) throw new ConflictError('Question is already in this test');

  const agg = await prisma.testQuestion.aggregate({
    where: { testId },
    _max: { orderIndex: true },
  });
  const orderIndex = (agg._max.orderIndex ?? 0) + 1;

  return prisma.testQuestion.create({
    data: { testId, questionId, orderIndex, marks },
    select: { id: true, orderIndex: true, marks: true, questionId: true },
  });
}

export async function publishTest(testId: string, userId: string) {
  const test = await prisma.test.findUnique({
    where: { id: testId },
    include: { _count: { select: { testQuestions: true } } },
  });
  if (!test) throw new NotFoundError('Test');
  if (test.createdBy !== userId) throw new ForbiddenError();
  if (test.isPublished) throw new ConflictError('Test is already published');
  if (test._count.testQuestions === 0) {
    throw new ValidationError('Test must have at least one question before publishing');
  }

  return prisma.test.update({
    where: { id: testId },
    data: { isPublished: true },
    select: { id: true, title: true, isPublished: true },
  });
}

// ─── Legacy attempt functions (kept for /tests/:id/attempt route) ─

export async function startAttempt(testId: string, studentId: string) {
  const test = await prisma.test.findUnique({
    where: { id: testId, isPublished: true },
    include: {
      testQuestions: {
        orderBy: { orderIndex: 'asc' },
        include: {
          question: {
            select: {
              id: true,
              questionText: true,
              options: true,
              difficultyTag: true,
              subject: true,
              topic: true,
            },
          },
        },
      },
    },
  });
  if (!test) throw new NotFoundError('Test');

  const inProgress = await prisma.attempt.findFirst({
    where: { testId, studentId, status: 'in_progress' },
  });
  if (inProgress) return inProgress;

  // Marketplace tests require purchase — same guard as attempt.service.ts
  if (test.type === 'marketplace' && Number(test.price) > 0) {
    const purchased = await prisma.testPurchase.findUnique({
      where: { testId_studentId: { testId, studentId } },
    });
    if (!purchased) throw new ForbiddenError('Test kharidna zaroori hai pehle');
  }

  const isMinor = await prisma.user
    .findUnique({ where: { id: studentId }, select: { isMinor: true } })
    .then((u) => u?.isMinor ?? false);

  const attempt = await prisma.attempt.create({
    data: {
      testId,
      studentId,
      startedAt: new Date(),
      status: 'in_progress',
      isMinorData: isMinor,
    },
  });

  return { attempt, test };
}

export async function submitAttempt(
  attemptId: string,
  studentId: string,
  data: {
    answers: Array<{
      questionId: string;
      selectedOption: string | null;
      confidenceTag: 'sure' | 'unsure' | 'guess' | null;
      timeSpentSecs: number | null;
      flagged: boolean;
    }>;
    timeTakenSecs: number;
  },
) {
  const attempt = await prisma.attempt.findFirst({
    where: { id: attemptId, studentId, status: 'in_progress' },
    include: {
      test: { select: { negativeMarking: true, totalMarks: true } },
    },
  });
  if (!attempt) throw new NotFoundError('Attempt');

  const questions = await prisma.testQuestion.findMany({
    where: { testId: attempt.testId },
    include: { question: { select: { id: true, correctOption: true } } },
  });

  const correctMap = new Map(questions.map((q) => [q.questionId, q.question.correctOption]));
  const marksMap   = new Map(questions.map((q) => [q.questionId, Number(q.marks)]));

  let score = 0;
  const answerRows = data.answers.map((a) => {
    const correctOption = correctMap.get(a.questionId);
    const qMarks        = marksMap.get(a.questionId) ?? 1.0;
    const isCorrect = a.selectedOption !== null && a.selectedOption === correctOption;
    const isWrong   = a.selectedOption !== null && a.selectedOption !== correctOption;

    if (isCorrect) score += qMarks;
    if (isWrong)   score -= qMarks * Number(attempt.test.negativeMarking);

    return {
      attemptId,
      questionId: a.questionId,
      selectedOption: a.selectedOption,
      isCorrect: a.selectedOption !== null ? isCorrect : null,
      timeSpentSecs: a.timeSpentSecs,
      confidenceTag: a.confidenceTag as any,
      flagged: a.flagged,
    };
  });

  await prisma.$transaction([
    prisma.attempt.update({
      where: { id: attemptId },
      data: {
        status: 'submitted',
        submittedAt: new Date(),
        score,
        totalMarks: attempt.test.totalMarks,
        timeTakenSecs: data.timeTakenSecs,
      },
    }),
    prisma.attemptAnswer.createMany({ data: answerRows, skipDuplicates: true }),
  ]);

  try {
    await diagnosisQueue.add(JOBS.COMPUTE_DIAGNOSIS, { attemptId, studentId });
  } catch {
    console.warn(`[diagnosis] Failed to queue job for attempt=${attemptId} — Redis unavailable`);
  }

  return { score, totalMarks: attempt.test.totalMarks, diagnosisQueued: true };
}

// ─── Payments ─────────────────────────────────────────────────────────────────

export async function createRazorpayOrder(testId: string, studentId: string) {
  const test = await prisma.test.findUnique({
    where:  { id: testId, isPublished: true },
    select: { id: true, title: true, price: true },
  });
  if (!test) throw new NotFoundError('Test');

  const price = Number(test.price);
  if (price === 0) throw new ValidationError('This test is free — direct attempt karo');

  // Guard: already paid
  const existing = await prisma.testPurchase.findUnique({
    where: { testId_studentId: { testId, studentId } },
    select: { status: true },
  });
  if (existing?.status === 'paid') throw new ConflictError('Test already purchased');

  // Create Razorpay order — amount is in paise (INR × 100)
  const amountPaise = Math.round(price * 100);
  const rzp         = getRazorpay();

  const order = await (rzp.orders.create as Function)({
    amount:   amountPaise,
    currency: 'INR',
    receipt:  `tp_${testId.slice(0, 8)}_${Date.now()}`,
  });

  // Persist pending purchase so the webhook can match it back to an order
  await prisma.testPurchase.upsert({
    where:  { testId_studentId: { testId, studentId } },
    create: { testId, studentId, amountPaid: price, razorpayOrderId: order.id, status: 'pending' },
    update: { razorpayOrderId: order.id, amountPaid: price, status: 'pending' },
  });

  return {
    orderId:   order.id,
    amount:    amountPaise,    // paise — pass directly to Razorpay.js
    currency:  'INR',
    testId,
    testTitle: test.title,
    keyId:     config.RAZORPAY_KEY_ID, // public key safe to send to client
  };
}
