import { FastifyInstance } from 'fastify';
import { ok, paginated } from '../../lib/response';
import { authenticate } from '../../middleware/authenticate';
import { blockMinors } from '../../middleware/minor-guard';
import * as DiagnosisService from './diagnosis.service';

export default async function diagnosisRoutes(app: FastifyInstance) {
  const auth = { preHandler: authenticate };
  const publicAuth = { preHandler: [authenticate, blockMinors] };

  // Static routes registered first to prevent capture by /:attemptId

  // GET /api/v1/diagnosis/history — paginated diagnosis results for the student
  app.get('/history', auth, async (request, reply) => {
    const { page = '1', limit = '10' } = request.query as Record<string, string>;
    const result = await DiagnosisService.getHistory(request.user.id, +page, +limit);
    return reply.status(200).send(paginated(result.items, result.total, +page, +limit));
  });

  // GET /api/v1/diagnosis/mistake-dna — 30-day aggregated mistake breakdown
  app.get('/mistake-dna', auth, async (request, reply) => {
    const dna = await DiagnosisService.getMistakeDna(request.user.id);
    return reply.status(200).send(ok(dna));
  });

  // GET /api/v1/diagnosis/leaderboard — percentile rank (adults only — DPDP Layer 1)
  app.get('/leaderboard', publicAuth, async (_request, reply) => {
    return reply.status(200).send(ok({ rank: null, percentile: null, total: 0 }));
  });

  // GET /api/v1/diagnosis/:attemptId — full diagnosis + Mistake DNA breakdown
  app.get('/:attemptId', auth, async (request, reply) => {
    const { attemptId } = request.params as { attemptId: string };
    const result = await DiagnosisService.getForAttempt(attemptId, request.user.id);
    return reply.status(200).send(ok(result));
  });
}
