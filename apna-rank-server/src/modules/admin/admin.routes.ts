import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { ok } from '../../shared/response';
import { authenticate } from '../../shared/middleware/authenticate';
import { requireRole } from '../../shared/middleware/rbac';

const platformAdmin = { preHandler: [authenticate, requireRole('platform_admin')] };

const verifyTeacherBody = z.object({
  teacherId: z.string().uuid(),
  action: z.enum(['approve', 'reject', 'suspend']),
  reason: z.string().optional(),
});

const verifyInstituteBody = z.object({
  instituteId: z.string().uuid(),
  action: z.enum(['approve', 'reject']),
});

const moderateContentBody = z.object({
  reportId: z.string().uuid(),
  action: z.enum(['dismiss', 'remove_content', 'warn_creator']),
  notes: z.string().optional(),
});

export default async function adminRoutes(app: FastifyInstance) {
  // GET /api/v1/admin/teachers/pending — teachers awaiting verification
  app.get('/teachers/pending', platformAdmin, async (request, reply) => {
    // TODO: AdminService.getPendingTeachers()
    return reply.status(200).send(ok({ teachers: [] }));
  });

  // POST /api/v1/admin/teachers/verify
  app.post('/teachers/verify', platformAdmin, async (request, reply) => {
    const body = verifyTeacherBody.parse(request.body);
    // TODO: AdminService.verifyTeacher(body)
    return reply.status(200).send(ok({ updated: true }));
  });

  // GET /api/v1/admin/institutes/pending
  app.get('/institutes/pending', platformAdmin, async (request, reply) => {
    // TODO: AdminService.getPendingInstitutes()
    return reply.status(200).send(ok({ institutes: [] }));
  });

  // POST /api/v1/admin/institutes/verify
  app.post('/institutes/verify', platformAdmin, async (request, reply) => {
    const body = verifyInstituteBody.parse(request.body);
    // TODO: AdminService.verifyInstitute(body)
    return reply.status(200).send(ok({ updated: true }));
  });

  // GET /api/v1/admin/content-reports — moderation queue
  app.get('/content-reports', platformAdmin, async (request, reply) => {
    // TODO: AdminService.getContentReports()
    return reply.status(200).send(ok({ reports: [] }));
  });

  // POST /api/v1/admin/content-reports/moderate
  app.post('/content-reports/moderate', platformAdmin, async (request, reply) => {
    const body = moderateContentBody.parse(request.body);
    // TODO: AdminService.moderateContent(body)
    return reply.status(200).send(ok({ actioned: true }));
  });

  // GET /api/v1/admin/platform/stats — revenue, active users, diagnosis funnel
  app.get('/platform/stats', platformAdmin, async (request, reply) => {
    // TODO: AdminService.getPlatformStats()
    return reply.status(200).send(ok({ stats: {} }));
  });
}
