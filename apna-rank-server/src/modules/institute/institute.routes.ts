import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { ok } from '../../shared/response';
import { authenticate } from '../../shared/middleware/authenticate';
import { requireRole, requireInstituteAdmin } from '../../shared/middleware/rbac';

const registerBody = z.object({
  name: z.string().min(2).max(255),
  type: z.enum(['coaching', 'school', 'college']),
  city: z.string().max(100),
  state: z.string().max(100),
});

const batchBody = z.object({
  name: z.string().min(1).max(255),
  examCategory: z.string(),
});

const assignTestBody = z.object({
  testId: z.string().uuid(),
  batchId: z.string().uuid(),
  opensAt: z.string().datetime(),
  closesAt: z.string().datetime().optional(),
});

const dpaSignBody = z.object({
  version: z.string(),
  signedBy: z.string(),
});

export default async function instituteRoutes(app: FastifyInstance) {
  const adminAuth = { preHandler: [authenticate, requireInstituteAdmin] };

  // POST /api/v1/institute/register
  app.post('/register', { preHandler: authenticate }, async (request, reply) => {
    const body = registerBody.parse(request.body);
    // TODO: InstituteService.register(request.user.id, body)
    return reply.status(201).send(ok({ status: 'pending_verification' }));
  });

  // POST /api/v1/institute/batches — create batch
  app.post('/batches', adminAuth, async (request, reply) => {
    const body = batchBody.parse(request.body);
    // TODO: InstituteService.createBatch(request.user.id, body)
    return reply.status(201).send(ok({ batchId: 'TODO' }));
  });

  // POST /api/v1/institute/batches/:id/students — bulk upload (CSV) or invite link
  app.post('/batches/:id/students', adminAuth, async (request, reply) => {
    const { id } = request.params as { id: string };
    // TODO: InstituteService.bulkAddStudents(id, request.user.id, request.body)
    return reply.status(200).send(ok({ added: 0, errors: [] }));
  });

  // GET /api/v1/institute/batches/:id/heatmap — topic-level weak/moderate/strong
  app.get('/batches/:id/heatmap', adminAuth, async (request, reply) => {
    const { id } = request.params as { id: string };
    // TODO: InstituteService.getBatchHeatmap(id, request.user.id)
    // NOTE: heatmap is pre-computed every 6h by a background job, not on-demand
    return reply.status(200).send(ok({ topics: [] }));
  });

  // GET /api/v1/institute/batches/:id/lesson-plan — auto suggestion
  app.get('/batches/:id/lesson-plan', adminAuth, async (request, reply) => {
    const { id } = request.params as { id: string };
    // TODO: InstituteService.getLessonPlan(id, request.user.id)
    return reply.status(200).send(ok({ suggestion: null }));
  });

  // GET /api/v1/institute/students/:id — individual student Mistake DNA + Strategy Score
  app.get('/students/:id', adminAuth, async (request, reply) => {
    const { id } = request.params as { id: string };
    // TODO: InstituteService.getStudentView(id, request.user.id)
    return reply.status(200).send(ok({ student: null }));
  });

  // GET /api/v1/institute/dropout-risks — students inactive 5+ days
  app.get('/dropout-risks', adminAuth, async (request, reply) => {
    // TODO: InstituteService.getDropoutRisks(request.user.id)
    return reply.status(200).send(ok({ atRisk: [] }));
  });

  // POST /api/v1/institute/tests/assign — assign test to batch with time window
  app.post('/tests/assign', adminAuth, async (request, reply) => {
    const body = assignTestBody.parse(request.body);
    // TODO: InstituteService.assignTest(body, request.user.id)
    return reply.status(201).send(ok({ assigned: true }));
  });

  // POST /api/v1/institute/dpa/sign — DPA acceptance (required before minor student data access)
  app.post('/dpa/sign', adminAuth, async (request, reply) => {
    const body = dpaSignBody.parse(request.body);
    // TODO: InstituteService.signDpa(request.user.id, body, request.ip)
    // Creates immutable DpaRecord row
    return reply.status(200).send(ok({ signed: true }));
  });
}
