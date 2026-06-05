import { FastifyRequest, FastifyReply } from 'fastify';
import { JwtPayload } from '../lib/types';
import { UnauthorizedError } from '../lib/errors';
import { setRLSContext } from '@apna-rank/db';

export async function authenticate(
  request: FastifyRequest,
  _reply: FastifyReply,
): Promise<void> {
  try {
    const payload = await request.jwtVerify<JwtPayload>();

    request.user = {
      id: payload.sub,
      role: payload.role,
      isMinor: payload.isMinor,
      examCategory: payload.examCategory,
      instituteId: payload.instituteId,
    };

    // Inject session context for Postgres RLS policies
    await setRLSContext(payload.sub, payload.role);
  } catch {
    throw new UnauthorizedError();
  }
}
