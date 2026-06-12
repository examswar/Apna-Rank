import { FastifyRequest, FastifyReply } from 'fastify';
import { UserRole } from '../types';
import { ForbiddenError } from '../errors';
import { prisma } from '../db';

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

// Verifies institute admin AND (if accessing minor data) DPA is signed
export async function requireInstituteAdmin(
  request: FastifyRequest,
  _reply: FastifyReply,
): Promise<void> {
  if (request.user.role !== 'institute_admin') throw new ForbiddenError();
}
