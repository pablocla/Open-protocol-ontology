import Redis from 'ioredis';

/** Swarm queue + worker require an explicit REDIS_URL (disabled in memory-blackboard dev mode). */
export function isSwarmQueueEnabled(): boolean {
  if (process.env.OPO_USE_MEMORY_BLACKBOARD === 'true') return false;
  return Boolean(process.env.REDIS_URL);
}

let client: Redis | null = null;

export function getSharedRedisClient(): Redis {
  if (!client) {
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) {
      throw new Error(
        'REDIS_URL is required for swarm queue operations. Set REDIS_URL or OPO_USE_MEMORY_BLACKBOARD=true for local dev without Redis.'
      );
    }
    client = new Redis(redisUrl, { maxRetriesPerRequest: null });
    client.on('error', (err) => {
      if ((err as NodeJS.ErrnoException).code === 'ECONNREFUSED') {
        // Silently ignore to prevent console spam when Redis is down
      } else {
        console.error('[Redis] Error:', err.message);
      }
    });
  }
  return client;
}