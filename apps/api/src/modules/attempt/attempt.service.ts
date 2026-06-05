import { prisma } from '@apna-rank/db';
import { diagnosisQueue, JOBS } from '../../lib/redis';
import { config } from '../../lib/config';
import { NotFoundError, ForbiddenError, ConflictError, ValidationError } from '../../lib/errors';
import { runDiagnosis } from '../../jobs/diagnosis.worker';

// ─── Start ────────────────────────────────────────────────────

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

  // Return existing in-progress attempt if one exists
  const existing = await prisma.attempt.findFirst({
    where: { testId, studentId, status: 'in_progress' },
  });
  if (existing) {
    return {
      attempt: existing,
      questions: test.testQuestions.map((tq) => ({ ...tq.question, marks: Number(tq.marks) })),
      durationSecs: test.durationSecs,
      negativeMarking: Number(test.negativeMarking),
    };
  }

  // Marketplace tests require purchase (free tests price=0 bypass this)
  if (test.type === 'marketplace' && Number(test.price) > 0) {
    const purchased = await prisma.testPurchase.findUnique({
      where: { testId_studentId: { testId, studentId } },
    });
    if (!purchased) throw new ForbiddenError('Test kharidna zaroori hai pehle');
  }

  const user = await prisma.user.findUnique({
    where: { id: studentId },
    select: { isMinor: true },
  });

  const attempt = await prisma.attempt.create({
    data: {
      testId,
      studentId,
      startedAt: new Date(),
      status: 'in_progress',
      isMinorData: user?.isMinor ?? false,
    },
  });

  return {
    attempt,
    questions: test.testQuestions.map((tq) => ({ ...tq.question, marks: Number(tq.marks) })),
    durationSecs: test.durationSecs,
    negativeMarking: Number(test.negativeMarking),
  };
}

// ─── Autosave one answer ───────────────────────────────────────

export async function saveAnswer(
  attemptId: string,
  studentId: string,
  data: {
    questionId: string;
    selectedOption?: string | null;
    confidenceTag?: 'sure' | 'unsure' | 'guess' | null;
    timeSpentSecs?: number | null;
    flagged?: boolean;
  },
) {
  const attempt = await prisma.attempt.findFirst({
    where: { id: attemptId, studentId, status: 'in_progress' },
  });
  if (!attempt) throw new NotFoundError('Active attempt');

  const question = await prisma.question.findUnique({
    where: { id: data.questionId },
    select: { correctOption: true },
  });
  if (!question) throw new NotFoundError('Question');

  const selectedOption = data.selectedOption ?? null;
  const isCorrect =
    selectedOption !== null ? selectedOption === question.correctOption : null;

  await prisma.attemptAnswer.upsert({
    where: { attemptId_questionId: { attemptId, questionId: data.questionId } },
    create: {
      attemptId,
      questionId: data.questionId,
      selectedOption,
      isCorrect,
      timeSpentSecs: data.timeSpentSecs ?? null,
      confidenceTag: (data.confidenceTag ?? null) as any,
      flagged: data.flagged ?? false,
    },
    update: {
      selectedOption,
      isCorrect,
      timeSpentSecs: data.timeSpentSecs ?? null,
      confidenceTag: (data.confidenceTag ?? null) as any,
      flagged: data.flagged ?? false,
    },
  });

  return { saved: true };
}

// ─── Submit ───────────────────────────────────────────────────

export async function submitAttempt(
  attemptId: string,
  studentId: string,
  timeTakenSecs: number,
) {
  const attempt = await prisma.attempt.findFirst({
    where: { id: attemptId, studentId, status: 'in_progress' },
    include: {
      test: { select: { id: true, negativeMarking: true, totalMarks: true } },
    },
  });
  if (!attempt) throw new NotFoundError('Active attempt');

  // Gather saved answers + test question marks
  const [savedAnswers, testQuestions] = await Promise.all([
    prisma.attemptAnswer.findMany({ where: { attemptId } }),
    prisma.testQuestion.findMany({
      where: { testId: attempt.test.id },
      select: { questionId: true, marks: true },
    }),
  ]);

  const marksMap = new Map(testQuestions.map((tq) => [tq.questionId, Number(tq.marks)]));
  const negMark = Number(attempt.test.negativeMarking);

  let score = 0;
  for (const a of savedAnswers) {
    if (a.selectedOption === null) continue;
    const qMarks = marksMap.get(a.questionId) ?? 1.0;
    if (a.isCorrect) {
      score += qMarks;
    } else {
      score -= qMarks * negMark;
    }
  }

  await prisma.attempt.update({
    where: { id: attemptId },
    data: {
      status: 'submitted',
      submittedAt: new Date(),
      score,
      totalMarks: attempt.test.totalMarks,
      timeTakenSecs,
    },
  });

  // Enqueue diagnosis — fall back to synchronous execution in dev when Redis is down
  try {
    await diagnosisQueue.add(JOBS.COMPUTE_DIAGNOSIS, { attemptId, studentId });
  } catch {
    console.warn(`[diagnosis] Queue unavailable for attempt=${attemptId}`);
    if (config.isDev) {
      try {
        await runDiagnosis(attemptId, studentId);
      } catch (de) {
        console.error('[diagnosis] Sync fallback failed:', de);
      }
    }
  }

  return {
    score,
    totalMarks: Number(attempt.test.totalMarks),
    answeredCount: savedAnswers.filter((a) => a.selectedOption !== null).length,
    diagnosisQueued: true,
  };
}

// ─── Result ───────────────────────────────────────────────────

export async function getAttemptResult(attemptId: string, userId: string) {
  const attempt = await prisma.attempt.findUnique({
    where: { id: attemptId },
    select: {
      id: true,
      studentId: true,
      status: true,
      score: true,
      totalMarks: true,
      timeTakenSecs: true,
      startedAt: true,
      submittedAt: true,
      testId: true,
    },
  });
  if (!attempt) throw new NotFoundError('Attempt');
  if (attempt.studentId !== userId) throw new ForbiddenError();

  if (attempt.status !== 'submitted') {
    return { attempt, diagnosis: null, diagnosisReady: false };
  }

  const diagnosis = await prisma.diagnosisResult.findUnique({
    where: { attemptId },
    select: {
      id: true,
      knowledgeRank: true,
      strategyRank: true,
      overconfidentCount: true,
      underconfidentCount: true,
      topMistakeType: true,
      aajKaKaam: true,
      readinessPct: true,
      createdAt: true,
    },
  });

  // Also include per-question breakdown with correct answers
  const answers = await prisma.attemptAnswer.findMany({
    where: { attemptId },
    select: {
      questionId: true,
      selectedOption: true,
      isCorrect: true,
      timeSpentSecs: true,
      confidenceTag: true,
      flagged: true,
      question: { select: { correctOption: true, explanation: true } },
    },
  });

  return {
    attempt,
    diagnosis,
    diagnosisReady: !!diagnosis,
    answers,
  };
}
