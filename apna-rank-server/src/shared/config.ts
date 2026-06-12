import { config as loadEnv } from 'dotenv';
import { existsSync } from 'fs';
import path from 'path';
import { z } from 'zod';

// Load .env from the package dir, then the monorepo root. The bare
// 'dotenv/config' import only reads from process.cwd(), so starting the
// server via turbo/pnpm (cwd = package dir) silently skipped the root .env
// and config validation failed. dotenv never overrides variables that are
// already set, so package-local values win over root, and platform-injected
// env (production) always wins over both.
for (const dir of [path.resolve(__dirname, '../..'), path.resolve(__dirname, '../../..')]) {
  const file = path.join(dir, '.env');
  if (existsSync(file)) loadEnv({ path: file });
}

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  PORT: z.string().default('8000'),
  // Number of cluster worker processes (defaults to CPU count)
  WORKERS: z.string().optional(),
  // Per-worker DB connection pool size. Total DB connections = WORKERS × DB_POOL_SIZE.
  // Set in DATABASE_URL as ?connection_limit=N or configure PgBouncer max_client_conn.
  DB_POOL_SIZE: z.string().default('10'),

  DATABASE_URL: z.string(),
  DIRECT_DATABASE_URL: z.string(),

  JWT_PRIVATE_KEY: z.string(),
  JWT_PUBLIC_KEY: z.string(),

  REDIS_URL: z.string(),

  MSG91_AUTH_KEY: z.string(),
  MSG91_TEMPLATE_ID: z.string(),

  ANTHROPIC_API_KEY: z.string(),

  RAZORPAY_KEY_ID: z.string(),
  RAZORPAY_KEY_SECRET: z.string(),
  RAZORPAY_WEBHOOK_SECRET: z.string(),

  R2_ACCOUNT_ID: z.string(),
  R2_ACCESS_KEY_ID: z.string(),
  R2_SECRET_ACCESS_KEY: z.string(),
  R2_BUCKET_NAME: z.string(),
  R2_PUBLIC_URL: z.string(),

  FIELD_ENCRYPTION_KEY: z.string().length(64, 'Must be 64-char hex (openssl rand -hex 32)'),

  ALLOWED_ORIGINS: z.string().default('http://localhost:3000'),

  // Number of reverse-proxy hops in front of the app (e.g. 1 for a single
  // load balancer). Used as Fastify `trustProxy` so req.ip is the real client
  // IP and cannot be forged via X-Forwarded-For. Must match your infra.
  TRUSTED_PROXY_HOPS: z.string().default('1'),

  SENTRY_DSN: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const config = {
  ...parsed.data,
  port: parseInt(parsed.data.PORT, 10),
  isDev: parsed.data.NODE_ENV === 'development',
  isProd: parsed.data.NODE_ENV === 'production',
  dbPoolSize: parseInt(parsed.data.DB_POOL_SIZE, 10),
  trustedProxyHops: parseInt(parsed.data.TRUSTED_PROXY_HOPS, 10),
  allowedOrigins: parsed.data.ALLOWED_ORIGINS.split(',').map((o) => o.trim()),
  // Normalise PEM keys (Railway stores newlines as \n literals)
  jwtPrivateKey: parsed.data.JWT_PRIVATE_KEY.replace(/\\n/g, '\n'),
  jwtPublicKey: parsed.data.JWT_PUBLIC_KEY.replace(/\\n/g, '\n'),
};
