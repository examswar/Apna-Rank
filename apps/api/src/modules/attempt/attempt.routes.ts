import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { ok } from '../../lib/response';
import { authenticate } from '../../middleware/authenticate';
import * as AttemptService from './attempt.service';

const startBody = z.object({
  testId: z.string().uuid(),
});

const answerBody = z.object({
  questionId: z.string().uuid(),
  selectedOption: z.string().length(1).nullable().optional(),
  confidenceTag: z.enum(['sure', 'unsure', 'guess']).nullable().optional(),
  timeSpentSecs: z.number().int().min(0).nullable().optional(),
  flagged: z.boolean().default(false),
});

const submitBody = z.object({
  timeTakenSecs: z.number().int().min(0),
});

export default async function attemptRoutes(app: FastifyInstance) {
  const auth = { preHandler: authenticate };

  // POST /api/v1/attempts/start — start a test attempt
  app.post('/start', auth, async (request, reply) => {
    const { testId } = startBody.parse(request.body);
    const result = await AttemptService.startAttempt(testId, request.user.id);
    return reply.status(201).send(ok(result));
  });

  // POST /api/v1/attempts/:id/answer — autosave one answer
  app.post('/:id/answer', auth, async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = answerBody.parse(request.body);
    const result = await AttemptService.saveAnswer(id, request.user.id, body);
    return reply.status(200).send(ok(result));
  });

  // POST /api/v1/attempts/:id/submit — finalise attempt and queue diagnosis
  app.post('/:id/submit', auth, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { timeTakenSecs } = submitBody.parse(request.body);
    const result = await AttemptService.submitAttempt(id, request.user.id, timeTakenSecs);
    return reply.status(200).send(ok(result));
  });

  // GET /api/v1/attempts/:id/result — poll for attempt + diagnosis result
  app.get('/:id/result', auth, async (request, reply) => {
    const { id } = request.params as { id: string };
    const result = await AttemptService.getAttemptResult(id, request.user.id);
    return reply.status(200).send(ok(result));
  });
}
