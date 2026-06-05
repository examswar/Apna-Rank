import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { ok, paginated } from '../../lib/response';
import { authenticate } from '../../middleware/authenticate';
import { requireRole } from '../../middleware/rbac';
import { blockMinors } from '../../middleware/minor-guard';
import * as TestService from './test.service';

const EXAM_CATEGORIES = [
  'SSC_CGL', 'SSC_CHSL', 'SSC_MTS', 'SSC_GD', 'SSC_CPO',
  'RAILWAY_NTPC', 'RAILWAY_GROUP_D', 'RAILWAY_ALP', 'RAILWAY_JE',
  'UPSC_CSE', 'UPSC_CDS', 'UPSC_NDA',
  'NEET_UG', 'NEET_PG',
  'JEE_MAIN', 'JEE_ADVANCED',
  'BOARDS_10TH', 'BOARDS_12TH',
] as const;

const TEST_TYPES = ['marketplace', 'institute', 'live', 'battle', 'baseline'] as const;

const createTestBody = z.object({
  title: z.string().min(3).max(255),
  examCategory: z.enum(EXAM_CATEGORIES),
  type: z.enum(TEST_TYPES).default('marketplace'),
  price: z.number().min(0).default(0),
  durationSecs: z.number().int().min(60).max(18000), // 1 min – 5 hours
  negativeMarking: z.number().min(0).max(1).default(0),
  totalMarks: z.number().int().min(1),
});

const updateTestBody = z.object({
  title: z.string().min(3).max(255).optional(),
  price: z.number().min(0).optional(),
  durationSecs: z.number().int().min(60).max(18000).optional(),
  negativeMarking: z.number().min(0).max(1).optional(),
  totalMarks: z.number().int().min(1).optional(),
});

const addQuestionBody = z.object({
  questionId: z.string().uuid(),
  marks: z.number().positive().default(1.0),
});

const submitAnswersBody = z.object({
  answers: z.array(z.object({
    questionId: z.string().uuid(),
    selectedOption: z.string().max(1).nullable(),
    confidenceTag: z.enum(['sure', 'unsure', 'guess']).nullable(),
    timeSpentSecs: z.number().int().min(0).nullable(),
    flagged: z.boolean().default(false),
  })),
  timeTakenSecs: z.number().int().min(0),
});

const CREATOR_ROLES = ['teacher', 'institute_admin', 'platform_admin'] as const;

export default async function testRoutes(app: FastifyInstance) {
  const auth = { preHandler: authenticate };
  const creatorAuth = { preHandler: [authenticate, requireRole(...CREATOR_ROLES)] };

  // POST /api/v1/tests — create test (teacher / institute_admin / platform_admin)
  app.post('/', creatorAuth, async (request, reply) => {
    const body = createTestBody.parse(request.body);
    const test = await TestService.createTest(request.user.id, body);
    return reply.status(201).send(ok(test));
  });

  // GET /api/v1/tests — browse published marketplace tests
  app.get('/', auth, async (request, reply) => {
    const { examCategory, page = '1', limit = '20' } = request.query as Record<string, string>;
    const p = Math.max(1, parseInt(page, 10) || 1);
    const l = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));
    const result = await TestService.browseMarketplace({ examCategory }, p, l);
    return reply.status(200).send(paginated(result.tests, result.total, p, l));
  });

  // GET /api/v1/tests/:id — test detail + 2-question preview
  app.get('/:id', auth, async (request, reply) => {
    const { id } = request.params as { id: string };
    const detail = await TestService.getTestDetail(id, request.user.id);
    return reply.status(200).send(ok(detail));
  });

  // PUT /api/v1/tests/:id — update draft test (creator only)
  app.put('/:id', auth, async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = updateTestBody.parse(request.body);
    const test = await TestService.updateTest(id, request.user.id, body);
    return reply.status(200).send(ok(test));
  });

  // POST /api/v1/tests/:id/questions/add — add question to draft test
  app.post('/:id/questions/add', auth, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { questionId, marks } = addQuestionBody.parse(request.body);
    const result = await TestService.addQuestionToTest(id, request.user.id, questionId, marks);
    return reply.status(201).send(ok(result));
  });

  // POST /api/v1/tests/:id/publish — publish test to marketplace
  app.post('/:id/publish', auth, async (request, reply) => {
    const { id } = request.params as { id: string };
    const result = await TestService.publishTest(id, request.user.id);
    return reply.status(200).send(ok(result));
  });

  // POST /api/v1/tests/:id/purchase — create Razorpay order (server-side price)
  // Returns order details for the frontend to open the Razorpay checkout modal.
  // Webhook at /api/v1/webhooks/razorpay handles payment confirmation asynchronously.
  app.post('/:id/purchase', {
    preHandler: [authenticate, blockMinors, requireRole('student')],
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const result = await TestService.createRazorpayOrder(id, request.user.id);
    return reply.status(201).send(ok(result));
  });

  // POST /api/v1/tests/:id/attempt — start attempt (legacy route)
  app.post('/:id/attempt', {
    preHandler: [authenticate, requireRole('student')],
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const attempt = await TestService.startAttempt(id, request.user.id);
    return reply.status(201).send(ok(attempt));
  });

  // PUT /api/v1/tests/attempts/:attemptId — autosave (legacy route, stub)
  app.put('/attempts/:attemptId', auth, async (_request, reply) => {
    return reply.status(200).send(ok({ saved: true }));
  });

  // POST /api/v1/tests/attempts/:attemptId/submit — submit (legacy route)
  app.post('/attempts/:attemptId/submit', auth, async (request, reply) => {
    const { attemptId } = request.params as { attemptId: string };
    const body = submitAnswersBody.parse(request.body);
    const result = await TestService.submitAttempt(attemptId, request.user.id, body);
    return reply.status(200).send(ok(result));
  });
}
