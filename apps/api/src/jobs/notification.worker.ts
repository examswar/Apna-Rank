import { Worker, Job } from 'bullmq';
import { redis } from '../lib/redis';
import { prisma } from '@apna-rank/db';

// Notification delivery pipeline:
// 1. Write Notification row to DB
// 2. Push via FCM (or WebSocket if user is connected)
// 3. TODO: add FCM token table and device registration flow

export function startNotificationWorker(): Worker {
  const worker = new Worker(
    'notification',
    async (job: Job) => {
      const { userId, type, title, body } = job.data as {
        userId: string;
        type: string;
        title: string;
        body: string;
      };

      await prisma.notification.create({
        data: { userId, type, title, body },
      });

      // TODO: dispatch push via FCM
      console.log(`[notification] Sent type=${type} to user=${userId}`);
    },
    { connection: redis as any },
  );

  worker.on('error', (err) => {
    console.error('[notification] Worker error:', (err as any).message ?? err);
  });
  worker.on('failed', (job, err) => {
    console.error(`[notification] Job ${job?.id} failed:`, err.message);
  });
  worker.on('completed', (job) => {
    console.log(`[notification] Job ${job?.id} completed`);
  });

  return worker;
}
