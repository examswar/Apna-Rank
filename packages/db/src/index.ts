import { PrismaClient } from '@prisma/client';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

export { PrismaClient };
export type * from '@prisma/client';

export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});

// Sets Postgres session-local variables consumed by RLS policies.
// Must be called inside the same transaction/connection as the guarded query.
// The authenticate middleware calls this per request.
export async function setRLSContext(
  userId: string,
  role: string,
  queryContext: 'default' | 'public_leaderboard' = 'default',
): Promise<void> {
  await prisma.$executeRaw`
    SELECT
      set_config('app.current_user_id', ${userId}, true),
      set_config('app.current_role',    ${role},   true),
      set_config('app.query_context',   ${queryContext}, true)
  `;
}

// AES-256-GCM field-level encryption for PAN numbers and guardian phone numbers.
// Key must be a 64-char hex string (32 bytes). Set via FIELD_ENCRYPTION_KEY env var.
// Key is read lazily so dotenv has time to populate process.env before first use.
function getEncryptionKey(): Buffer {
  return Buffer.from(process.env.FIELD_ENCRYPTION_KEY ?? '', 'hex');
}

export function encryptField(plaintext: string): string {
  const KEY = getEncryptionKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', KEY, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
}

export function decryptField(ciphertext: string): string {
  if (!ciphertext || typeof ciphertext !== 'string') {
    throw new Error('decryptField: ciphertext is empty or not a string');
  }
  const parts = ciphertext.split(':');
  if (parts.length !== 3) {
    throw new Error('decryptField: malformed ciphertext — expected iv:authTag:encrypted');
  }
  const KEY = getEncryptionKey();
  const [ivHex, authTagHex, encryptedHex] = parts;
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const encrypted = Buffer.from(encryptedHex, 'hex');
  if (iv.length !== 12) throw new Error('decryptField: invalid IV length');
  if (authTag.length !== 16) throw new Error('decryptField: invalid authTag length');
  const decipher = createDecipheriv('aes-256-gcm', KEY, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
}
