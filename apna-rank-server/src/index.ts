// .env loading happens in shared/config.ts (package dir → monorepo root),
// deterministic regardless of the directory the process is started from.
import cluster from 'cluster';
import os from 'os';
import { buildServer, attachSocketIO } from './server';
import { config } from './shared/config';
import { prisma } from './shared/db';
import { redis } from './shared/redis';

const WORKERS = config.WORKERS ? parseInt(config.WORKERS, 10) : os.cpus().length;

if (cluster.isPrimary) {
  console.log(`Primary ${process.pid} — spawning ${WORKERS} workers`);

  // Track crash timestamps per worker to detect boot-loop crashes
  const crashTimes: number[] = [];

  for (let i = 0; i < WORKERS; i++) cluster.fork();

  cluster.on('exit', (worker, code, signal) => {
    console.error(
      `Worker ${worker.process.pid} exited (code=${code} signal=${signal})`,
    );

    // Detect crash loop: if 3+ crashes within 30s, back off for 5s before respawning
    const now = Date.now();
    crashTimes.push(now);
    const recentCrashes = crashTimes.filter((t) => now - t < 30_000).length;
    if (recentCrashes >= 3) {
      console.error(`${recentCrashes} crashes in 30s — respawning with 5s backoff`);
      setTimeout(() => cluster.fork(), 5_000);
    } else {
      cluster.fork();
    }
  });
} else {
  main();
}

async function main() {
  const app = await buildServer();
  await app.ready();

  // Attach Socket.io to Fastify's own http.Server
  // The Redis adapter (configured inside buildServer/attachSocketIO) makes events
  // cross all worker processes automatically
  const { cleanup: socketCleanup } = attachSocketIO(app.server, app);

  await app.listen({ port: config.port, host: '0.0.0.0' });

  console.log(`Worker ${process.pid} ✅ port=${config.port} env=${config.NODE_ENV}`);
  if (!config.isProd) {
    console.log(`  Docs: http://localhost:${config.port}/docs`);
  }

  const shutdown = async (signal: string) => {
    console.log(`Worker ${process.pid} — ${signal} received, draining`);
    await app.close();         // stops accepting new connections, waits for in-flight
    await socketCleanup();     // quit Socket.IO Redis pub/sub clients
    await prisma.$disconnect();
    await redis.quit();
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT',  () => shutdown('SIGINT'));

  // An uncaught exception leaves the process in an undefined state — exit so
  // the cluster primary respawns a clean worker. (Crash-loop backoff is handled
  // in the primary.)
  process.on('uncaughtException', (err) => {
    console.error('Uncaught exception in worker', process.pid, err);
    shutdown('uncaughtException');
  });

  // DO NOT shut the worker down on every unhandled rejection. A single floating
  // promise rejection inside one request handler (easy for an attacker to
  // trigger with a malformed payload) would otherwise take the whole worker
  // offline — repeated, that's a remote DoS. Log it instead; Fastify's own
  // error handler already converts in-request errors into clean 4xx/5xx
  // responses. Wire this to Sentry for visibility.
  process.on('unhandledRejection', (reason) => {
    console.error('Unhandled rejection in worker', process.pid, reason);
  });
}
