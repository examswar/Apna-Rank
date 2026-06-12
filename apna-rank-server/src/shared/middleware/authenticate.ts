import { FastifyRequest, FastifyReply } from 'fastify';
import { JwtPayload } from '../types';
import { UnauthorizedError } from '../errors';

// NOTE: setRLSContext is NOT called here.
// With Prisma connection pooling / PgBouncer, $executeRaw outside a
// transaction uses a random connection — the set_config setting would
// revert immediately before any subsequent query runs.
//
// Services that need RLS protection must use withRLSContext() from
// shared/db.ts to wrap their queries in a transaction where the
// set_config call and the query share the same connection.

export async function authenticate(
  request: FastifyRequest,
  _reply: FastifyReply,
): Promise<void> {
  try {
    const payload = await request.jwtVerify<JwtPayload>();

    request.user = {
      id:           payload.sub,
      role:         payload.role,
      isMinor:      payload.isMinor,
      examCategory: payload.examCategory,
      instituteId:  payload.instituteId,
    };
  } catch {
    throw new UnauthorizedError();
  }
}
