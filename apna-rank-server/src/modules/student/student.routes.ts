import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { ok } from '../../shared/response';
import { authenticate } from '../../shared/middleware/authenticate';
import { requireRole } from '../../shared/middleware/rbac';

const profileBody = z.object({
  examCategory: z.enum([
    'SSC_CGL','SSC_CHSL','SSC_MTS','SSC_GD','SSC_CPO',
    'RAILWAY_NTPC','RAILWAY_GROUP_D','RAILWAY_ALP','RAILWAY_JE',
    'UPSC_CSE','UPSC_CDS','UPSC_NDA',
    'NEET_UG','NEET_PG',
    'JEE_MAIN','JEE_ADVANCED',
    'BOARDS_10TH','BOARDS_12TH',
  ]),
  examSubType: z.string().optional(),
  targetYear: z.number().int().min(2024).max(2035).optional(),
  examDate: z.string().date().optional(),
  languagePref: z.enum(['hi', 'en']).optional(),
});

const notebookPatchBody = z.object({
  studentNote: z.string().max(1000).optional(),
  isResolved: z.boolean().optional(),
});

export default async function studentRoutes(app: FastifyInstance) {
  const auth = { preHandler: authenticate };
  const studentAuth = { preHandler: [authenticate, requireRole('student')] };

  // POST /api/v1/student/profile — create/update exam selection & preferences
  app.post('/profile', studentAuth, async (request, reply) => {
    const body = profileBody.parse(request.body);
    // TODO: StudentService.upsertProfile(request.user.id, body)
    return reply.status(200).send(ok({ message: 'Profile updated' }));
  });

  // GET /api/v1/student/baseline — adaptive baseline test (5–7 Q, IRT binary-search)
  app.get('/baseline', studentAuth, async (request, reply) => {
    // TODO: StudentService.getBaselineTest(request.user.id)
    return reply.status(200).send(ok({ questions: [], instructions: 'Adaptive baseline' }));
  });

  // GET /api/v1/student/dashboard — streak, aaj ka kaam, topic heatmap, progress
  app.get('/dashboard', auth, async (request, reply) => {
    // TODO: StudentService.getDashboard(request.user.id)
    return reply.status(200).send(ok({
      streak: 0,
      aajKaKaam: null,
      heatmap: [],
      readinessPct: null,
    }));
  });

  // GET /api/v1/student/progress — day-wise performance for progress graph
  app.get('/progress', auth, async (request, reply) => {
    // TODO: StudentService.getProgressGraph(request.user.id)
    return reply.status(200).send(ok({ days: [] }));
  });

  // GET /api/v1/student/galti-notebook — sorted by most repeated errors first
  app.get('/galti-notebook', auth, async (request, reply) => {
    // TODO: StudentService.getGaltiNotebook(request.user.id, query.page, query.filter)
    return reply.status(200).send(ok({ entries: [] }));
  });

  // PATCH /api/v1/student/galti-notebook/:id — add personal note or mark resolved
  app.patch('/galti-notebook/:id', auth, async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = notebookPatchBody.parse(request.body);
    // TODO: StudentService.updateGaltiEntry(id, request.user.id, body)
    return reply.status(200).send(ok({ updated: true }));
  });

  // GET /api/v1/student/readiness — "Ready in X topics, Y remaining"
  app.get('/readiness', auth, async (request, reply) => {
    // TODO: StudentService.getReadinessSignal(request.user.id)
    return reply.status(200).send(ok({ readyTopics: [], remainingTopics: [], readinessPct: 0 }));
  });
}
