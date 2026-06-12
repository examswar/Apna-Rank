import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { ok, paginated } from '../../lib/response';
import { authenticate } from '../../middleware/authenticate';
import * as StudentService from './student.service';
import * as DiagnosisService from '../diagnosis/diagnosis.service';

const EXAM_CATEGORIES = [
  'SSC_CGL', 'SSC_CHSL', 'SSC_MTS', 'SSC_GD', 'SSC_CPO',
  'RAILWAY_NTPC', 'RAILWAY_GROUP_D', 'RAILWAY_ALP', 'RAILWAY_JE',
  'UPSC_CSE', 'UPSC_CDS', 'UPSC_NDA',
  'NEET_UG', 'NEET_PG',
  'JEE_MAIN', 'JEE_ADVANCED',
  'BOARDS_10TH', 'BOARDS_12TH',
] as const;

const onboardingExamBody = z.object({
  examCategory: z.enum(EXAM_CATEGORIES),
  examSubType: z.string().max(100).optional(),
  targetYear: z.number().int().min(2024).max(2035).optional(),
  attemptNumber: z.number().int().min(1).max(10).optional(),
});

const profileBody = z.object({
  examCategory: z.enum(EXAM_CATEGORIES).optional(),
  examSubType: z.string().max(100).optional(),
  targetYear: z.number().int().min(2024).max(2035).optional(),
  examDate: z.string().date().optional(),
  languagePref: z.enum(['hi', 'en']).optional(),
});

const baselineAnswerBody = z.object({
  attemptId: z.string().uuid(),
  questionId: z.string().uuid(),
  selectedOption: z.string().length(1),
});

const notebookPatchBody = z.object({
  studentNote: z.string().max(1000).optional(),
  isResolved: z.boolean().optional(),
});

export default async function studentRoutes(app: FastifyInstance) {
  const auth = { preHandler: authenticate };

  // POST /api/v1/student/onboarding/exam
  app.post('/onboarding/exam', auth, async (request, reply) => {
    const body = onboardingExamBody.parse(request.body);
    const profile = await StudentService.onboardingExam(request.user.id, body);
    return reply.status(200).send(ok(profile));
  });

  // POST /api/v1/student/profile
  app.post('/profile', auth, async (request, reply) => {
    const body = profileBody.parse(request.body);
    const profile = await StudentService.upsertProfile(request.user.id, body);
    return reply.status(200).send(ok(profile));
  });

  // GET /api/v1/student/profile
  app.get('/profile', auth, async (request, reply) => {
    const profile = await StudentService.getProfile(request.user.id);
    return reply.status(200).send(ok(profile));
  });

  // GET /api/v1/student/baseline/start
  app.get('/baseline/start', auth, async (request, reply) => {
    const result = await StudentService.startBaseline(request.user.id);
    return reply.status(200).send(ok(result));
  });

  // POST /api/v1/student/baseline/answer
  app.post('/baseline/answer', auth, async (request, reply) => {
    const body = baselineAnswerBody.parse(request.body);
    const result = await StudentService.answerBaseline(request.user.id, body);
    return reply.status(200).send(ok(result));
  });

  // GET /api/v1/student/dashboard
  app.get('/dashboard', auth, async (request, reply) => {
    const dashboard = await StudentService.getDashboard(request.user.id);
    return reply.status(200).send(ok(dashboard));
  });

  // GET /api/v1/student/galti-notebook?page=1&limit=20
  app.get('/galti-notebook', auth, async (request, reply) => {
    const { page = '1', limit = '20' } = request.query as {
      page?: string;
      limit?: string;
    };
    const p = Math.max(1, parseInt(page, 10) || 1);
    const l = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));
    const result = await StudentService.getGaltiNotebook(request.user.id, p, l);
    return reply.status(200).send(paginated(result.entries, result.total, result.page, result.limit));
  });

  // PATCH /api/v1/student/galti-notebook/:id
  app.patch('/galti-notebook/:id', auth, async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = notebookPatchBody.parse(request.body);
    const entry = await StudentService.updateGaltiEntry(id, request.user.id, body);
    return reply.status(200).send(ok(entry));
  });

  // GET /api/v1/student/aaj-ka-kaam — today's one task from latest diagnosis
  app.get('/aaj-ka-kaam', auth, async (request, reply) => {
    const result = await DiagnosisService.getAajKaKaam(request.user.id);
    return reply.status(200).send(ok(result));
  });

  // GET /api/v1/student/progress — 30-day daily activity calendar
  app.get('/progress', auth, async (request, reply) => {
    const result = await StudentService.getProgress(request.user.id);
    return reply.status(200).send(ok(result));
  });

  // GET /api/v1/student/readiness — topic readiness percentage
  app.get('/readiness', auth, async (request, reply) => {
    const result = await StudentService.getReadiness(request.user.id);
    return reply.status(200).send(ok(result));
  });
}
