import { PrismaClient } from '@prisma/client';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import { config } from './config';

export const prisma = new PrismaClient({
  log: config.isDev ? ['error', 'warn'] : ['error'],
});

// ── RLS context (connection-pooling safe) ─────────────────────
//
// IMPORTANT: set_config(..., isLocal=true) is transaction-scoped.
// With PgBouncer or Prisma connection pooling, calling $executeRaw
// outside a transaction means the setting reverts immediately —
// subsequent queries run on a different connection and see no context.
//
// Always use withRLSContext() to wrap your DB queries. It opens a
// single Prisma interactive transaction, sets the context, runs your
// query, then commits — all on the SAME connection.
//
// Usage:
//   const data = await withRLSContext(req.user.id, req.user.role, (tx) =>
//     tx.attempt.findMany({ where: { studentId: req.user.id } })
//   );

export async function withRLSContext<T>(
  userId: string,
  role: string,
  fn: (tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>) => Promise<T>,
  queryContext: 'default' | 'public_leaderboard' = 'default',
): Promise<T> {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`
      SELECT
        set_config('app.current_user_id', ${userId},       true),
        set_config('app.current_role',    ${role},         true),
        set_config('app.query_context',   ${queryContext}, true)
    `;
    return fn(tx);
  });
}

// Legacy helper — safe only when NOT using PgBouncer / connection pooling.
// Kept for use in standalone scripts or seed files.
export async function setRLSContext(
  userId: string,
  role: string,
  queryContext: 'default' | 'public_leaderboard' = 'default',
): Promise<void> {
  await prisma.$executeRaw`
    SELECT
      set_config('app.current_user_id', ${userId},       true),
      set_config('app.current_role',    ${role},         true),
      set_config('app.query_context',   ${queryContext}, true)
  `;
}

// ── Encryption helpers for PAN, guardian phone (AES-256-GCM) ─
// Key must be 32 bytes (64 hex chars) — validated by config schema.
const KEY = Buffer.from(config.FIELD_ENCRYPTION_KEY, 'hex');

export function encryptField(plaintext: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', KEY, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
}

export function decryptField(ciphertext: string): string {
  const parts = ciphertext.split(':');
  if (parts.length !== 3 || !parts[0] || !parts[1] || !parts[2]) {
    throw new Error('Invalid ciphertext format');
  }
  const [ivHex, authTagHex, encryptedHex] = parts;
  const iv        = Buffer.from(ivHex,        'hex');
  const authTag   = Buffer.from(authTagHex,   'hex');
  const encrypted = Buffer.from(encryptedHex, 'hex');
  const decipher = createDecipheriv('aes-256-gcm', KEY, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
}
