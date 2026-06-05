import { FastifyInstance } from 'fastify';
import { ok, paginated } from '../../lib/response';
import { authenticate } from '../../middleware/authenticate';
import * as NotificationService from './notification.service';

export default async function notificationRoutes(app: FastifyInstance) {
  const auth = { preHandler: authenticate };

  // GET /api/v1/notifications — paginated list, unread first
  app.get('/', auth, async (request, reply) => {
    const { page = '1', limit = '20' } = request.query as Record<string, string>;
    const result = await NotificationService.list(request.user.id, +page, +limit);
    return reply.status(200).send(paginated(result.items, result.total, +page, +limit));
  });

  // GET /api/v1/notifications/unread-count — badge count for client UI
  app.get('/unread-count', auth, async (request, reply) => {
    const count = await NotificationService.unreadCount(request.user.id);
    return reply.status(200).send(ok({ count }));
  });

  // PATCH /api/v1/notifications/:id/read — mark single notification as read
  app.patch('/:id/read', auth, async (request, reply) => {
    const { id } = request.params as { id: string };
    await NotificationService.markRead(id, request.user.id);
    return reply.status(200).send(ok({ read: true }));
  });

  // POST /api/v1/notifications/read-all — mark all as read
  app.post('/read-all', auth, async (request, reply) => {
    const count = await NotificationService.markAllRead(request.user.id);
    return reply.status(200).send(ok({ markedRead: count }));
  });
}
