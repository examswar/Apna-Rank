import { FastifyInstance } from 'fastify';
import { ok } from '../../shared/response';
import { authenticate } from '../../shared/middleware/authenticate';

export default async function notificationRoutes(app: FastifyInstance) {
  const auth = { preHandler: authenticate };

  // GET /api/v1/notifications — unread + recent notifications
  app.get('/', auth, async (request, reply) => {
    // TODO: NotificationService.list(request.user.id)
    return reply.status(200).send(ok({ notifications: [], unreadCount: 0 }));
  });

  // PATCH /api/v1/notifications/:id/read — mark as read
  app.patch('/:id/read', auth, async (request, reply) => {
    const { id } = request.params as { id: string };
    // TODO: NotificationService.markRead(id, request.user.id)
    return reply.status(200).send(ok({ read: true }));
  });

  // PATCH /api/v1/notifications/read-all
  app.patch('/read-all', auth, async (request, reply) => {
    // TODO: NotificationService.markAllRead(request.user.id)
    return reply.status(200).send(ok({ updated: true }));
  });
}
