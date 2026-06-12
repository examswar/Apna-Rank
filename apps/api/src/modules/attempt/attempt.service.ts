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

  // Validate the questionId belongs to this test — prevents cross-test answer injection
  const testQuestion = await prisma.testQuestion.findUnique({
    where: { testId_questionId: { testId: attempt.testId, questionId: data.questionId } },
    select: { question: { select: { correctOption: true } } },
  });
  if (!testQuestion) throw new NotFoundError('Question not found in this test');

  const selectedOption = data.selectedOption ?? null;
  const isCorrect =
    selectedOption !== null ? selectedOption === testQuestion.question.correctOption : null;

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

// ─── List attempts (paginated) ────────────────────────────────

export async function listAttempts(userId: string, page: number, limit: number) {
  const skip = (page - 1) * limit;
  const [attempts, total] = await Promise.all([
    prisma.attempt.findMany({
      where: { studentId: userId },
      orderBy: { startedAt: 'desc' },
      skip,
      take: limit,
      select: {
        id: true,
        testId: true,
        status: true,
        score: true,
        totalMarks: true,
        timeTakenSecs: true,
        startedAt: true,
        submittedAt: true,
        test: { select: { title: true, examCategory: true, type: true } },
      },
    }),
    prisma.attempt.count({ where: { studentId: userId } }),
  ]);
  return { attempts, total };
}

// ─── Single attempt detail ─────────────────────────────────────

export async function getAttemptDetail(attemptId: string, userId: string) {
  const attempt = await prisma.attempt.findUnique({
    where: { id: attemptId },
    select: {
      id: true,
      testId: true,
      studentId: true,
      status: true,
      score: true,
      totalMarks: true,
      timeTakenSecs: true,
      startedAt: true,
      submittedAt: true,
      test: {
        select: { title: true, examCategory: true, type: true, durationSecs: true },
      },
      answers: {
        select: {
          questionId: true,
          selectedOption: true,
          isCorrect: true,
          timeSpentSecs: true,
          confidenceTag: true,
          flagged: true,
        },
      },
    },
  });
  if (!attempt) throw new NotFoundError('Attempt');
  if (attempt.studentId !== userId) throw new ForbiddenError();
  return attempt;
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
