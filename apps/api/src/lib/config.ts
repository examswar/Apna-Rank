import { config as dotenvConfig } from 'dotenv';
import { resolve } from 'path';
import { z } from 'zod';

// Load .env from monorepo root regardless of where the process is started from.
// __dirname = apps/api/src/lib → ../../../../ = monorepo root
dotenvConfig({ path: resolve(__dirname, '../../../../.env') });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  PORT: z.string().default('8000'),

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

  APP_BASE_URL: z.string().default('http://localhost:3000'),

  // Number of reverse-proxy hops in front of the app (e.g. 1 = one load
  // balancer). Drives Fastify trustProxy so req.ip is the real client IP and
  // cannot be forged via X-Forwarded-For to defeat rate limiting.
  TRUSTED_PROXY_HOPS: z.string().default('1'),

  // OPT-IN local-dev OTP shortcut: store the OTP in memory + print it to the
  // console and skip the real SMS send. Defaults OFF and is INDEPENDENT of
  // NODE_ENV on purpose — a prod box that forgets to set NODE_ENV must NEVER
  // silently fall into "dev OTP" mode. There is no master/bypass OTP.
  AUTH_DEV_OTP: z.enum(['true', 'false']).default('false'),

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
  trustedProxyHops: parseInt(parsed.data.TRUSTED_PROXY_HOPS, 10),
  // Dev OTP shortcut is allowed ONLY when explicitly opted in AND not in prod.
  devOtp: parsed.data.AUTH_DEV_OTP === 'true' && parsed.data.NODE_ENV !== 'production',
  allowedOrigins: parsed.data.ALLOWED_ORIGINS.split(',').map((o) => o.trim()),
  // Normalise PEM keys — Railway stores newlines as \n literals
  jwtPrivateKey: parsed.data.JWT_PRIVATE_KEY.replace(/\\n/g, '\n'),
  jwtPublicKey: parsed.data.JWT_PUBLIC_KEY.replace(/\\n/g, '\n'),
  appBaseUrl: parsed.data.APP_BASE_URL,
};
