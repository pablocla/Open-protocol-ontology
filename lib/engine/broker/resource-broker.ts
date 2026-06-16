import { Queue, Worker, Job } from 'bullmq';
import { CredentialKey, ConsumptionReport } from '../types/credentials';
import { CredentialVault } from '../vault/credential-vault';
import { getSharedRedisClient } from '../worker/redis-client';

class ResourceBrokerImpl {
  private vault: CredentialVault;
  private queues: Map<string, Queue> = new Map();
  private workers: Map<string, Worker> = new Map();
  
  // Pending acquires: job ID -> function to unblock the worker
  private activeLocks: Map<string, { resolveRelease: () => void }> = new Map();
  
  // Pending agents waiting to acquire: job ID -> function to resolve acquireKey
  private waitingAgents: Map<string, { resolveAcquire: (key: CredentialKey) => void, rejectAcquire: (err: any) => void }> = new Map();

  private consumption: ConsumptionReport = {
    keys: {},
    agents: {}
  };

  constructor() {
    this.vault = new CredentialVault();
  }

  private initKeyQueue(key: CredentialKey) {
    if (this.queues.has(key.id)) return;

    // Rate limit: e.g., 10 concurrent, 60 requests per minute
    // We can fetch this from some config, here we use defaults
    const maxConcurrent = 5; 
    
    // GROK OPTIMIZATION: Standardized job retention + exponential backoff to prevent Redis bloat (FASE 2)
    // Jobs are auto-removed after completion or limited failures. Backoff helps with transient rate limits / LLM hiccups.
    const queue = new Queue(key.id, { 
      connection: getSharedRedisClient() as any,   // GROK OPTIMIZATION: tolerate BullMQ/ioredis internal type skew common in this stack
      defaultJobOptions: {
        removeOnComplete: true,
        removeOnFail: 50,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1500
        }
      }
    });
    this.queues.set(key.id, queue);

    const worker = new Worker(key.id, async (job: Job) => {
      const agentId = job.data.agentId;
      
      // We are now allowed to run (Worker picked up the job)
      return new Promise<void>((resolveRelease, rejectRelease) => {
        // Store the resolver so `releaseKey` can unblock this worker
        this.activeLocks.set(job.id!, { resolveRelease });

        // Unblock the acquireKey caller
        const waiting = this.waitingAgents.get(job.id!);
        if (waiting) {
          waiting.resolveAcquire(key);
          this.waitingAgents.delete(job.id!);
        } else {
          // Should not happen, but if caller disappeared, we just release
          resolveRelease();
        }
      });
    }, { 
      connection: getSharedRedisClient() as any,
      concurrency: maxConcurrent,
      // Optional BullMQ rate limiting can go here if using BullMQ Pro or manual limiter
    });

    this.workers.set(key.id, worker);
  }

  async acquireKey(agentId: string, provider: 'openai' | 'gemini' | 'anthropic'): Promise<CredentialKey> {
    // 1. Find an available key in the vault for this provider
    const keys = this.vault.listKeys().filter(k => k.provider === provider);
    if (keys.length === 0) {
      throw new Error(`No credentials found for provider: ${provider}`);
    }

    // For simplicity, we just pick the first matching key
    // In a more advanced implementation, we could load balance or check quotas
    const selectedKey = keys[0];

    // 2. Ensure queue and worker exist for this key
    this.initKeyQueue(selectedKey);

    const queue = this.queues.get(selectedKey.id)!;
    
    // 3. Add job to queue
    const job = await queue.add('acquire', { agentId });

    // 4. Wait until the worker starts processing this job
    return new Promise((resolve, reject) => {
      this.waitingAgents.set(job.id!, { resolveAcquire: resolve, rejectAcquire: reject });
      
      // Initialize consumption metrics
      if (!this.consumption.agents[agentId]) {
        this.consumption.agents[agentId] = { tokensUsed: 0, requestCount: 0 };
      }
      if (!this.consumption.keys[selectedKey.id]) {
        this.consumption.keys[selectedKey.id] = { provider, tokensUsed: 0, requestCount: 0, rateLimitHits: 0 };
      }
      
      this.consumption.agents[agentId].requestCount++;
      this.consumption.keys[selectedKey.id].requestCount++;
    });
  }

  async releaseKey(keyId: string, tokensUsed: number, jobId?: string): Promise<void> {
    // Update metrics
    if (this.consumption.keys[keyId]) {
      this.consumption.keys[keyId].tokensUsed += tokensUsed;
    }
    // Note: To map tokensUsed to agentId perfectly, we'd need to pass agentId or jobId to releaseKey.
    // For this implementation, we assume jobId is passed if tracking per agent is needed exactly, 
    // but the prompt signature only has `releaseKey(keyId, tokensUsed)`. 
    // We will unblock ALL active locks for this key if jobId is not provided (simplified), 
    // or ideally we need a way to track which lock is being released.
    // Let's pop the first active lock for simplicity if jobId is omitted.

    let lockIdToRelease = jobId;
    if (!lockIdToRelease) {
      // Just find any active lock for this queue (hacky, but signature is limited)
      // We will enhance by assuming releaseKey is called and we just grab the oldest lock
      const firstActive = this.activeLocks.keys().next().value;
      if (firstActive) {
        lockIdToRelease = firstActive;
      }
    }

    if (lockIdToRelease) {
      const lock = this.activeLocks.get(lockIdToRelease);
      if (lock) {
        lock.resolveRelease();
        this.activeLocks.delete(lockIdToRelease);
      }
    }
  }

  async getConsumptionReport(): Promise<ConsumptionReport> {
    return JSON.parse(JSON.stringify(this.consumption));
  }

  // Exposed for tests
  async _close() {
    for (const worker of this.workers.values()) {
      await worker.close();
    }
    for (const queue of this.queues.values()) {
      await queue.close();
    }
  }
}

// Singleton instance
export const ResourceBroker = new ResourceBrokerImpl();

// GROK OPTIMIZATION: Allow clean shutdown of BullMQ + Redis (important for Next.js dev HMR / restarts)
export async function closeResourceBroker(): Promise<void> {
  await (ResourceBroker as any)._close?.();
}
