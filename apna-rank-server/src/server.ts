import Fastify, { FastifyInstance } from 'fastify';
import fastifyCors from '@fastify/cors';
import fastifyHelmet from '@fastify/helmet';
import fastifyCookie from '@fastify/cookie';
import fastifyJwt from '@fastify/jwt';
import fastifyRateLimit from '@fastify/rate-limit';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import fastifyCompress from '@fastify/compress';
import underPressure from '@fastify/under-pressure';
import { Server as SocketServer } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { ZodError } from 'zod';

import { config } from './shared/config';
import { AppError } from './shared/errors';
import { fail } from './shared/response';
import { redis, createRedisClient } from './shared/redis';
import { prisma } from './shared/db';

// Modules
import authRoutes from './modules/auth/auth.routes';
import studentRoutes from './modules/student/student.routes';
import questionRoutes from './modules/question/question.routes';
import testRoutes from './modules/test/test.routes';
import attemptRoutes from './modules/attempt/attempt.routes';
import diagnosisRoutes from './modules/diagnosis/diagnosis.routes';
import teacherRoutes from './modules/teacher/teacher.routes';
import instituteRoutes from './modules/institute/institute.routes';
import battleRoutes from './modules/battle/battle.routes';
import aiRoutes from './modules/ai/ai.routes';
import notificationRoutes from './modules/notification/notification.routes';
import adminRoutes from './modules/admin/admin.routes';
import liveTestRoutes from './modules/live-test/live-test.routes';
import marketplaceRoutes from './modules/marketplace/marketplace.routes';

export async function buildServer(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: {
      level: config.isDev ? 'info' : 'warn',
      transport: config.isDev
        ? { target: 'pino-pretty', options: { colorize: true } }
        : undefined,
    },
    // Trust ONLY the number of proxy hops in front of us (LB → app = 1).
    // `true` trusts every hop, letting a client forge X-Forwarded-For and so
    // forge req.ip — which would defeat IP-based rate limiting and abuse caps.
    trustProxy: config.trustedProxyHops,
    // Reject bodies larger than 1 MB (protects against payload attacks)
    bodyLimit: 1_048_576,
    // Abort requests that hang longer than 30s
    connectionTimeout: 30_000,
    // Keep connections alive for up to 75s (slightly above load balancer timeout)
    keepAliveTimeout: 75_000,
  });

  // ── Compression ──────────────────────────────────────────────
  // Brotli for modern clients, gzip as fallback. Cuts payload 60-80%.
  await app.register(fastifyCompress, {
    global: true,
    encodings: ['br', 'gzip', 'deflate'],
    threshold: 1024, // only compress responses > 1KB
  });

  // ── Circuit breaker ──────────────────────────────────────────
  // Returns 503 automatically when event loop lag > 1s or heap > 800 MB.
  // Prevents cascade failure under extreme load.
  await app.register(underPressure, {
    maxEventLoopDelay: 1000,           // ms
    maxHeapUsedBytes: 800 * 1024 * 1024, // 800 MB
    maxRssBytes: 1024 * 1024 * 1024,     // 1 GB
    message: 'Server overloaded. Thoda ruko.',
    retryAfter: 50,
    exposeStatusRoute: false, // /health route below is authoritative
  });

  // ── Plugins ──────────────────────────────────────────────────
  await app.register(fastifyCors, {
    origin: config.allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  await app.register(fastifyHelmet, {
    contentSecurityPolicy: config.isProd,
  });

  await app.register(fastifyCookie);

  await app.register(fastifyJwt, {
    secret: {
      private: config.jwtPrivateKey,
      public: config.jwtPublicKey,
    },
    sign: { algorithm: 'RS256', expiresIn: '15m' },
    cookie: { cookieName: 'refresh_token', signed: false },
  });

  // Rate limiting backed by Redis — shared across all cluster workers
  // Uses userId as key once authenticated (via keyGenerator in authenticate middleware),
  // falls back to IP for unauthenticated endpoints.
  await app.register(fastifyRateLimit, {
    global: true,
    max: 100,
    timeWindow: '1 minute',
    redis,
    keyGenerator: (req) => {
      // Prefer authenticated user ID (set by authenticate middleware)
      // so rate limit is per-user, not per-IP (bypasses NAT/proxies)
      return (req as any).user?.id ?? req.ip;
    },
    errorResponseBuilder: () =>
      fail('RATE_LIMIT', 'Bahut zyada requests. Ek minute ruko.'),
  });

  if (!config.isProd) {
    await app.register(fastifySwagger, {
      openapi: {
        info: { title: 'Apna Rank API', version: '1.0.0' },
        servers: [{ url: `http://localhost:${config.port}` }],
        components: {
          securitySchemes: {
            bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
          },
        },
      },
    });
    await app.register(fastifySwaggerUi, { routePrefix: '/docs' });
  }

  // ── Global error handler ─────────────────────────────────────
  app.setErrorHandler((err, _req, reply) => {
    if (err instanceof AppError) {
      return reply.status(err.statusCode).send(fail(err.code, err.message));
    }
    if (err instanceof ZodError) {
      const message = err.errors[0]?.message ?? 'Validation failed';
      return reply.status(422).send(fail('VALIDATION_ERROR', message));
    }
    if (err.validation) {
      return reply.status(422).send(fail('VALIDATION_ERROR', err.message));
    }
    // 429 from rate limiter arrives as a plain error with statusCode
    if (err.statusCode === 429) {
      return reply.status(429).send(fail('RATE_LIMIT', err.message));
    }
    app.log.error(err);
    return reply.status(500).send(fail('INTERNAL_ERROR', 'Internal server error'));
  });

  // ── Routes ───────────────────────────────────────────────────
  await app.register(authRoutes,         { prefix: '/api/v1/auth' });
  await app.register(studentRoutes,      { prefix: '/api/v1/student' });
  await app.register(questionRoutes,     { prefix: '/api/v1/questions' });
  await app.register(testRoutes,         { prefix: '/api/v1/tests' });
  await app.register(attemptRoutes,      { prefix: '/api/v1/attempts' });
  await app.register(diagnosisRoutes,    { prefix: '/api/v1/diagnosis' });
  await app.register(teacherRoutes,      { prefix: '/api/v1/teacher' });
  await app.register(instituteRoutes,    { prefix: '/api/v1/institute' });
  await app.register(battleRoutes,       { prefix: '/api/v1/battle' });
  await app.register(aiRoutes,           { prefix: '/api/v1/ai' });
  await app.register(notificationRoutes, { prefix: '/api/v1/notifications' });
  await app.register(adminRoutes,        { prefix: '/api/v1/admin' });
  await app.register(liveTestRoutes,     { prefix: '/api/v1/live-tests' });
  await app.register(marketplaceRoutes,  { prefix: '/api/v1/marketplace' });

  // ── Health ───────────────────────────────────────────────────
  // Load balancer hits this every ~5s. Check DB + Redis for real readiness.
  app.get('/health', async (_req, reply) => {
    try {
      await Promise.all([
        prisma.$queryRaw`SELECT 1`,
        redis.ping(),
      ]);
      return reply.send({
        status: 'ok',
        pid: process.pid,
        ts: new Date().toISOString(),
      });
    } catch (err) {
      app.log.error(err, 'health check failed');
      return reply.status(503).send({
        status: 'error',
        ts: new Date().toISOString(),
      });
    }
  });

  return app;
}

// Socket.io — attached after http server is live in index.ts.
// `app` is needed so we can reuse the same JWT verifier as the REST API.
export function attachSocketIO(
  httpServer: import('http').Server,
  app: FastifyInstance,
): {
  io: SocketServer;
  cleanup: () => Promise<void>;
} {
  const io = new SocketServer(httpServer, {
    path: '/ws',
    cors: { origin: config.allowedOrigins, credentials: true },
    // Force WebSocket transport — skip HTTP long-polling entirely.
    // Long-polling can't scale to 1M+ concurrent because each poll holds
    // an HTTP connection open. WebSocket uses one persistent TCP connection.
    transports: ['websocket'],
    pingTimeout: 60_000,
    pingInterval: 25_000,
    // 1MB max message size (protect against large payloads)
    maxHttpBufferSize: 1_048_576,
  });

  // ── Redis adapter (REQUIRED for cluster / multi-instance) ────
  // Without this, socket.emit() only reaches clients connected to
  // the SAME process. With Redis pub/sub, events fan out to all workers.
  const pubClient = createRedisClient();
  const subClient = createRedisClient();
  io.adapter(createAdapter(pubClient, subClient));

  // ── Socket authentication ────────────────────────────────────
  // EVERY socket connection must present a valid access token, the same
  // RS256 JWT the REST API issues. Without this, anonymous clients could
  // open unlimited sockets, join any battle room, eavesdrop on opponents,
  // and emit forged game events. The verified identity is pinned to the
  // socket so per-event handlers can trust socket.data.user, not client input.
  const authenticateSocket = (
    socket: import('socket.io').Socket,
    next: (err?: Error) => void,
  ) => {
    try {
      const raw =
        (socket.handshake.auth?.token as string | undefined) ??
        socket.handshake.headers['authorization']?.replace(/^Bearer\s+/i, '');
      if (!raw) return next(new Error('UNAUTHORIZED'));
      const payload = app.jwt.verify<{ sub: string; role: string; isMinor: boolean }>(raw);
      socket.data.user = { id: payload.sub, role: payload.role, isMinor: payload.isMinor };
      next();
    } catch {
      next(new Error('UNAUTHORIZED'));
    }
  };

  // Battle namespace — real-time 1v1 game loop
  const battle = io.of('/battle');
  battle.use(authenticateSocket);
  battle.on('connection', (socket) => {
    // Battle is an adult-only (18+) feature — mirror the REST blockMinors guard.
    if (socket.data.user?.isMinor) {
      socket.disconnect(true);
      return;
    }

    socket.on('join_battle', async (data: { battleId: string }) => {
      // Only let a player join a battle they are actually a participant in.
      const battleId = String(data?.battleId ?? '');
      if (!/^[0-9a-f-]{36}$/i.test(battleId)) return;
      const row = await prisma.battle.findFirst({
        where: {
          id: battleId,
          OR: [{ player1Id: socket.data.user.id }, { player2Id: socket.data.user.id }],
        },
        select: { id: true },
      });
      if (!row) return; // not your battle — silently ignore
      socket.join(`battle:${battleId}`);
      socket.to(`battle:${battleId}`).emit('opponent_joined');
    });

    socket.on('submit_answer', (_data: {
      battleId: string;
      questionId: string;
      option: string;
      confidence: string;
    }) => {
      // TODO: validate socket is in this battle room (socket.rooms), then
      // store in Redis battle:{id}:answers:{socket.data.user.id}
      // TODO: if both players answered all Qs → compute result, emit battle_result
    });

    socket.on('disconnect', () => {
      // TODO: if disconnect > 30s → mark battle ABANDONED
    });
  });

  // Live test namespace — real-time leaderboard
  const liveTest = io.of('/live-test');
  liveTest.use(authenticateSocket);
  liveTest.on('connection', (socket) => {
    socket.on('join_live_test', (data: { testId: string }) => {
      const testId = String(data?.testId ?? '');
      if (!/^[0-9a-f-]{36}$/i.test(testId)) return;
      socket.join(`live:${testId}`);
    });
  });

  const cleanup = async () => {
    await Promise.allSettled([pubClient.quit(), subClient.quit()]);
  };

  return { io, cleanup };
}
