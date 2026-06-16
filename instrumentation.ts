export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { isSwarmQueueEnabled } = await import('./lib/engine/worker/redis-client');
    if (isSwarmQueueEnabled()) {
      const { startSwarmWorker } = await import('./lib/engine/worker/swarm-worker');
      startSwarmWorker();
    } else {
      console.log(
        '[Swarm Worker] Skipped — set REDIS_URL (e.g. redis://:secretredispassword@localhost:6379) or start Docker Redis'
      );
    }
  }
}
