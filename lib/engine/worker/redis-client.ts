import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL;
const options = redisUrl ? { maxRetriesPerRequest: null } : { host: '127.0.0.1', port: 6379, maxRetriesPerRequest: null, retryStrategy: (times: number) => Math.min(times * 50, 2000) };

export const sharedRedisClient = redisUrl ? new Redis(redisUrl, options) : new Redis(options as any);

// Suppress unhandled error spam in console if Redis is not running locally
sharedRedisClient.on('error', (err) => {
  if (err.code === 'ECONNREFUSED') {
    // Silently ignore to prevent console spam
  } else {
    console.error('[Redis] Error:', err.message);
  }
});
