import { Worker, Job } from 'bullmq';
import { redis } from '../lib/redis';
import { prisma } from '@apna-rank/db';

// IRT (Item Response Theory) recalibration.
// Triggered when a question reaches ≥1000 attempts.
// Uses Rasch model: P(correct) = e^(θ-β) / (1 + e^(θ-β))
// where θ = student ability, β = question difficulty.

export const irtWorker = new Worker(
  'irt',
  async (job: Job) => {
    const { questionId } = job.data as { questionId: string };

    // TODO: aggregate correct/incorrect ratio across all non-minor attempts
    // TODO: run Rasch model calibration
    // TODO: update question.irt_difficulty
    console.log(`[irt] Recalibrating question=${questionId}`);
  },
  { connection: redis },
);

irtWorker.on('failed', (job, err) => {
  console.error(`[irt] Job ${job?.id} failed:`, err.message);
});
