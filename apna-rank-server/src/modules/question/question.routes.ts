import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { ok, paginated } from '../../shared/response';
import { authenticate } from '../../shared/middleware/authenticate';
import { requireRole, requireVerifiedTeacher } from '../../shared/middleware/rbac';

const EXAM_CATEGORIES = [
  'SSC_CGL','SSC_CHSL','SSC_MTS','SSC_GD','SSC_CPO',
  'RAILWAY_NTPC','RAILWAY_GROUP_D','RAILWAY_ALP','RAILWAY_JE',
  'UPSC_CSE','UPSC_CDS','UPSC_NDA',
  'NEET_UG','NEET_PG',
  'JEE_MAIN','JEE_ADVANCED',
  'BOARDS_10TH','BOARDS_12TH',
] as const;

const questionBody = z.object({
  examCategory: z.enum(EXAM_CATEGORIES),
  subject: z.string().min(1).max(100),
  topic: z.string().max(200).optional(),
  subTopic: z.string().max(200).optional(),
  language: z.enum(['hi', 'en']).default('hi'),
  questionText: z.string().min(10),
  options: z.array(z.object({ key: z.enum(['A','B','C','D']), text: z.string() })).length(4),
  correctOption: z.enum(['A','B','C','D']),
  explanation: z.string().optional(),
  difficultyTag: z.enum(['easy','medium','hard']),
});

export default async function questionRoutes(app: FastifyInstance) {
  // POST /api/v1/questions — teacher or admin creates a question
  app.post('/', {
    preHandler: [authenticate, requireVerifiedTeacher],
  }, async (request, reply) => {
    const body = questionBody.parse(request.body);
    // TODO: QuestionService.createQuestion(request.user.id, body)
    return reply.status(201).send(ok({ id: 'TODO', ...body }));
  });

  // GET /api/v1/questions/:id
  app.get('/:id', { preHandler: authenticate }, async (request, reply) => {
    const { id } = request.params as { id: string };
    // TODO: QuestionService.getQuestion(id)
    return reply.status(200).send(ok({ id }));
  });

  // PUT /api/v1/questions/:id — update (only if question not yet published in any test)
  app.put('/:id', {
    preHandler: [authenticate, requireVerifiedTeacher],
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = questionBody.partial().parse(request.body);
    // TODO: QuestionService.updateQuestion(id, request.user.id, body)
    return reply.status(200).send(ok({ updated: true }));
  });

  // DELETE /api/v1/questions/:id — soft delete (admin only, sets isActive=false)
  app.delete('/:id', {
    preHandler: [authenticate, requireRole('platform_admin')],
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    // TODO: QuestionService.softDeleteQuestion(id)
    return reply.status(200).send(ok({ deleted: true }));
  });
}
