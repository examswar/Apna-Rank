import { FastifyInstance } from 'fastify';
import { ok } from '../../shared/response';
import { authenticate } from '../../shared/middleware/authenticate';
import { blockMinors } from '../../shared/middleware/minor-guard';

export default async function liveTestRoutes(app: FastifyInstance) {
  // GET /api/v1/live-tests — upcoming live tests for user's exam category
  app.get('/', { preHandler: authenticate }, async (request, reply) => {
    // TODO: LiveTestService.getUpcoming(request.user.examCategory)
    return reply.status(200).send(ok({ liveTests: [] }));
  });

  // POST /api/v1/live-tests/:id/register — register for live test (adult only)
  app.post('/:id/register', {
    preHandler: [authenticate, blockMinors],
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    // TODO: LiveTestService.register(id, request.user.id)
    return reply.status(200).send(ok({ registered: true }));
  });

  // GET /api/v1/live-tests/:id/relative-rank — post-test "top X% among N students"
  // No absolute rank prediction — relative position only
  app.get('/:id/relative-rank', {
    preHandler: [authenticate, blockMinors],
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    // TODO: LiveTestService.getRelativeRank(id, request.user.id)
    return reply.status(200).send(ok({ topPercentile: null, totalParticipants: 0 }));
  });
}
