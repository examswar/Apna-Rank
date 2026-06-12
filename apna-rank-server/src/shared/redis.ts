import Redis from 'ioredis';
import { Queue } from 'bullmq';
import { config } from './config';

// ── Redis connection factory ──────────────────────────────────
// Call this to create independent connections (e.g. Socket.IO pub/sub).
// Each Socket.IO adapter needs its OWN pub and sub connection — never
// reuse the main `redis` instance for pub/sub.
export function createRedisClient(): Redis {
  return new Redis(config.REDIS_URL, {
    maxRetriesPerRequest: null, // required for BullMQ long-polling commands
    enableReadyCheck: false,    // required for BullMQ
    lazyConnect: true,
    keepAlive: 30_000,          // TCP keepalive every 30s — prevents idle timeout from NAT/LB
    connectTimeout: 10_000,
    commandTimeout: 5_000,
    retryStrategy: (times) => {
      if (times > 20) return null; // stop retrying after 20 attempts — let it surface
      return Math.min(times * 200, 5_000); // exponential back-off capped at 5s
    },
  });
}

// Primary shared client used for caching, rate limiting, BullMQ queues
export const redis = createRedisClient();

redis.on('connect',  () => console.log(`Redis connected (pid=${process.pid})`));
redis.on('error',    (err) => console.error('Redis error:', err));
redis.on('close',    () => console.warn('Redis connection closed'));

// ── Redis key patterns ────────────────────────────────────────
// battle:{battleId}:state          → battle room state (TTL 1h)
// battle:{battleId}:answers:{uid}  → submitted answers in flight (TTL 30m)
// session:{userId}                 → active session metadata (TTL 24h)
// rate:{ip}:{endpoint}             → rate limit counter (TTL 1m)
// live_test:{testId}:scores        → live leaderboard (TTL 4h)
// otp:{phone}                      → OTP for phone login (TTL 5m)
// ai:explain:{questionId}          → cached AI explanation (TTL 24h)
// ai:kaam:{userId}                 → cached Aaj ka kaam (TTL 24h)

export const KEYS = {
  battleState:   (id: string) => `battle:${id}:state`,
  battleAnswers: (battleId: string, playerId: string) => `battle:${battleId}:answers:${playerId}`,
  session:       (userId: string) => `session:${userId}`,
  otp:           (phone: string) => `otp:${phone}`,
  liveScores:    (testId: string) => `live_test:${testId}:scores`,
  aiExplain:     (questionId: string) => `ai:explain:${questionId}`,
  aiKaam:        (userId: string) => `ai:kaam:${userId}`,
} as const;

// ── BullMQ Queues ─────────────────────────────────────────────
// BullMQ requires maxRetriesPerRequest: null (set in createRedisClient above)
const queueOpts = { connection: redis };

export const diagnosisQueue    = new Queue('diagnosis',    queueOpts);
export const notificationQueue = new Queue('notification', queueOpts);
export const irtQueue          = new Queue('irt',          queueOpts);
export const payoutQueue       = new Queue('payout',       queueOpts);
export const dropoutQueue      = new Queue('dropout',      queueOpts);

// Job names
export const JOBS = {
  COMPUTE_DIAGNOSIS:  'diagnosis.compute',
  IRT_RECALIBRATE:    'irt.recalibrate',
  SEND_NOTIFICATION:  'notification.send',
  CALCULATE_PAYOUT:   'payout.calculate',
  CHECK_DROPOUT:      'dropout.check',
} as const;
