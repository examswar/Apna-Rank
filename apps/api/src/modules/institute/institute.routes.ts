import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { ok } from '../../lib/response';
import { authenticate } from '../../middleware/authenticate';
import { requireInstituteAdmin } from '../../middleware/rbac';
import * as InstituteService from './institute.service';

const EXAM_CATEGORIES = [
  'SSC_CGL', 'SSC_CHSL', 'SSC_MTS', 'SSC_GD', 'SSC_CPO',
  'RAILWAY_NTPC', 'RAILWAY_GROUP_D', 'RAILWAY_ALP', 'RAILWAY_JE',
  'UPSC_CSE', 'UPSC_CDS', 'UPSC_NDA',
  'NEET_UG', 'NEET_PG', 'JEE_MAIN', 'JEE_ADVANCED',
  'BOARDS_10TH', 'BOARDS_12TH',
] as const;

const registerBody = z.object({
  name:             z.string().min(2).max(255),
  type:             z.enum(['coaching', 'school', 'college']),
  city:             z.string().max(100).optional(),
  state:            z.string().max(100).optional(),
  hasMinorStudents: z.boolean().default(false),
});

const dpaBody = z.object({
  signedBy: z.string().min(2).max(255),
});

const createBatchBody = z.object({
  name:         z.string().min(1).max(255),
  examCategory: z.enum(EXAM_CATEGORIES),
});

export default async function instituteRoutes(app: FastifyInstance) {
  const adminAuth = { preHandler: [authenticate, requireInstituteAdmin] };

  // ── POST /institute — register a new institute ─────────────────────────────
  // Any authenticated user can register an institute (role upgrades to institute_admin).
  app.post('/', { preHandler: authenticate }, async (request, reply) => {
    const body = registerBody.parse(request.body);
    const result = await InstituteService.create(request.user.id, body);
    return reply.status(201).send(ok(result));
  });

  // ── GET /institute/profile ─────────────────────────────────────────────────
  app.get('/profile', adminAuth, async (request, reply) => {
    const institute = await InstituteService.getProfile(request.user.id);
    return reply.status(200).send(ok(institute));
  });

  // ── POST /institute/dpa/sign ───────────────────────────────────────────────
  // Creates an immutable DPA audit record. Required before handling minor students.
  app.post('/dpa/sign', adminAuth, async (request, reply) => {
    const { signedBy } = dpaBody.parse(request.body);
    const ip     = request.ip ?? '0.0.0.0';
    const result = await InstituteService.signDpa(request.user.id, signedBy, ip);
    return reply.status(200).send(ok(result));
  });

  // ── GET /institute/batches ─────────────────────────────────────────────────
  app.get('/batches', adminAuth, async (request, reply) => {
    const batches = await InstituteService.listBatches(request.user.id);
    return reply.status(200).send(ok(batches));
  });

  // ── POST /institute/batches ────────────────────────────────────────────────
  app.post('/batches', adminAuth, async (request, reply) => {
    const body  = createBatchBody.parse(request.body);
    const batch = await InstituteService.createBatch(request.user.id, body);
    return reply.status(201).send(ok(batch));
  });

  // ── POST /institute/batches/:id/students/invite ───────────────────────────
  // Generates a shareable invite link valid for 7 days.
  // Students visit the link and are automatically enrolled in the batch.
  app.post('/batches/:id/students/invite', adminAuth, async (request, reply) => {
    const { id } = request.params as { id: string };
    const result  = await InstituteService.generateBatchInvite(id, request.user.id);
    return reply.status(201).send(ok(result));
  });

  // ── GET /institute/batches/:id/heatmap ────────────────────────────────────
  // Topic-level error rate aggregation. No individual student data returned.
  app.get('/batches/:id/heatmap', adminAuth, async (request, reply) => {
    const { id } = request.params as { id: string };
    const heatmap = await InstituteService.getBatchHeatmap(id, request.user.id);
    return reply.status(200).send(ok(heatmap));
  });

  // ── GET /institute/batches/:id/lesson-plan ────────────────────────────────
  // Auto-generated Hindi weekly plan based on the batch's weakest topics.
  app.get('/batches/:id/lesson-plan', adminAuth, async (request, reply) => {
    const { id }   = request.params as { id: string };
    const plan     = await InstituteService.getLessonPlan(id, request.user.id);
    return reply.status(200).send(ok(plan));
  });

  // ── GET /institute/dropout-alerts ─────────────────────────────────────────
  // Returns students across all batches who haven't been active in 5+ days.
  app.get('/dropout-alerts', adminAuth, async (request, reply) => {
    const alerts = await InstituteService.getDropoutAlerts(request.user.id);
    return reply.status(200).send(ok(alerts));
  });
}
