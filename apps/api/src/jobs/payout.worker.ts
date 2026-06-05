import { Worker, Job } from 'bullmq';
import { redis } from '../lib/redis';
import { prisma } from '@apna-rank/db';

// Teacher payout pipeline (triggered on successful test purchase):
// 1. Calculate split: 60% teacher / 40% platform
// 2. Create TeacherEarning record (status=pending)
// 3. TODO: trigger Razorpay payout (monthly batch preferred over per-transaction)

export const payoutWorker = new Worker(
  'payout',
  async (job: Job) => {
    const { testPurchaseId, teacherId, grossAmount } = job.data as {
      testPurchaseId: string;
      teacherId: string;
      grossAmount: number;
    };

    const platformCut = grossAmount * 0.4;
    const teacherAmount = grossAmount * 0.6;

    await prisma.teacherEarning.create({
      data: {
        teacherId,
        testPurchaseId,
        grossAmount,
        platformCut,
        teacherAmount,
        status: 'pending',
      },
    });

    // TODO: queue for monthly Razorpay payout batch
    console.log(`[payout] Earned ₹${teacherAmount} for teacher=${teacherId}`);
  },
  { connection: redis },
);

payoutWorker.on('failed', (job, err) => {
  console.error(`[payout] Job ${job?.id} failed:`, err.message);
});
