import { Worker, Job } from 'bullmq';
import { redis } from '../lib/redis';
import { resolveBattle } from '../modules/battle/battle.service';

// Fires when a battle's time limit expires.
// resolveBattle() is idempotent — safe to call even if both players already
// finished early (status will already be 'completed' and the function returns).

export function startBattleWorker(): Worker {
  const worker = new Worker(
    'battle',
    async (job: Job) => {
      const { battleId } = job.data as { battleId: string };
      console.log(`[battle] Timer expired for battle=${battleId}`);
      await resolveBattle(battleId);
    },
    { connection: redis },
  );

  worker.on('error', (err) => {
    console.error('[battle] Worker error:', (err as any).message ?? err);
  });
  worker.on('failed', (job, err) => {
    console.error(`[battle] Job ${job?.id} failed:`, err.message);
  });
  worker.on('completed', (job) => {
    console.log(`[battle] Job ${job?.id} completed`);
  });

  return worker;
}
