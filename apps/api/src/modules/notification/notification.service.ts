import { prisma } from '@apna-rank/db';
import { notificationQueue, JOBS } from '../../lib/redis';
import { NotFoundError, ForbiddenError } from '../../lib/errors';

export async function list(userId: string, page: number, limit: number) {
  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      orderBy: [{ isRead: 'asc' }, { createdAt: 'desc' }],
      skip,
      take: limit,
    }),
    prisma.notification.count({ where: { userId } }),
  ]);
  return { items, total };
}

export async function unreadCount(userId: string): Promise<number> {
  return prisma.notification.count({ where: { userId, isRead: false } });
}

export async function markRead(notificationId: string, userId: string): Promise<void> {
  // Atomic ownership check + update in one round-trip.
  // Avoids a TOCTOU race where the notification is deleted between findUnique and update,
  // which would cause Prisma to throw P2025 (unhandled → 500 error).
  const result = await prisma.notification.updateMany({
    where: { id: notificationId, userId },
    data: { isRead: true },
  });
  if (result.count === 0) {
    const exists = await prisma.notification.findUnique({
      where: { id: notificationId },
      select: { userId: true },
    });
    if (!exists) throw new NotFoundError('Notification');
    throw new ForbiddenError();
  }
}

export async function markAllRead(userId: string): Promise<number> {
  const result = await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });
  return result.count;
}

export async function send(
  userId: string,
  type: string,
  title: string,
  body: string,
): Promise<void> {
  await notificationQueue.add(JOBS.SEND_NOTIFICATION, { userId, type, title, body });
}
