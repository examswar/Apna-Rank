import 'dotenv/config';
import Fastify from 'fastify';
import fastifyCors from '@fastify/cors';
import fastifyHelmet from '@fastify/helmet';
import fastifyCookie from '@fastify/cookie';
import fastifyJwt from '@fastify/jwt';
import fastifyRateLimit from '@fastify/rate-limit';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import { Server as SocketServer } from 'socket.io';
import { ZodError } from 'zod';
import { prisma } from '@apna-rank/db';

import { config } from './lib/config';
import { AppError } from './lib/errors';
import { fail } from './lib/response';
import { redis } from './lib/redis';

import { startDiagnosisWorker } from './jobs/diagnosis.worker';
import { startBattleWorker } from './jobs/battle.worker';
import { setupBattleNamespace } from './modules/battle/battle.socket';

import authRoutes         from './modules/auth/auth.routes';
import studentRoutes      from './modules/student/student.routes';
import questionRoutes     from './modules/question/question.routes';
import teacherRoutes      from './modules/teacher/teacher.routes';
import instituteRoutes    from './modules/institute/institute.routes';
import testRoutes         from './modules/test/test.routes';
import attemptRoutes      from './modules/attempt/attempt.routes';
import diagnosisRoutes    from './modules/diagnosis/diagnosis.routes';
import battleRoutes       from './modules/battle/battle.routes';
import notificationRoutes from './modules/notification/notification.routes';
import webhookRoutes      from './modules/webhooks/webhook.routes';

async function main() {
  const app = Fastify({
    logger: { level: config.isDev ? 'info' : 'warn' },
    trustProxy: true,
  });

  // Allow empty JSON bodies on endpoints that don't require a body (e.g. POST /publish).
  // Fastify v5 rejects Content-Type: application/json with no body by default.
  // The webhook plugin overrides this with its own scoped Buffer parser.
  app.addContentTypeParser('application/json', { parseAs: 'string' }, (_req, body, done) => {
    try {
      done(null, (body as string).length > 0 ? JSON.parse(body as string) : {});
    } catch (err) {
      (err as any).statusCode = 400;
      done(err as Error);
    }
  });

  // ── Plugins ────────────────────────────────────────────────
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

  await app.register(fastifyRateLimit, {
    global: true,
    max: 100,
    timeWindow: '1 minute',
    // Use Redis store in production for distributed rate-limiting across instances.
    // Fall back to in-memory in development (no local Redis required).
    ...(config.isProd ? { redis } : {}),
    keyGenerator: (req) => req.ip,
    errorResponseBuilder: () =>
      fail('RATE_LIMIT', 'Bahut zyada requests. Ek minute ruko.'),
  });

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

  // ── Global error handler ───────────────────────────────────
  app.setErrorHandler((err: unknown, _req, reply) => {
    if (err instanceof AppError) {
      return reply.status(err.statusCode).send(fail(err.code, err.message));
    }
    if (err instanceof ZodError) {
      const msg = err.errors[0]?.message ?? 'Validation failed';
      return reply.status(422).send(fail('VALIDATION_ERROR', msg));
    }
    if (err instanceof Error && (err as any).validation) {
      return reply.status(422).send(fail('VALIDATION_ERROR', err.message));
    }
    app.log.error(err);
    return reply.status(500).send(fail('INTERNAL_ERROR', 'Internal server error'));
  });

  // ── Health ─────────────────────────────────────────────────
  app.get('/health', async () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  }));

  // ── Routes ─────────────────────────────────────────────────
  await app.register(authRoutes,         { prefix: '/api/v1/auth' });
  await app.register(studentRoutes,      { prefix: '/api/v1/student' });
  await app.register(questionRoutes,     { prefix: '/api/v1' });
  await app.register(teacherRoutes,      { prefix: '/api/v1/teacher' });
  await app.register(instituteRoutes,    { prefix: '/api/v1/institute' });
  await app.register(testRoutes,         { prefix: '/api/v1/tests' });
  await app.register(attemptRoutes,      { prefix: '/api/v1/attempts' });
  await app.register(diagnosisRoutes,    { prefix: '/api/v1/diagnosis' });
  await app.register(battleRoutes,       { prefix: '/api/v1/battle' });
  await app.register(notificationRoutes, { prefix: '/api/v1/notifications' });
  await app.register(webhookRoutes,      { prefix: '/api/v1/webhooks' });

  // ── Socket.io (Battle + Live Test real-time) ───────────────
  // In Fastify v5, app.server IS the underlying http.Server — attach directly.
  const io = new SocketServer(app.server, {
    path: '/ws',
    cors: { origin: config.allowedOrigins, credentials: true },
  });

  // /battle namespace — real-time 1v1 game loop
  setupBattleNamespace(io);

  // /live-test namespace — real-time leaderboard updates
  const liveTestNs = io.of('/live-test');
  liveTestNs.on('connection', (socket) => {
    socket.on('join_live_test', (data: { testId: string }) => {
      socket.join(`live:${data.testId}`);
    });
  });

  // Start BullMQ workers only when Redis is reachable
  try {
    await redis.ping();
    startDiagnosisWorker();
    startBattleWorker();
    console.log('    Workers: diagnosis + battle workers started');
  } catch {
    console.log('    Workers: Redis unavailable — workers skipped (dev fallback active)');
  }

  await app.listen({ port: config.port, host: '0.0.0.0' });

  console.log(`✅  Apna Rank API running on :${config.port}`);
  console.log(`    Env:  ${config.NODE_ENV}`);
  console.log(`    Docs: http://localhost:${config.port}/docs`);

  // ── Graceful shutdown ──────────────────────────────────────
  const shutdown = async (signal: string) => {
    console.log(`\n${signal} — shutting down gracefully`);
    await app.close();
    await prisma.$disconnect();
    await redis.quit();
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT',  () => shutdown('SIGINT'));
}

main().catch((err) => {
  console.error('❌  Server failed to start:', err);
  process.exit(1);
});
