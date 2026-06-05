import { FastifyInstance } from 'fastify';
import { createHmac } from 'crypto';
import { prisma } from '@apna-rank/db';
import { config } from '../../lib/config';
import { fail } from '../../lib/response';

const PLATFORM_CUT = 0.40;
const TEACHER_CUT  = 0.60;

export default async function webhookRoutes(app: FastifyInstance) {
  // Override the JSON parser within this plugin scope so we can access the
  // raw request body needed for Razorpay HMAC-SHA256 signature verification.
  // This does NOT affect other routes outside this plugin scope.
  app.removeContentTypeParser('application/json');
  app.addContentTypeParser(
    'application/json',
    { parseAs: 'buffer' },
    (_req, body, done) => {
      try {
        done(null, body);         // expose Buffer as request.body
      } catch (e) {
        done(e as Error, undefined);
      }
    },
  );

  // ── POST /api/v1/webhooks/razorpay ────────────────────────────────────────
  // No JWT auth — Razorpay calls this directly.
  // Signature: HMAC-SHA256 of raw body using RAZORPAY_WEBHOOK_SECRET.
  app.post('/razorpay', async (request, reply) => {
    const rawBody   = request.body as Buffer;
    const signature = (request.headers['x-razorpay-signature'] as string) ?? '';

    const expected = createHmac('sha256', config.RAZORPAY_WEBHOOK_SECRET)
      .update(rawBody)
      .digest('hex');

    if (expected !== signature) {
      app.log.warn('[webhook] Invalid Razorpay signature — request rejected');
      return reply.status(400).send(fail('INVALID_SIGNATURE', 'Webhook signature mismatch'));
    }

    let event: Record<string, any>;
    try {
      event = JSON.parse(rawBody.toString('utf8'));
    } catch {
      return reply.status(400).send(fail('INVALID_BODY', 'Could not parse webhook payload'));
    }

    const eventType: string = event.event ?? '';
    app.log.info(`[webhook] Razorpay event: ${eventType}`);

    if (eventType === 'payment.captured' || eventType === 'order.paid') {
      // Razorpay sends order_id in slightly different paths for different events
      const razorpayOrderId: string | undefined =
        event.payload?.payment?.entity?.order_id ??
        event.payload?.order?.entity?.id;

      if (razorpayOrderId) {
        await handlePaymentCaptured(razorpayOrderId, app);
      }
    }

    // Always acknowledge with 200 so Razorpay doesn't retry
    return reply.status(200).send({ ok: true });
  });
}

// ── Payment capture handler ───────────────────────────────────────────────────

async function handlePaymentCaptured(razorpayOrderId: string, app: FastifyInstance) {
  const purchase = await prisma.testPurchase.findFirst({
    where: { razorpayOrderId, status: 'pending' },
    select: {
      id: true,
      amountPaid: true,
      testId: true,
      test: { select: { createdBy: true } },
    },
  });

  if (!purchase) {
    // Already processed (idempotent) or unknown order — skip silently
    app.log.info(`[webhook] No pending purchase found for order ${razorpayOrderId} — skipping`);
    return;
  }

  const grossAmount     = Number(purchase.amountPaid);
  const platformAmount  = +(grossAmount * PLATFORM_CUT).toFixed(2);
  const teacherAmount   = +(grossAmount * TEACHER_CUT).toFixed(2);

  await prisma.$transaction(async (tx) => {
    await tx.testPurchase.update({
      where: { id: purchase.id },
      data:  { status: 'paid' },
    });

    // Create a teacher earning only if the test was created by a registered teacher
    const teacherRecord = await tx.teacher.findUnique({
      where:  { userId: purchase.test.createdBy },
      select: { id: true },
    });

    if (teacherRecord) {
      await tx.teacherEarning.create({
        data: {
          teacherId:      teacherRecord.id,
          testPurchaseId: purchase.id,
          grossAmount,
          platformCut:    platformAmount,
          teacherAmount,
          status:         'pending',
        },
      });
      app.log.info(
        `[webhook] TeacherEarning created: teacher=${teacherRecord.id} ` +
        `gross=${grossAmount} teacher=${teacherAmount}`,
      );
    }
  });
}
