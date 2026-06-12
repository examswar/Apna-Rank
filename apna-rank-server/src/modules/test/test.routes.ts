import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { ok } from '../../shared/response';
import { authenticate } from '../../shared/middleware/authenticate';
import { requireRole, requireVerifiedTeacher } from '../../shared/middleware/rbac';

const purchaseBody = z.object({
  razorpayPaymentId: z.string(),
  razorpayOrderId: z.string(),
  razorpaySignature: z.string(),
});

export default async function testRoutes(app: FastifyInstance) {
  // GET /api/v1/tests — marketplace browse (filtered by exam, price, teacher)
  app.get('/', { preHandler: authenticate }, async (request, reply) => {
    const { examCategory, page = '1', limit = '20' } = request.query as Record<string, string>;
    // TODO: TestService.browseMarketplace({ examCategory, page, limit })
    return reply.status(200).send(ok({ tests: [], total: 0 }));
  });

  // GET /api/v1/tests/:id — test details + first 2 questions preview (free)
  app.get('/:id', { preHandler: authenticate }, async (request, reply) => {
    const { id } = request.params as { id: string };
    // TODO: TestService.getTestDetail(id, request.user.id)
    return reply.status(200).send(ok({ id, preview: [] }));
  });

  // POST /api/v1/tests/:id/purchase — Razorpay payment verification
  // Server fetches price — never trust client-sent amount
  app.post('/:id/purchase', {
    preHandler: [authenticate, requireRole('student')],
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = purchaseBody.parse(request.body);
    // TODO: TestService.verifyPurchase(id, request.user.id, body)
    return reply.status(200).send(ok({ purchased: true }));
  });

  // POST /api/v1/tests/:id/razorpay-order — create Razorpay order (server-authoritative price)
  app.post('/:id/razorpay-order', {
    preHandler: [authenticate, requireRole('student')],
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    // TODO: TestService.createRazorpayOrder(id, request.user.id)
    return reply.status(200).send(ok({ orderId: 'TODO', amount: 0 }));
  });
}
