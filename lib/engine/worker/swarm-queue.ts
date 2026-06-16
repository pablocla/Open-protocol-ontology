import { Queue } from 'bullmq';
import { MeshSession } from '@/lib/mesh/meshTypes';
import { getSharedRedisClient } from './redis-client';
import type { ErpExecutionContext } from '@/lib/studio/runOpoQuery';

export const SWARM_QUEUE_NAME = 'opo-swarm-execution';

export interface SwarmJobData {
  sessionId: string;
  session: MeshSession;
  apiKeys: Record<string, string>;
  // GROK FIX #5: carry full LLM config (provider + per-provider settings incl. baseUrl/model for ollama/openrouter etc) so server workers don't rely on client window
  llmConfig?: {
    currentProvider?: string;
    llmConfigs?: Record<string, { apiKey?: string; baseUrl?: string; model?: string }>;
  };
  erpExecution?: ErpExecutionContext;
}

let swarmQueue: Queue | null = null;

export function getSwarmQueue(): Queue {
  if (!swarmQueue) {
    swarmQueue = new Queue<SwarmJobData>(SWARM_QUEUE_NAME, {
      connection: getSharedRedisClient() as any,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000
        },
        removeOnComplete: 100,
        removeOnFail: 500
      }
    });
  }
  return swarmQueue;
}

export async function enqueueSwarmExecution(jobData: SwarmJobData) {
  const queue = getSwarmQueue();
  const job = await queue.add(`swarm-job-${jobData.sessionId}`, jobData);
  return job;
}
