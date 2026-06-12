import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { ok } from '../../shared/response';
import { authenticate } from '../../shared/middleware/authenticate';
import { requireRole } from '../../shared/middleware/rbac';

const explainBody = z.object({
  questionId: z.string().uuid().optional(),
  questionText: z.string().optional(),
  topic: z.string().optional(),
  // Context sent with request for personalised explanation
}).refine((d) => d.questionId || d.questionText, {
  message: 'questionId or questionText required',
});

// Claude API integration — Rate limited: 2 requests per student per minute
// Identical question explanations cached in Redis for 24h
export default async function aiRoutes(app: FastifyInstance) {
  // POST /api/v1/ai/explain — student doubt solver (Hindi, context-aware)
  // Rate limit: 2/min per student (enforced via Redis)
  app.post('/explain', { preHandler: authenticate }, async (request, reply) => {
    const body = explainBody.parse(request.body);
    // TODO: AiService.explainQuestion(request.user.id, body)
    // Prompt includes: student's Mistake DNA pattern for this topic, exam context, baseline level
    // Model: claude-sonnet-4-6
    return reply.status(200).send(ok({ explanation: 'TODO', language: 'hi' }));
  });

  // POST /api/v1/ai/classify-mistake — INTERNAL: called by diagnosis BullMQ job only
  // Not exposed to frontend. Rate limited at job level.
  app.post('/classify-mistake', {
    preHandler: [authenticate, requireRole('platform_admin')],
  }, async (request, reply) => {
    // TODO: AiService.classifyMistake(request.body)
    // Hybrid: rule-based first (covers ~60% cases), Claude for ambiguous
    return reply.status(200).send(ok({ mistakeType: 'concept', confidence: 0.9 }));
  });

  // POST /api/v1/ai/generate-kaam — INTERNAL: generate "Aaj ka ek kaam" after diagnosis
  app.post('/generate-kaam', {
    preHandler: [authenticate, requireRole('platform_admin')],
  }, async (request, reply) => {
    // TODO: AiService.generateAajKaKaam(request.body)
    // Called once per student per day after diagnosis
    // Cached in Redis per student for 24h
    return reply.status(200).send(ok({ kaam: 'TODO' }));
  });
}
