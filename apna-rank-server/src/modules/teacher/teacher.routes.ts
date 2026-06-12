import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { ok } from '../../shared/response';
import { authenticate } from '../../shared/middleware/authenticate';
import { requireRole, requireVerifiedTeacher } from '../../shared/middleware/rbac';

const registerBody = z.object({
  name: z.string().min(2).max(255),
  examCategories: z.array(z.string()).min(1),
  subjectExpertise: z.string().max(500).optional(),
});

const panVerifyBody = z.object({
  panNumber: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Invalid PAN format'),
  // DigiLocker OAuth is initiated via a redirect — MVP uses manual verification
});

const createTestBody = z.object({
  title: z.string().min(5).max(255),
  examCategory: z.string(),
  price: z.number().min(5).max(500),
  durationSecs: z.number().int().min(600).max(10800),
  negativeMarking: z.enum(['0', '0.25', '0.33', '1']).transform(Number),
  questionIds: z.array(z.string().uuid()).min(5).max(200),
});

export default async function teacherRoutes(app: FastifyInstance) {
  // POST /api/v1/teacher/register
  app.post('/register', { preHandler: authenticate }, async (request, reply) => {
    const body = registerBody.parse(request.body);
    // TODO: TeacherService.register(request.user.id, body)
    return reply.status(201).send(ok({ status: 'pending', message: 'Verification pending' }));
  });

  // POST /api/v1/teacher/verify/pan — submit PAN for verification (MVP: manual admin review)
  app.post('/verify/pan', {
    preHandler: [authenticate, requireRole('teacher')],
  }, async (request, reply) => {
    const body = panVerifyBody.parse(request.body);
    // TODO: TeacherService.submitPan(request.user.id, body.panNumber) — PAN encrypted before storage
    return reply.status(200).send(ok({ status: 'under_review' }));
  });

  // POST /api/v1/teacher/tests — create new test (draft)
  app.post('/tests', {
    preHandler: [authenticate, requireVerifiedTeacher],
  }, async (request, reply) => {
    const body = createTestBody.parse(request.body);
    // TODO: TeacherService.createTest(request.user.id, body)
    return reply.status(201).send(ok({ testId: 'TODO', status: 'draft' }));
  });

  // GET /api/v1/teacher/tests — list own tests
  app.get('/tests', {
    preHandler: [authenticate, requireVerifiedTeacher],
  }, async (request, reply) => {
    // TODO: TeacherService.listTests(request.user.id)
    return reply.status(200).send(ok({ tests: [] }));
  });

  // PUT /api/v1/teacher/tests/:id — edit test (draft only)
  app.put('/tests/:id', {
    preHandler: [authenticate, requireVerifiedTeacher],
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = createTestBody.partial().parse(request.body);
    // TODO: TeacherService.updateTest(id, request.user.id, body)
    return reply.status(200).send(ok({ updated: true }));
  });

  // POST /api/v1/teacher/tests/:id/publish — publish to marketplace
  app.post('/tests/:id/publish', {
    preHandler: [authenticate, requireVerifiedTeacher],
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    // TODO: TeacherService.publishTest(id, request.user.id)
    // Triggers platform content review queue
    return reply.status(200).send(ok({ status: 'under_review' }));
  });

  // GET /api/v1/teacher/tests/:id/analytics — aggregate only, no individual student PII
  app.get('/tests/:id/analytics', {
    preHandler: [authenticate, requireVerifiedTeacher],
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    // TODO: TeacherService.getTestAnalytics(id, request.user.id)
    return reply.status(200).send(ok({ avgScore: null, totalAttempts: 0, topMistakeType: null }));
  });

  // GET /api/v1/teacher/earnings — earnings summary + payout history
  app.get('/earnings', {
    preHandler: [authenticate, requireVerifiedTeacher],
  }, async (request, reply) => {
    // TODO: TeacherService.getEarnings(request.user.id)
    return reply.status(200).send(ok({ pendingBalance: 0, totalEarned: 0, payouts: [] }));
  });
}
