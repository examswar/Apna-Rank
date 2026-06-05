import { Worker, Job } from 'bullmq';
import { prisma } from '@apna-rank/db';
import { redis } from '../lib/redis';

// ─── Rule-based Mistake DNA classifier ───────────────────────────────────────
// Rules evaluated top-to-bottom; first match wins.
//
// GUESS     — confidenceTag=guess AND wrong
// TIME      — timeSpent < 30% of session avgTime AND wrong
// MISREAD   — sure + time > 120% avg + wrong + historically good topic (>70%)
// CALC_SLIP — sure + wrong + historically good topic (>70%)
// CONCEPT   — historically weak topic (<40%) OR fallback (ambiguous)

type MistakeLabel = 'guess' | 'time' | 'calc_slip' | 'misread' | 'concept';

function classifyMistake(params: {
  confidenceTag: 'sure' | 'unsure' | 'guess' | null;
  timeSpent: number;
  avgTime: number;
  historicalAcc: number | null;
}): { type: MistakeLabel; confidence: number } {
  const { confidenceTag, timeSpent, avgTime, historicalAcc } = params;

  if (confidenceTag === 'guess') {
    return { type: 'guess', confidence: 0.95 };
  }
  if (timeSpent < avgTime * 0.3) {
    return { type: 'time', confidence: 0.85 };
  }
  if (historicalAcc !== null && historicalAcc > 0.7 && confidenceTag === 'sure' && timeSpent > avgTime * 1.2) {
    return { type: 'misread', confidence: 0.75 };
  }
  if (historicalAcc !== null && historicalAcc > 0.7 && confidenceTag === 'sure') {
    return { type: 'calc_slip', confidence: 0.75 };
  }
  if (historicalAcc !== null && historicalAcc < 0.4) {
    return { type: 'concept', confidence: 0.80 };
  }
  // Ambiguous — default to concept with low classifier confidence
  return { type: 'concept', confidence: 0.65 };
}

function buildAajKaKaam(topType: MistakeLabel | null, weakestTopic: string): string {
  switch (topType) {
    case 'guess':
      return `Aaj ek kaam: Guess karna band karo. Har question mein pehle 2 options eliminate karo — phir answer choose karo.`;
    case 'time':
      return `Aaj ek kaam: "${weakestTopic}" topic par 5 minute speed drill karo. Har question 60 second se kam mein solve karo.`;
    case 'calc_slip':
      return `Aaj ek kaam: "${weakestTopic}" ke calculations ek baar paper par likh ke verify karo. "Pakka pata hai" ka matlab hai double-check karna.`;
    case 'misread':
      return `Aaj ek kaam: "${weakestTopic}" ke questions mein key words dhyan se padho — NOT, EXCEPT, ALWAYS, numbers ko underline karo.`;
    case 'concept':
    default:
      return `Aaj ek kaam: "${weakestTopic}" ka ek concept aaj revise karo — ek topic, ek ghanta, zero distraction.`;
  }
}

// ─── Core pipeline ────────────────────────────────────────────────────────────
// Exported so attempt.service.ts can call it synchronously in dev (no Redis).

export async function runDiagnosis(attemptId: string, studentId: string): Promise<void> {
  const attempt = await prisma.attempt.findUnique({
    where: { id: attemptId },
    include: {
      test: { select: { totalMarks: true, negativeMarking: true } },
      answers: {
        include: {
          question: { select: { id: true, topic: true, subject: true } },
        },
      },
    },
  });

  if (!attempt || attempt.status !== 'submitted') {
    console.warn(`[diagnosis] Skipping attempt=${attemptId} — not found or not submitted`);
    return;
  }

  // Already processed — idempotency guard
  const existing = await prisma.diagnosisResult.findUnique({ where: { attemptId } });
  if (existing) return;

  const { answers } = attempt;
  const wrongAnswers = answers.filter((a) => a.isCorrect === false);

  // Perfect score — no mistakes to classify
  if (wrongAnswers.length === 0) {
    const scorePct = attempt.score && attempt.totalMarks
      ? Math.min(100, (Number(attempt.score) / Number(attempt.totalMarks)) * 100)
      : 100;
    await prisma.diagnosisResult.create({
      data: {
        attemptId,
        studentId,
        knowledgeRank: Math.round(scorePct),
        strategyRank: 100,
        overconfidentCount: 0,
        underconfidentCount: 0,
        topMistakeType: null,
        aajKaKaam: `Bahut badhiya! Saare questions sahi kiye. Kal ek nayi topic try karo.`,
        readinessPct: Math.round(scorePct),
        isMinorData: attempt.isMinorData,
      },
    });
    return;
  }

  // ── Avg time for the session ──────────────────────────────────────────────
  const timedAnswers = answers.filter((a) => a.timeSpentSecs !== null);
  const avgTime =
    timedAnswers.length > 0
      ? timedAnswers.reduce((s, a) => s + (a.timeSpentSecs ?? 0), 0) / timedAnswers.length
      : 60;

  // ── Historical accuracy by topic (single batch query) ────────────────────
  const uniqueTopics = [
    ...new Set(answers.map((a) => a.question.topic).filter((t): t is string => Boolean(t))),
  ];

  const historicalAccuracyMap = new Map<string, number>();

  if (uniqueTopics.length > 0) {
    const pastAnswers = await prisma.attemptAnswer.findMany({
      where: {
        attemptId: { not: attemptId },
        attempt: { studentId, status: 'submitted' },
        question: { topic: { in: uniqueTopics } },
        isCorrect: { not: null },
      },
      select: { isCorrect: true, question: { select: { topic: true } } },
      take: 500,
    });

    const topicStats: Record<string, { correct: number; total: number }> = {};
    for (const a of pastAnswers) {
      const topic = a.question.topic;
      if (!topic) continue;
      topicStats[topic] ??= { correct: 0, total: 0 };
      topicStats[topic].total++;
      if (a.isCorrect) topicStats[topic].correct++;
    }
    for (const [topic, stats] of Object.entries(topicStats)) {
      if (stats.total >= 3) historicalAccuracyMap.set(topic, stats.correct / stats.total);
    }
  }

  // ── Classify each wrong answer ────────────────────────────────────────────
  const classifications: Array<{
    answerId: string;
    questionId: string;
    type: MistakeLabel;
    classifierConfidence: number;
  }> = [];

  for (const answer of wrongAnswers) {
    const topic = answer.question.topic ?? null;
    const { type, confidence } = classifyMistake({
      confidenceTag: answer.confidenceTag as 'sure' | 'unsure' | 'guess' | null,
      timeSpent: answer.timeSpentSecs ?? avgTime,
      avgTime,
      historicalAcc: topic ? (historicalAccuracyMap.get(topic) ?? null) : null,
    });
    classifications.push({ answerId: answer.id, questionId: answer.questionId, type, classifierConfidence: confidence });
  }

  // ── Confidence calibration ────────────────────────────────────────────────
  let overconfidentCount = 0;
  let underconfidentCount = 0;
  for (const a of answers) {
    if (a.isCorrect === false && a.confidenceTag === 'sure') overconfidentCount++;
    if (a.isCorrect === true && (a.confidenceTag === 'unsure' || a.confidenceTag === 'guess')) underconfidentCount++;
  }

  // ── Top mistake type ──────────────────────────────────────────────────────
  const typeCounts: Record<string, number> = {};
  for (const c of classifications) typeCounts[c.type] = (typeCounts[c.type] ?? 0) + 1;
  const topEntry = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0];
  const topMistakeType = (topEntry?.[0] ?? null) as MistakeLabel | null;

  // ── Weakest topic (most wrong answers) ───────────────────────────────────
  const topicWrongs: Record<string, number> = {};
  for (const answer of wrongAnswers) {
    const label = answer.question.topic ?? answer.question.subject ?? 'General';
    topicWrongs[label] = (topicWrongs[label] ?? 0) + 1;
  }
  const weakestTopic =
    Object.entries(topicWrongs).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'revision';

  const aajKaKaam = buildAajKaKaam(topMistakeType, weakestTopic);

  // ── Scores & ranks ────────────────────────────────────────────────────────
  const scorePct =
    attempt.score !== null && attempt.totalMarks
      ? Math.max(0, (Number(attempt.score) / Number(attempt.totalMarks)) * 100)
      : 0;
  const calibrationScore = Math.max(0, 100 - overconfidentCount * 20 - underconfidentCount * 10);
  const readinessPct = Math.round(scorePct * 0.7 + calibrationScore * 0.3);
  const knowledgeRank = Math.max(1, Math.min(100, Math.round(scorePct)));
  const strategyRank = Math.max(1, Math.min(100, Math.round(calibrationScore)));

  // ── Persist everything ───────────────────────────────────────────────────
  await prisma.$transaction(async (tx) => {
    await tx.diagnosisResult.create({
      data: {
        attemptId,
        studentId,
        knowledgeRank,
        strategyRank,
        overconfidentCount,
        underconfidentCount,
        topMistakeType: topMistakeType as any,
        aajKaKaam,
        readinessPct,
        isMinorData: attempt.isMinorData,
      },
    });

    if (classifications.length > 0) {
      await tx.mistakeClassification.createMany({
        data: classifications.map((c) => ({
          attemptAnswerId: c.answerId,
          studentId,
          questionId: c.questionId,
          mistakeType: c.type as any,
          aiConfidence: c.classifierConfidence,
        })),
        skipDuplicates: true,
      });

      for (const c of classifications) {
        await tx.galtiNotebookEntry.upsert({
          where: { attemptAnswerId: c.answerId },
          create: {
            studentId,
            questionId: c.questionId,
            attemptAnswerId: c.answerId,
            mistakeType: c.type as any,
            wrongCount: 1,
          },
          update: {
            wrongCount: { increment: 1 },
            mistakeType: c.type as any,
          },
        });
      }
    }
  });

  // Update last active timestamp
  await prisma.studentProfile.updateMany({
    where: { userId: studentId },
    data: { lastActiveAt: new Date() },
  });

  console.log(
    `[diagnosis] Done attempt=${attemptId}: ${classifications.length} mistakes → top=${topMistakeType ?? 'none'}`,
  );
}

// ─── BullMQ worker ────────────────────────────────────────────────────────────
// Called from index.ts only after Redis connectivity is confirmed.

export function startDiagnosisWorker(): Worker {
  const worker = new Worker(
    'diagnosis',
    async (job: Job) => {
      const { attemptId, studentId } = job.data as { attemptId: string; studentId: string };
      await runDiagnosis(attemptId, studentId);
    },
    { connection: redis },
  );

  worker.on('error', (err) => {
    console.error('[diagnosis] Worker error:', (err as any).message ?? err);
  });
  worker.on('failed', (job, err) => {
    console.error(`[diagnosis] Job ${job?.id} failed:`, err.message);
  });
  worker.on('completed', (job) => {
    console.log(`[diagnosis] Job ${job?.id} completed`);
  });

  return worker;
}
