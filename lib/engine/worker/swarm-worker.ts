import { Worker, Job } from 'bullmq';
import { SwarmMemory } from '../blackboard/blackboard';
import { agentExecutor } from '@/lib/mesh/agentExecutor';
import { SWARM_QUEUE_NAME, SwarmJobData } from './swarm-queue';
import { getTimeTravelDB } from '../timetravel/time-travel-db';
import { getSharedRedisClient } from './redis-client';
import { takeSessionSnapshot } from '@/lib/mesh/sessionMemory';

let swarmWorker: Worker | null = null;
const timeTravel = getTimeTravelDB();

export function startSwarmWorker() {
  if (swarmWorker) return swarmWorker;

  console.log(`[Swarm Worker] Starting worker for queue: ${SWARM_QUEUE_NAME}`);

  swarmWorker = new Worker<SwarmJobData>(
    SWARM_QUEUE_NAME,
    async (job: Job<SwarmJobData>) => {
      const { sessionId, session, apiKeys, llmConfig, erpExecution } = job.data;
      
      console.log(`[Swarm Worker] Executing job ${job.id} for session ${sessionId}`);
      
      const channel = `session:${sessionId}:stream`;

      // Helper to broadcast events via Blackboard PubSub
      const broadcast = async (msg: any) => {
        await SwarmMemory.publish(channel, msg);
      };

      try {
        await broadcast({ type: 'status', message: 'Worker picked up job, starting execution...' });

        const generator = agentExecutor.executePipeline(session, apiKeys, llmConfig, erpExecution);
        
        for await (const message of generator) {
          await broadcast({ type: 'message', message });

          // GROK OPTIMIZATION: Take and persist snapshot per session
          try {
            const snapshot = await takeSessionSnapshot(sessionId);
            timeTravel.saveSnapshot(sessionId, snapshot);
          } catch (e) {
            console.warn('[Swarm Worker] Failed to persist timeline snapshot', e);
          }
        }

        await broadcast({ type: 'done' });
        console.log(`[Swarm Worker] Job ${job.id} completed successfully`);

      } catch (error: any) {
        console.error(`[Swarm Worker] Job ${job.id} failed:`, error);
        await broadcast({ type: 'error', error: error.message });
        throw error; // Will trigger BullMQ retry logic if configured
      }
    },
    {
      connection: getSharedRedisClient() as any,
      concurrency: parseInt(process.env.OPO_SWARM_WORKER_CONCURRENCY || '5', 10)
    }
  );

  swarmWorker.on('failed', (job, err) => {
    console.error(`[Swarm Worker] Job ${job?.id} permanently failed:`, err);
  });

  return swarmWorker;
}

export function stopSwarmWorker() {
  if (swarmWorker) {
    swarmWorker.close();
    swarmWorker = null;
  }
}
