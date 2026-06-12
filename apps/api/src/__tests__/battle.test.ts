/**
 * Battle Engine — Two-player simulation tests
 *
 * All external dependencies (Prisma, Redis, Socket.io, BullMQ) are mocked.
 * Tests cover: challenge creation, invite-code join, matchmaking, winner
 * calculation, result broadcast, and the full two-player round-trip.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── vi.mock factories must NOT reference outer variables (hoisting) ──────────

vi.mock('@apna-rank/db', () => ({
  prisma: {
    test:        { findFirst: vi.fn() },
    battle:      { create: vi.fn(), findUnique: vi.fn(), update: vi.fn(), updateMany: vi.fn(), count: vi.fn(), findMany: vi.fn() },
    battleAnswer: { createMany: vi.fn() },
  },
}));

vi.mock('../lib/redis', () => ({
  redis: {
    exists: vi.fn(),
    set:    vi.fn(),
    get:    vi.fn(),
    del:    vi.fn(),
    lpop:   vi.fn(),
    lpush:  vi.fn(),
    rpush:  vi.fn(),
    expire: vi.fn(),
  },
  KEYS: {
    battleInvite:  (code: string)                    => `battle:invite:${code}`,
    battleState:   (id: string)                      => `battle:${id}:state`,
    battleAnswers: (bid: string, pid: string)        => `battle:${bid}:answers:${pid}`,
  },
  battleQueue:    { add: vi.fn() },
  diagnosisQueue: { add: vi.fn() },
  JOBS: {
    BATTLE_TIMER:             'battle.timer',
    COMPUTE_BATTLE_DIAGNOSIS: 'diagnosis.battle',
  },
}));

vi.mock('../lib/config', () => ({
  config: { appBaseUrl: 'http://localhost:3000' },
}));

vi.mock('../modules/battle/battle-ns', () => ({
  battleNsRef: { get: vi.fn(), set: vi.fn() },
}));

// ── Import mocked modules to configure them ────────────────────────────────

import { prisma }                          from '@apna-rank/db';
import { redis, battleQueue, diagnosisQueue } from '../lib/redis';
import { battleNsRef }                     from '../modules/battle/battle-ns';
import * as BattleService                  from '../modules/battle/battle.service';

// ── Constants ──────────────────────────────────────────────────────────────

const EXAM_CATEGORY = 'SSC_CGL';
const TEST_ID       = 'test-uuid-1';
const BATTLE_ID     = 'battle-uuid-1';
const PLAYER1_ID    = 'player1-uuid';
const PLAYER2_ID    = 'player2-uuid';

const QUESTIONS = [
  { id: 'q1', correctOption: 'B' },
  { id: 'q2', correctOption: 'A' },
  { id: 'q3', correctOption: 'C' },
];

// ── Helpers ────────────────────────────────────────────────────────────────

const mockEmit = vi.fn();
const mockTo   = vi.fn(() => ({ emit: mockEmit }));
const mockNs   = { to: mockTo };

/** In-memory Redis store used across all tests */
const redisStore = new Map<string, string>();

function buildActiveBattleInDB() {
  return {
    id: BATTLE_ID,
    player1Id: PLAYER1_ID,
    player2Id: PLAYER2_ID,
    status: 'active',
    testId: TEST_ID,
    test: {
      testQuestions: QUESTIONS.map((q) => ({
        question: { id: q.id, correctOption: q.correctOption },
      })),
    },
  };
}

function buildActiveBattleState(qCount = QUESTIONS.length) {
  return JSON.stringify({
    status: 'active',
    player1Id: PLAYER1_ID,
    player2Id: PLAYER2_ID,
    testId: TEST_ID,
    questionCount: qCount,
    timeLimitSecs: 300,
    startedAt: Date.now(),
  });
}

// ── Test setup ─────────────────────────────────────────────────────────────

beforeEach(() => {
  redisStore.clear();
  vi.clearAllMocks();

  // Socket.io namespace mock
  (battleNsRef.get as ReturnType<typeof vi.fn>).mockReturnValue(mockNs);

  // Redis mock — delegate to in-memory store
  (redis.exists as ReturnType<typeof vi.fn>).mockImplementation(
    async (key: string) => (redisStore.has(key) ? 1 : 0),
  );
  (redis.set as ReturnType<typeof vi.fn>).mockImplementation(
    async (key: string, value: string) => { redisStore.set(key, value); return 'OK'; },
  );
  (redis.get as ReturnType<typeof vi.fn>).mockImplementation(
    async (key: string) => redisStore.get(key) ?? null,
  );
  (redis.del as ReturnType<typeof vi.fn>).mockImplementation(async (...args: any[]) => {
    // del can be called as del(k1, k2, k3) or del([k1, k2, k3])
    const keys = args.flat();
    keys.forEach((k: string) => redisStore.delete(k));
    return keys.length;
  });
  (redis.lpop as ReturnType<typeof vi.fn>).mockResolvedValue(null);
  (redis.lpush as ReturnType<typeof vi.fn>).mockResolvedValue(1);
  (redis.rpush as ReturnType<typeof vi.fn>).mockResolvedValue(1);
  (redis.expire as ReturnType<typeof vi.fn>).mockResolvedValue(1);

  // BullMQ queues
  (battleQueue.add    as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'job-timer-1' });
  (diagnosisQueue.add as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'job-diag-1' });

  // Prisma — test.findFirst
  (prisma.test.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
    id: TEST_ID,
    durationSecs: 300,
    _count: { testQuestions: QUESTIONS.length },
  });

  // Prisma — battle.create
  (prisma.battle.create as ReturnType<typeof vi.fn>).mockImplementation(async (args: any) => {
    const battle = {
      id: BATTLE_ID,
      player1Id: args.data.player1Id,
      player2Id: args.data.player2Id ?? null,
      testId:    args.data.testId,
      examCategory: args.data.examCategory,
      status:    args.data.status,
      startedAt: args.data.startedAt ?? null,
    };
    redisStore.set(`__db:battle:${battle.id}`, JSON.stringify(battle));
    return battle;
  });

  // Prisma — battle.findUnique (returns from in-memory store; adds test include on demand)
  (prisma.battle.findUnique as ReturnType<typeof vi.fn>).mockImplementation(async ({ where, include }: any) => {
    const raw = redisStore.get(`__db:battle:${where.id}`);
    if (!raw) return null;
    const battle = JSON.parse(raw);
    if (include?.test) {
      battle.test = {
        testQuestions: QUESTIONS.map((q) => ({
          question: { id: q.id, correctOption: q.correctOption },
        })),
      };
    }
    return battle;
  });

  // Prisma — battle.update
  (prisma.battle.update as ReturnType<typeof vi.fn>).mockImplementation(async ({ where, data }: any) => {
    const raw = redisStore.get(`__db:battle:${where.id}`);
    const existing = raw ? JSON.parse(raw) : {};
    const updated = { ...existing, ...data };
    if (updated.test === undefined) {
      // Re-attach test for callers that need it
      updated.test = {
        testQuestions: QUESTIONS.map((q) => ({
          question: { id: q.id, correctOption: q.correctOption },
        })),
      };
    }
    redisStore.set(`__db:battle:${where.id}`, JSON.stringify({ ...updated, test: undefined }));
    return updated;
  });

  // Prisma — battle.updateMany (conditional atomic update against the store;
  // mirrors the where-guards the service relies on for TOCTOU safety)
  (prisma.battle.updateMany as ReturnType<typeof vi.fn>).mockImplementation(async ({ where, data }: any) => {
    const raw = redisStore.get(`__db:battle:${where.id}`);
    if (!raw) return { count: 0 };
    const battle = JSON.parse(raw);
    if (where.status !== undefined && battle.status !== where.status) return { count: 0 };
    if (where.player2Id !== undefined && battle.player2Id !== where.player2Id) return { count: 0 };
    if (where.player1Id?.not !== undefined && battle.player1Id === where.player1Id.not) return { count: 0 };
    redisStore.set(`__db:battle:${where.id}`, JSON.stringify({ ...battle, ...data }));
    return { count: 1 };
  });

  (prisma.battle.count   as ReturnType<typeof vi.fn>).mockResolvedValue(0);
  (prisma.battle.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);
  (prisma.battleAnswer.createMany as ReturnType<typeof vi.fn>).mockResolvedValue({ count: 0 });
});

// ── Tests ──────────────────────────────────────────────────────────────────

describe('createChallenge', () => {
  it('creates a WAITING battle and returns an 8-char invite code', async () => {
    const result = await BattleService.createChallenge(PLAYER1_ID, EXAM_CATEGORY);

    expect(result.battleId).toBe(BATTLE_ID);
    expect(result.inviteCode).toHaveLength(8);
    expect(result.inviteCode).toMatch(/^[A-Z2-9]+$/);
    expect(result.inviteUrl).toBe(`http://localhost:3000/battle/join/${result.inviteCode}`);

    // Invite code stored in Redis
    const storedId = redisStore.get(`battle:invite:${result.inviteCode}`);
    expect(storedId).toBe(BATTLE_ID);
  });

  it('throws NOT_FOUND when no battle test exists for the exam category', async () => {
    (prisma.test.findFirst as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null);

    await expect(BattleService.createChallenge(PLAYER1_ID, EXAM_CATEGORY))
      .rejects.toMatchObject({ code: 'NOT_FOUND' });
  });
});

describe('joinByInviteCode', () => {
  function seedWaitingBattle(code: string) {
    redisStore.set(`battle:invite:${code}`, BATTLE_ID);
    redisStore.set(`__db:battle:${BATTLE_ID}`, JSON.stringify({
      id: BATTLE_ID, player1Id: PLAYER1_ID, player2Id: null, status: 'waiting',
    }));
    redisStore.set(`battle:${BATTLE_ID}:state`, JSON.stringify({
      status: 'waiting', player1Id: PLAYER1_ID, player2Id: null, questionCount: 3, timeLimitSecs: 300,
    }));
  }

  it('activates the battle and notifies player1 via Socket.io', async () => {
    seedWaitingBattle('TESTCODE');

    const result = await BattleService.joinByInviteCode('TESTCODE', PLAYER2_ID);

    expect(result.status).toBe('active');
    expect(result.battleId).toBe(BATTLE_ID);

    // player1 must be notified
    expect(mockTo).toHaveBeenCalledWith(`battle:${BATTLE_ID}`);
    expect(mockEmit).toHaveBeenCalledWith('opponent_joined', { battleId: BATTLE_ID, player2Id: PLAYER2_ID });

    // invite code cleaned up
    expect(redisStore.has(`battle:invite:TESTCODE`)).toBe(false);

    // timer job queued
    expect(battleQueue.add).toHaveBeenCalledWith(
      'battle.timer',
      { battleId: BATTLE_ID },
      expect.objectContaining({ delay: 300_000, jobId: `timer:${BATTLE_ID}` }),
    );
  });

  it('throws NOT_FOUND for an unknown invite code', async () => {
    await expect(BattleService.joinByInviteCode('BADCODE1', PLAYER2_ID))
      .rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  it('throws CONFLICT when player tries to join their own battle', async () => {
    seedWaitingBattle('SELFCODE');
    await expect(BattleService.joinByInviteCode('SELFCODE', PLAYER1_ID))
      .rejects.toMatchObject({ code: 'CONFLICT' });
  });

  it('throws CONFLICT if the battle is no longer WAITING', async () => {
    const code = 'OLDCODE1';
    redisStore.set(`battle:invite:${code}`, BATTLE_ID);
    redisStore.set(`__db:battle:${BATTLE_ID}`, JSON.stringify({
      id: BATTLE_ID, player1Id: PLAYER1_ID, player2Id: PLAYER2_ID, status: 'active',
    }));
    await expect(BattleService.joinByInviteCode(code, 'other-player'))
      .rejects.toMatchObject({ code: 'CONFLICT' });
  });
});

describe('matchmake', () => {
  it('returns waiting when no opponent is in the queue', async () => {
    const result = await BattleService.matchmake(PLAYER1_ID, EXAM_CATEGORY);
    expect(result.status).toBe('waiting');
    expect(result.battleId).toBeNull();
    expect(redis.rpush).toHaveBeenCalled();
  });

  it('creates an ACTIVE battle when an opponent is waiting in the queue', async () => {
    (redis.lpop as ReturnType<typeof vi.fn>).mockResolvedValueOnce(PLAYER2_ID);

    const result = await BattleService.matchmake(PLAYER1_ID, EXAM_CATEGORY);

    expect(result.status).toBe('matched');
    expect(result.battleId).toBe(BATTLE_ID);

    expect(battleQueue.add).toHaveBeenCalledWith(
      'battle.timer',
      { battleId: BATTLE_ID },
      expect.objectContaining({ delay: 300_000 }),
    );
  });
});

describe('resolveBattle', () => {
  beforeEach(() => {
    // Seed an active battle in both DB mock and Redis
    redisStore.set(`__db:battle:${BATTLE_ID}`, JSON.stringify({
      id: BATTLE_ID, player1Id: PLAYER1_ID, player2Id: PLAYER2_ID, status: 'active', testId: TEST_ID,
    }));
    redisStore.set(`battle:${BATTLE_ID}:state`, buildActiveBattleState());
  });

  it('player1 wins when they score higher', async () => {
    // player1: 2/3 correct (q1:B✓, q2:B✗, q3:C✓)
    redisStore.set(`battle:${BATTLE_ID}:answers:${PLAYER1_ID}`, JSON.stringify([
      { questionId: 'q1', selectedOption: 'B', timeSpentSecs: 15 },
      { questionId: 'q2', selectedOption: 'B', timeSpentSecs: 20 },
      { questionId: 'q3', selectedOption: 'C', timeSpentSecs: 18 },
    ]));
    // player2: 1/3 correct (q1:A✗, q2:A✓, q3:A✗)
    redisStore.set(`battle:${BATTLE_ID}:answers:${PLAYER2_ID}`, JSON.stringify([
      { questionId: 'q1', selectedOption: 'A', timeSpentSecs: 12 },
      { questionId: 'q2', selectedOption: 'A', timeSpentSecs: 25 },
      { questionId: 'q3', selectedOption: 'A', timeSpentSecs: 10 },
    ]));

    await BattleService.resolveBattle(BATTLE_ID);

    const updateCall = (prisma.battle.update as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(updateCall.data.winnerId).toBe(PLAYER1_ID);
    // status transition happens via the atomic updateMany guard, not update
    expect(prisma.battle.updateMany).toHaveBeenCalledWith({
      where: { id: BATTLE_ID, status: 'active' },
      data: { status: 'completed' },
    });

    expect(mockEmit).toHaveBeenCalledWith('battle_result', expect.objectContaining({
      winnerId: PLAYER1_ID,
      isDraw: false,
      scores: { [PLAYER1_ID]: 2, [PLAYER2_ID]: 1 },
    }));
  });

  it('player2 wins when they score higher', async () => {
    // player1: all wrong
    redisStore.set(`battle:${BATTLE_ID}:answers:${PLAYER1_ID}`, JSON.stringify(
      QUESTIONS.map((q) => ({ questionId: q.id, selectedOption: 'D', timeSpentSecs: 5 })),
    ));
    // player2: all correct
    redisStore.set(`battle:${BATTLE_ID}:answers:${PLAYER2_ID}`, JSON.stringify(
      QUESTIONS.map((q) => ({ questionId: q.id, selectedOption: q.correctOption, timeSpentSecs: 10 })),
    ));

    await BattleService.resolveBattle(BATTLE_ID);

    const updateCall = (prisma.battle.update as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(updateCall.data.winnerId).toBe(PLAYER2_ID);
  });

  it('emits a draw when scores are equal', async () => {
    const answers = QUESTIONS.map((q) => ({ questionId: q.id, selectedOption: 'D', timeSpentSecs: 10 }));
    redisStore.set(`battle:${BATTLE_ID}:answers:${PLAYER1_ID}`, JSON.stringify(answers));
    redisStore.set(`battle:${BATTLE_ID}:answers:${PLAYER2_ID}`, JSON.stringify(answers));

    await BattleService.resolveBattle(BATTLE_ID);

    expect(mockEmit).toHaveBeenCalledWith('battle_result', expect.objectContaining({
      isDraw: true,
      winnerId: null,
    }));
  });

  it('flushes answers to the BattleAnswer table with correct isCorrect flags', async () => {
    redisStore.set(`battle:${BATTLE_ID}:answers:${PLAYER1_ID}`, JSON.stringify([
      { questionId: 'q1', selectedOption: 'B', timeSpentSecs: 10 }, // correct
    ]));
    redisStore.set(`battle:${BATTLE_ID}:answers:${PLAYER2_ID}`, JSON.stringify([
      { questionId: 'q1', selectedOption: 'A', timeSpentSecs: 15 }, // wrong
    ]));

    await BattleService.resolveBattle(BATTLE_ID);

    expect(prisma.battleAnswer.createMany).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.arrayContaining([
        expect.objectContaining({ playerId: PLAYER1_ID, questionId: 'q1', isCorrect: true }),
        expect.objectContaining({ playerId: PLAYER2_ID, questionId: 'q1', isCorrect: false }),
      ]),
      skipDuplicates: true,
    }));
  });

  it('queues diagnosis jobs for both players after resolution', async () => {
    redisStore.set(`battle:${BATTLE_ID}:answers:${PLAYER1_ID}`, JSON.stringify([]));
    redisStore.set(`battle:${BATTLE_ID}:answers:${PLAYER2_ID}`, JSON.stringify([]));

    await BattleService.resolveBattle(BATTLE_ID);

    expect(diagnosisQueue.add).toHaveBeenCalledTimes(2);
    expect(diagnosisQueue.add).toHaveBeenCalledWith('diagnosis.battle', { battleId: BATTLE_ID, playerId: PLAYER1_ID });
    expect(diagnosisQueue.add).toHaveBeenCalledWith('diagnosis.battle', { battleId: BATTLE_ID, playerId: PLAYER2_ID });
  });

  it('cleans up all Redis keys after resolution', async () => {
    redisStore.set(`battle:${BATTLE_ID}:answers:${PLAYER1_ID}`, JSON.stringify([]));
    redisStore.set(`battle:${BATTLE_ID}:answers:${PLAYER2_ID}`, JSON.stringify([]));

    await BattleService.resolveBattle(BATTLE_ID);

    expect(redisStore.has(`battle:${BATTLE_ID}:state`)).toBe(false);
    expect(redisStore.has(`battle:${BATTLE_ID}:answers:${PLAYER1_ID}`)).toBe(false);
    expect(redisStore.has(`battle:${BATTLE_ID}:answers:${PLAYER2_ID}`)).toBe(false);
  });

  it('is idempotent — does nothing if the battle is already completed', async () => {
    // Overwrite battle status to completed
    redisStore.set(`__db:battle:${BATTLE_ID}`, JSON.stringify({
      id: BATTLE_ID, player1Id: PLAYER1_ID, player2Id: PLAYER2_ID, status: 'completed', testId: TEST_ID,
    }));

    await BattleService.resolveBattle(BATTLE_ID);

    expect(prisma.battle.update).not.toHaveBeenCalled();
    expect(mockEmit).not.toHaveBeenCalled();
  });
});

describe('Full two-player flow (challenge → join → answer → result)', () => {
  it('completes the full round-trip and declares the correct winner', async () => {
    // ── Step 1: Player1 creates a challenge ──────────────────────
    const challenge = await BattleService.createChallenge(PLAYER1_ID, EXAM_CATEGORY);
    expect(challenge.inviteCode).toHaveLength(8);
    const { inviteCode, battleId } = challenge;
    expect(battleId).toBe(BATTLE_ID);

    // ── Step 2: Player2 joins via the invite link ─────────────────
    // Re-seed the waiting state (createChallenge wrote it via the redis mock)
    // Ensure the DB record reflects waiting status
    redisStore.set(`__db:battle:${BATTLE_ID}`, JSON.stringify({
      id: BATTLE_ID, player1Id: PLAYER1_ID, player2Id: null, status: 'waiting',
    }));
    // Ensure Redis state reflects waiting
    redisStore.set(`battle:${BATTLE_ID}:state`, JSON.stringify({
      status: 'waiting', player1Id: PLAYER1_ID, player2Id: null, questionCount: 3, timeLimitSecs: 300,
    }));

    const join = await BattleService.joinByInviteCode(inviteCode, PLAYER2_ID);
    expect(join.status).toBe('active');

    // player1 must have been notified
    expect(mockEmit).toHaveBeenCalledWith('opponent_joined', expect.objectContaining({ player2Id: PLAYER2_ID }));

    // ── Step 3: Both players submit all answers (via socket handler writes) ──
    redisStore.set(`battle:${BATTLE_ID}:state`, buildActiveBattleState());
    redisStore.set(`__db:battle:${BATTLE_ID}`, JSON.stringify({
      id: BATTLE_ID, player1Id: PLAYER1_ID, player2Id: PLAYER2_ID, status: 'active', testId: TEST_ID,
    }));

    // player1 answers all questions correctly
    redisStore.set(`battle:${BATTLE_ID}:answers:${PLAYER1_ID}`, JSON.stringify(
      QUESTIONS.map((q) => ({ questionId: q.id, selectedOption: q.correctOption, timeSpentSecs: 12 })),
    ));
    // player2 answers all questions incorrectly
    redisStore.set(`battle:${BATTLE_ID}:answers:${PLAYER2_ID}`, JSON.stringify(
      QUESTIONS.map((q) => ({ questionId: q.id, selectedOption: 'D', timeSpentSecs: 8 })),
    ));

    // ── Step 4: Timer fires → resolve ─────────────────────────────
    vi.clearAllMocks();
    (battleNsRef.get as ReturnType<typeof vi.fn>).mockReturnValue(mockNs);
    (prisma.battle.findUnique as ReturnType<typeof vi.fn>).mockImplementation(async ({ where, include }: any) => {
      const raw = redisStore.get(`__db:battle:${where.id}`);
      if (!raw) return null;
      const b = JSON.parse(raw);
      if (include?.test) {
        b.test = { testQuestions: QUESTIONS.map((q) => ({ question: { id: q.id, correctOption: q.correctOption } })) };
      }
      return b;
    });
    (prisma.battle.update as ReturnType<typeof vi.fn>).mockResolvedValue({ status: 'completed' });
    (prisma.battleAnswer.createMany as ReturnType<typeof vi.fn>).mockResolvedValue({ count: 6 });
    (diagnosisQueue.add as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'job-1' });

    await BattleService.resolveBattle(BATTLE_ID);

    // player1 scored 3/3, player2 scored 0/3 → player1 wins
    expect(mockEmit).toHaveBeenCalledWith('battle_result', expect.objectContaining({
      winnerId: PLAYER1_ID,
      isDraw: false,
      scores: { [PLAYER1_ID]: 3, [PLAYER2_ID]: 0 },
    }));

    // Diagnosis queued for both
    expect(diagnosisQueue.add).toHaveBeenCalledTimes(2);
  });
});
