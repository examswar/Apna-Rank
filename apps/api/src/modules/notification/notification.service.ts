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
  const notif = await prisma.notification.findUnique({ where: { id: notificationId } });
  if (!notif) throw new NotFoundError('Notification');
  if (notif.userId !== userId) throw new ForbiddenError();

  await prisma.notification.update({
    where: { id: notificationId },
    data: { isRead: true },
  });
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
