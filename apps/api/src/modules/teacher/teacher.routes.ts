import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { ok, paginated } from '../../lib/response';
import { authenticate } from '../../middleware/authenticate';
import { requireRole, requireVerifiedTeacher } from '../../middleware/rbac';
import * as TeacherService from './teacher.service';

const EXAM_CATEGORIES = [
  'SSC_CGL', 'SSC_CHSL', 'SSC_MTS', 'SSC_GD', 'SSC_CPO',
  'RAILWAY_NTPC', 'RAILWAY_GROUP_D', 'RAILWAY_ALP', 'RAILWAY_JE',
  'UPSC_CSE', 'UPSC_CDS', 'UPSC_NDA',
  'NEET_UG', 'NEET_PG', 'JEE_MAIN', 'JEE_ADVANCED',
  'BOARDS_10TH', 'BOARDS_12TH',
] as const;

const registerBody = z.object({
  panNumber:      z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]$/, 'Invalid PAN format'),
  examCategories: z.array(z.enum(EXAM_CATEGORIES)).min(1),
});

const panBody = z.object({
  panNumber: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]$/, 'Invalid PAN format'),
});

export default async function teacherRoutes(app: FastifyInstance) {
  // ── POST /teacher/register ────────────────────────────────────────────────
  // Any authenticated user can apply to become a teacher.
  app.post('/register', { preHandler: authenticate }, async (request, reply) => {
    const body = registerBody.parse(request.body);
    const result = await TeacherService.register(request.user.id, body);
    return reply.status(201).send(ok(result));
  });

  // ── POST /teacher/verify/pan ──────────────────────────────────────────────
  // Teacher self-submits PAN; stored AES-256-GCM encrypted.
  // Requires teacher role (not necessarily verified yet).
  app.post('/verify/pan', { preHandler: [authenticate, requireRole('teacher')] }, async (request, reply) => {
    const { panNumber } = panBody.parse(request.body);
    const result = await TeacherService.submitPan(request.user.id, panNumber);
    return reply.status(200).send(ok(result));
  });

  // ── GET /teacher/profile ──────────────────────────────────────────────────
  app.get('/profile', { preHandler: [authenticate, requireRole('teacher')] }, async (request, reply) => {
    const profile = await TeacherService.getProfile(request.user.id);
    return reply.status(200).send(ok(profile));
  });

  // ── GET /teacher/tests ────────────────────────────────────────────────────
  // Lists all tests created by this teacher (any status).
  app.get('/tests', { preHandler: [authenticate, requireRole('teacher')] }, async (request, reply) => {
    const q = request.query as { page?: string; limit?: string };
    const page  = Math.max(1, parseInt(q.page  ?? '1',  10));
    const limit = Math.min(50, Math.max(1, parseInt(q.limit ?? '20', 10)));
    const result = await TeacherService.listTests(request.user.id, page, limit);
    return reply.status(200).send(paginated(result.tests, result.total, page, limit));
  });

  // ── GET /teacher/tests/:id/analytics ─────────────────────────────────────
  // Aggregate stats only — no student PII ever returned.
  // Requires verified teacher (only test owners access their analytics).
  app.get('/tests/:id/analytics', { preHandler: [authenticate, requireVerifiedTeacher] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const analytics = await TeacherService.getTestAnalytics(id, request.user.id);
    return reply.status(200).send(ok(analytics));
  });

  // ── GET /teacher/earnings ─────────────────────────────────────────────────
  app.get('/earnings', { preHandler: [authenticate, requireVerifiedTeacher] }, async (request, reply) => {
    const q = request.query as { page?: string; limit?: string };
    const page  = Math.max(1, parseInt(q.page  ?? '1',  10));
    const limit = Math.min(50, Math.max(1, parseInt(q.limit ?? '20', 10)));
    const result = await TeacherService.getEarnings(request.user.id, page, limit);
    return reply.status(200).send({
      success: true,
      data: result.earnings,
      error: null,
      meta: {
        total:  result.total,
        page,
        limit,
        pages:  Math.ceil(result.total / limit),
        totals: result.totals,
      },
    });
  });
}
