import { FastifyRequest, FastifyReply } from 'fastify';
import { UserRole } from '../lib/types';
import { ForbiddenError } from '../lib/errors';
import { prisma } from '@apna-rank/db';

export function requireRole(...roles: UserRole[]) {
  return async (request: FastifyRequest, _reply: FastifyReply): Promise<void> => {
    if (!roles.includes(request.user.role)) {
      throw new ForbiddenError();
    }
  };
}

// Verifies teacher exists AND status = 'verified'
export async function requireVerifiedTeacher(
  request: FastifyRequest,
  _reply: FastifyReply,
): Promise<void> {
  if (request.user.role !== 'teacher') throw new ForbiddenError();

  const teacher = await prisma.teacher.findUnique({
    where: { userId: request.user.id },
    select: { status: true },
  });

  if (!teacher || teacher.status !== 'verified') {
    throw new ForbiddenError('Pehle verification complete karo');
  }
}

export async function requireInstituteAdmin(
  request: FastifyRequest,
  _reply: FastifyReply,
): Promise<void> {
  if (request.user.role !== 'institute_admin') throw new ForbiddenError();
}
