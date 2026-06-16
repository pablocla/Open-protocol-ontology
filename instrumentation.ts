export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Only run worker logic in nodejs runtime, not edge
    const { startSwarmWorker } = await import('./lib/engine/worker/swarm-worker');
    startSwarmWorker();
  }
}
