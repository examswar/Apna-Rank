import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { ok, paginated } from '../../lib/response';
import { authenticate } from '../../middleware/authenticate';
import { requireRole } from '../../middleware/rbac';
import * as QuestionService from './question.service';

const EXAM_CATEGORIES = [
  'SSC_CGL', 'SSC_CHSL', 'SSC_MTS', 'SSC_GD', 'SSC_CPO',
  'RAILWAY_NTPC', 'RAILWAY_GROUP_D', 'RAILWAY_ALP', 'RAILWAY_JE',
  'UPSC_CSE', 'UPSC_CDS', 'UPSC_NDA',
  'NEET_UG', 'NEET_PG',
  'JEE_MAIN', 'JEE_ADVANCED',
  'BOARDS_10TH', 'BOARDS_12TH',
] as const;

const OPTION_KEYS = ['A', 'B', 'C', 'D'] as const;
const DIFFICULTY = ['easy', 'medium', 'hard'] as const;

const createQuestionBody = z.object({
  examCategory: z.enum(EXAM_CATEGORIES),
  subject: z.string().max(100).optional(),
  topic: z.string().max(200).optional(),
  subTopic: z.string().max(200).optional(),
  language: z.enum(['hi', 'en']).default('hi'),
  questionText: z.string().min(10).max(2000),
  options: z.array(z.object({
    key: z.enum(OPTION_KEYS),
    text: z.string().min(1).max(500),
  })).length(4),
  correctOption: z.enum(OPTION_KEYS),
  explanation: z.string().max(2000).optional(),
  difficultyTag: z.enum(DIFFICULTY),
});

const updateQuestionBody = createQuestionBody.partial().extend({
  isActive: z.boolean().optional(),
});

// This plugin is registered at prefix /api/v1 so full paths are
// /api/v1/admin/questions and /api/v1/questions[/:id]
export default async function questionRoutes(app: FastifyInstance) {
  const auth = { preHandler: authenticate };
  const adminAuth = { preHandler: [authenticate, requireRole('platform_admin')] };

  // POST /api/v1/admin/questions — create question (platform_admin only)
  app.post('/admin/questions', adminAuth, async (request, reply) => {
    const body = createQuestionBody.parse(request.body);
    const question = await QuestionService.createQuestion(request.user.id, body);
    return reply.status(201).send(ok(question));
  });

  // GET /api/v1/questions?examCategory=SSC_CGL&difficulty=medium&page=1&limit=20
  app.get('/questions', auth, async (request, reply) => {
    const { examCategory, difficulty, subject, topic, page = '1', limit = '20' } =
      request.query as Record<string, string>;
    const p = Math.max(1, parseInt(page, 10) || 1);
    const l = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));
    const result = await QuestionService.listQuestions(
      { examCategory, difficulty, subject, topic },
      p,
      l,
    );
    return reply.status(200).send(paginated(result.questions, result.total, p, l));
  });

  // GET /api/v1/questions/:id
  // correctOption is only returned to platform_admin; students receive it without the answer.
  app.get('/questions/:id', auth, async (request, reply) => {
    const { id } = request.params as { id: string };
    const includeAnswer = request.user.role === 'platform_admin';
    const question = await QuestionService.getQuestion(id, includeAnswer);
    return reply.status(200).send(ok(question));
  });

  // PUT /api/v1/questions/:id — creator or platform_admin
  app.put('/questions/:id', auth, async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = updateQuestionBody.parse(request.body);
    const question = await QuestionService.updateQuestion(
      id,
      request.user.id,
      request.user.role,
      body,
    );
    return reply.status(200).send(ok(question));
  });
}
