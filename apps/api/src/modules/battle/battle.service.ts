import { randomBytes } from 'crypto';
import { prisma } from '@apna-rank/db';
import { redis, KEYS, battleQueue, diagnosisQueue, JOBS } from '../../lib/redis';
import { NotFoundError, ForbiddenError, ConflictError } from '../../lib/errors';
import { config } from '../../lib/config';
import { battleNsRef } from './battle-ns';

const INVITE_TTL = 86400;    // 24 h — invite code lifetime
const BATTLE_STATE_TTL = 7200; // 2 h — Redis battle state lifetime

// ── Helpers ───────────────────────────────────────────────────────────────────

function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I/L ambiguity
  const bytes = randomBytes(8);
  return Array.from(bytes, (b) => chars[b % chars.length]).join('');
}

// ── Create challenge invite ───────────────────────────────────────────────────

export async function createChallenge(userId: string, examCategory: string) {
  const test = await prisma.test.findFirst({
    where: { examCategory: examCategory as any, type: 'battle', isPublished: true },
    select: { id: true, durationSecs: true, _count: { select: { testQuestions: true } } },
  });
  if (!test) throw new NotFoundError('Battle test for this exam category');

  // Collision-safe invite code (retries up to 10 times)
  let inviteCode = '';
  for (let i = 0; i < 10; i++) {
    const candidate = generateInviteCode();
    if (!(await redis.exists(KEYS.battleInvite(candidate)))) {
      inviteCode = candidate;
      break;
    }
  }
  if (!inviteCode) throw new Error('Could not generate unique invite code — try again');

  const battle = await prisma.battle.create({
    data: {
      player1Id: userId,
      testId: test.id,
      examCategory: examCategory as any,
      status: 'waiting',
    },
  });

  await redis.set(KEYS.battleInvite(inviteCode), battle.id, 'EX', INVITE_TTL);
  await redis.set(
    KEYS.battleState(battle.id),
    JSON.stringify({
      status: 'waiting',
      player1Id: userId,
      player2Id: null,
      testId: test.id,
      questionCount: test._count.testQuestions,
      timeLimitSecs: test.durationSecs,
    }),
    'EX', INVITE_TTL,
  );

  return {
    battleId: battle.id,
    inviteCode,
    inviteUrl: `${config.appBaseUrl}/battle/join/${inviteCode}`,
  };
}

// ── Join by invite code ────────────────────────────────────────────────────────

export async function joinByInviteCode(inviteCode: string, userId: string) {
  const battleId = await redis.get(KEYS.battleInvite(inviteCode));
  if (!battleId) throw new NotFoundError('Battle invite');

  // Atomic update: only succeeds if the battle is still WAITING and not your own.
  // This prevents the TOCTOU race where two players both read 'waiting' and both join.
  const updated = await prisma.battle.updateMany({
    where: { id: battleId, status: 'waiting', player2Id: null, player1Id: { not: userId } },
    data: { player2Id: userId, status: 'active', startedAt: new Date() },
  });
  if (updated.count === 0) {
    const battle = await prisma.battle.findUnique({ where: { id: battleId }, select: { player1Id: true, status: true } });
    if (!battle) throw new NotFoundError('Battle');
    if (battle.player1Id === userId) throw new ConflictError('Cannot join your own battle');
    throw new ConflictError('Battle is no longer open');
  }
  const battle = await prisma.battle.findUnique({ where: { id: battleId }, select: { player1Id: true, testId: true } });
  if (!battle) throw new NotFoundError('Battle');

  const stateRaw = await redis.get(KEYS.battleState(battleId));
  const state = stateRaw ? JSON.parse(stateRaw) : {};
  const updatedState = {
    ...state,
    status: 'active',
    player2Id: userId,
    startedAt: Date.now(),
  };
  await redis.set(KEYS.battleState(battleId), JSON.stringify(updatedState), 'EX', BATTLE_STATE_TTL);
  await redis.del(KEYS.battleInvite(inviteCode));

  // Notify player1 if they are already in the Socket.io room
  battleNsRef.get()?.to(`battle:${battleId}`).emit('opponent_joined', {
    battleId,
    player2Id: userId,
  });

  // Queue timer job — battle ends even if players disconnect
  const timeLimitSecs: number = state.timeLimitSecs ?? 600;
  await battleQueue.add(
    JOBS.BATTLE_TIMER,
    { battleId },
    { delay: timeLimitSecs * 1000, jobId: `timer:${battleId}` },
  );

  return { battleId, status: 'active' as const };
}

// ── Matchmake ─────────────────────────────────────────────────────────────────

export async function matchmake(userId: string, examCategory: string) {
  const queueKey = `battle:queue:${examCategory}`;
  const opponentId = await redis.lpop(queueKey);

  if (opponentId && opponentId !== userId) {
    const test = await prisma.test.findFirst({
      where: { examCategory: examCategory as any, type: 'battle', isPublished: true },
      select: { id: true, durationSecs: true, _count: { select: { testQuestions: true } } },
    });

    if (!test) {
      // No test available — restore opponent at HEAD (lpush) so they keep their wait priority
      await redis.lpush(queueKey, opponentId);
      await redis.rpush(queueKey, userId);
      await redis.expire(queueKey, 60, 'NX');
      return { battleId: null, status: 'waiting' as const };
    }

    const battle = await prisma.battle.create({
      data: {
        player1Id: opponentId,
        player2Id: userId,
        testId: test.id,
        examCategory: examCategory as any,
        status: 'active',
        startedAt: new Date(),
      },
    });

    const statePayload = {
      status: 'active',
      player1Id: opponentId,
      player2Id: userId,
      testId: test.id,
      questionCount: test._count.testQuestions,
      timeLimitSecs: test.durationSecs,
      startedAt: Date.now(),
    };
    await redis.set(KEYS.battleState(battle.id), JSON.stringify(statePayload), 'EX', BATTLE_STATE_TTL);

    await battleQueue.add(
      JOBS.BATTLE_TIMER,
      { battleId: battle.id },
      { delay: test.durationSecs * 1000, jobId: `timer:${battle.id}` },
    );

    // Notify both players if they are already connected
    battleNsRef.get()?.to(`battle:${battle.id}`).emit('matched', {
      battleId: battle.id,
      opponentId,
    });

    return { battleId: battle.id, status: 'matched' as const };
  }

  // No opponent found — add self to queue and wait.
  // Use NX so the TTL is only set when the key is first created, not reset on every poll.
  if (opponentId === userId) {
    await redis.rpush(queueKey, userId);
  } else {
    await redis.rpush(queueKey, userId);
  }
  await redis.expire(queueKey, 60, 'NX');
  return { battleId: null, status: 'waiting' as const };
}

// ── Get history ───────────────────────────────────────────────────────────────

export async function getHistory(userId: string, page: number, limit: number) {
  const skip = (page - 1) * limit;
  const [battles, total] = await Promise.all([
    prisma.battle.findMany({
      where: {
        OR: [{ player1Id: userId }, { player2Id: userId }],
        status: { in: ['completed', 'abandoned'] },
      },
      select: {
        id: true,
        examCategory: true,
        status: true,
        winnerId: true,
        startedAt: true,
        endedAt: true,
        player1: { select: { id: true, name: true } },
        player2: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.battle.count({
      where: {
        OR: [{ player1Id: userId }, { player2Id: userId }],
        status: { in: ['completed', 'abandoned'] },
      },
    }),
  ]);

  return { battles, total, page, limit };
}

// ── Get battle state (for initial load) ──────────────────────────────────────

export async function getBattle(battleId: string, userId: string) {
  const battle = await prisma.battle.findUnique({
    where: { id: battleId },
    include: {
      test: {
        include: {
          testQuestions: {
            orderBy: { orderIndex: 'asc' },
            include: {
              question: { select: { id: true, questionText: true, options: true } },
            },
          },
        },
      },
    },
  });

  if (!battle) throw new NotFoundError('Battle');
  if (battle.player1Id !== userId && battle.player2Id !== userId) {
    throw new ForbiddenError();
  }

  return battle;
}

// ── Forfeit ───────────────────────────────────────────────────────────────────

export async function forfeit(battleId: string, userId: string): Promise<void> {
  const battle = await prisma.battle.findUnique({
    where: { id: battleId },
    select: { player1Id: true, player2Id: true, status: true },
  });
  if (!battle) throw new NotFoundError('Battle');
  if (battle.player1Id !== userId && battle.player2Id !== userId) {
    throw new ForbiddenError();
  }
  if (battle.status !== 'active') return;

  const winnerId = battle.player1Id === userId ? battle.player2Id : battle.player1Id;

  // Atomic update prevents double-forfeit race: two concurrent calls both see 'active',
  // but only one updateMany wins; the loser gets count=0 and returns early.
  const transitioned = await prisma.battle.updateMany({
    where: { id: battleId, status: 'active' },
    data: { status: 'abandoned', winnerId, endedAt: new Date() },
  });
  if (transitioned.count === 0) return;

  const ns = battleNsRef.get();
  if (ns) {
    ns.to(`battle:${battleId}`).emit('battle_forfeited', { forfeitedBy: userId, winnerId });
  }

  await redis.del(KEYS.battleState(battleId));
  await redis.del(KEYS.battleAnswers(battleId, userId));
  if (battle.player2Id) {
    await redis.del(KEYS.battleAnswers(battleId, battle.player2Id));
  }
}

// ── Resolve battle (called by timer worker + socket when all answers in) ──────

interface AnswerEntry {
  questionId: string;
  selectedOption: string | null;
  timeSpentSecs: number | null;
}

export async function resolveBattle(battleId: string): Promise<void> {
  const battle = await prisma.battle.findUnique({
    where: { id: battleId },
    include: {
      test: {
        include: {
          testQuestions: {
            include: { question: { select: { id: true, correctOption: true } } },
          },
        },
      },
    },
  });

  if (!battle || !battle.player2Id) return;
  const { player1Id, player2Id } = battle;

  // Atomic status transition: only one concurrent resolver wins.
  const transitioned = await prisma.battle.updateMany({
    where: { id: battleId, status: 'active' },
    data: { status: 'completed' },
  });
  if (transitioned.count === 0) return; // already resolved by a concurrent call

  const [p1Raw, p2Raw] = await Promise.all([
    redis.get(KEYS.battleAnswers(battleId, player1Id)),
    redis.get(KEYS.battleAnswers(battleId, player2Id)),
  ]);

  const p1Answers: AnswerEntry[] = p1Raw ? JSON.parse(p1Raw) : [];
  const p2Answers: AnswerEntry[] = p2Raw ? JSON.parse(p2Raw) : [];

  // Build correctOption lookup
  const correctMap = new Map<string, string>();
  for (const tq of battle.test.testQuestions) {
    correctMap.set(tq.question.id, tq.question.correctOption);
  }

  const scoreP1 = p1Answers.filter(
    (a) => a.selectedOption !== null && correctMap.get(a.questionId) === a.selectedOption,
  ).length;
  const scoreP2 = p2Answers.filter(
    (a) => a.selectedOption !== null && correctMap.get(a.questionId) === a.selectedOption,
  ).length;

  const winnerId = scoreP1 > scoreP2 ? player1Id : scoreP2 > scoreP1 ? player2Id : null;

  await prisma.battle.update({
    where: { id: battleId },
    data: { winnerId, endedAt: new Date() },
  });

  // Flush answers to permanent table
  const dbAnswers = [
    ...p1Answers.map((a) => ({
      battleId,
      playerId: player1Id,
      questionId: a.questionId,
      selectedOption: a.selectedOption,
      isCorrect: a.selectedOption !== null
        ? correctMap.get(a.questionId) === a.selectedOption
        : false,
      timeSpentSecs: a.timeSpentSecs,
    })),
    ...p2Answers.map((a) => ({
      battleId,
      playerId: player2Id,
      questionId: a.questionId,
      selectedOption: a.selectedOption,
      isCorrect: a.selectedOption !== null
        ? correctMap.get(a.questionId) === a.selectedOption
        : false,
      timeSpentSecs: a.timeSpentSecs,
    })),
  ];

  if (dbAnswers.length > 0) {
    await prisma.battleAnswer.createMany({ data: dbAnswers, skipDuplicates: true });
  }

  // Clean up Redis
  await Promise.all([
    redis.del(KEYS.battleState(battleId)),
    redis.del(KEYS.battleAnswers(battleId, player1Id)),
    redis.del(KEYS.battleAnswers(battleId, player2Id)),
  ]);

  const result = {
    battleId,
    winnerId,
    isDraw: winnerId === null,
    scores: { [player1Id]: scoreP1, [player2Id]: scoreP2 },
  };

  battleNsRef.get()?.to(`battle:${battleId}`).emit('battle_result', result);

  // Queue diagnosis jobs for both players
  await Promise.all([
    diagnosisQueue.add(JOBS.COMPUTE_BATTLE_DIAGNOSIS, { battleId, playerId: player1Id }),
    diagnosisQueue.add(JOBS.COMPUTE_BATTLE_DIAGNOSIS, { battleId, playerId: player2Id }),
  ]);
}
