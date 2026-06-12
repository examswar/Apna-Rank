import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { ok } from '../../shared/response';
import { authenticate } from '../../shared/middleware/authenticate';
import { requireRole } from '../../shared/middleware/rbac';

const startBody = z.object({
  testId: z.string().uuid(),
});

const answerBody = z.object({
  questionId: z.string().uuid(),
  selectedOption: z.enum(['A','B','C','D']).nullable(),
  confidenceTag: z.enum(['sure','unsure','guess']).optional(),
  flagged: z.boolean().optional(),
  timeSpentSecs: z.number().int().min(0),
});

export default async function attemptRoutes(app: FastifyInstance) {
  const studentAuth = { preHandler: [authenticate, requireRole('student')] };

  // POST /api/v1/attempts/start — starts attempt, returns all questions at once
  // Full question set delivered in one call (TRD: cached at CDN edge)
  app.post('/start', studentAuth, async (request, reply) => {
    const { testId } = startBody.parse(request.body);
    // TODO: AttemptService.startAttempt(request.user.id, testId)
    return reply.status(201).send(ok({
      attemptId: 'TODO',
      questions: [],
      durationSecs: 0,
      negativeMarking: 0,
    }));
  });

  // POST /api/v1/attempts/:id/answer — autosave per-question answer
  app.post('/:id/answer', studentAuth, async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = answerBody.parse(request.body);
    // TODO: AttemptService.saveAnswer(id, request.user.id, body)
    return reply.status(200).send(ok({ saved: true }));
  });

  // POST /api/v1/attempts/:id/submit — final submit, triggers diagnosis BullMQ job
  // Returns immediately with { status: 'processing', attemptId }
  // Frontend polls /result every 2s or uses SSE
  app.post('/:id/submit', studentAuth, async (request, reply) => {
    const { id } = request.params as { id: string };
    // TODO: AttemptService.submitAttempt(id, request.user.id)
    return reply.status(200).send(ok({ status: 'processing', attemptId: id }));
  });

  // GET /api/v1/attempts/:id/result — poll for diagnosis result
  app.get('/:id/result', { preHandler: authenticate }, async (request, reply) => {
    const { id } = request.params as { id: string };
    // TODO: AttemptService.getResult(id, request.user.id)
    // Returns { status: 'processing' } until diagnosis job completes
    return reply.status(200).send(ok({ status: 'processing' }));
  });

  // GET /api/v1/attempts/:id/diagnosis — full Mistake DNA + Strategy Score + Confidence report
  app.get('/:id/diagnosis', { preHandler: authenticate }, async (request, reply) => {
    const { id } = request.params as { id: string };
    // TODO: AttemptService.getDiagnosisReport(id, request.user.id)
    return reply.status(200).send(ok({
      knowledgeRank: null,
      strategyRank: null,
      mistakeDna: [],
      confidenceGaps: [],
      aajKaKaam: null,
    }));
  });
}
