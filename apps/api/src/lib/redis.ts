import Redis from 'ioredis';
import { Queue } from 'bullmq';
import { config } from './config';

export const redis = new Redis(config.REDIS_URL, {
  maxRetriesPerRequest: null,   // required by BullMQ
  enableReadyCheck: false,
  // In development with no local Redis, suppress reconnect spam
  retryStrategy: config.isDev ? () => null : undefined,
  lazyConnect: true,
});

redis.on('error', (err) => console.error('Redis error:', err));

// ── Redis key patterns ────────────────────────────────────────
// otp:{phone}                      → OTP hash (TTL 5m)
// rate:otp:{phone}                 → OTP rate limit counter (TTL 15m)
// session:{userId}                 → active session metadata (TTL 24h)
// battle:{battleId}:state          → battle room state (TTL 1h)
// battle:{battleId}:answers:{uid}  → submitted answers in flight (TTL 30m)
// live_test:{testId}:scores        → live leaderboard (TTL 4h)
// ai:explain:{questionId}          → cached AI explanation (TTL 24h)
// ai:kaam:{userId}                 → cached Aaj ka kaam (TTL 24h)

export const KEYS = {
  otp: (phone: string) => `otp:${phone}`,
  session: (userId: string) => `session:${userId}`,
  battleInvite: (code: string) => `battle:invite:${code}`,
  batchInvite:  (token: string) => `batch:invite:${token}`,
  battleState: (id: string) => `battle:${id}:state`,
  battleAnswers: (battleId: string, playerId: string) =>
    `battle:${battleId}:answers:${playerId}`,
  liveScores: (testId: string) => `live_test:${testId}:scores`,
  aiExplain: (questionId: string) => `ai:explain:${questionId}`,
  aiKaam: (userId: string) => `ai:kaam:${userId}`,
} as const;

// ── BullMQ Queues ─────────────────────────────────────────────
const queueOpts = { connection: redis };

export const diagnosisQueue = new Queue('diagnosis', queueOpts);
export const notificationQueue = new Queue('notification', queueOpts);
export const irtQueue = new Queue('irt', queueOpts);
export const payoutQueue = new Queue('payout', queueOpts);
export const battleQueue = new Queue('battle', queueOpts);

export const JOBS = {
  COMPUTE_DIAGNOSIS: 'diagnosis.compute',
  COMPUTE_BATTLE_DIAGNOSIS: 'diagnosis.battle',
  IRT_RECALIBRATE: 'irt.recalibrate',
  SEND_NOTIFICATION: 'notification.send',
  CALCULATE_PAYOUT: 'payout.calculate',
  BATTLE_TIMER: 'battle.timer',
} as const;
