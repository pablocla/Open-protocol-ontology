import { BlackboardAdapter, SemanticLock, SwarmMemorySnapshot } from '../types/blackboard';

export class MemoryBlackboardAdapter implements BlackboardAdapter {
  private state: Map<string, any> = new Map();
  private locks: Map<string, SemanticLock> = new Map();
  private subscribers: Map<string, Array<(message: any) => void>> = new Map();

  async get(key: string): Promise<any> {
    return this.state.get(key);
  }

  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    this.state.set(key, value);
    if (ttlSeconds !== undefined && ttlSeconds !== null) {
      setTimeout(() => {
        // Only delete if the value has not been overwritten since
        if (this.state.get(key) === value) {
          this.state.delete(key);
        }
      }, ttlSeconds * 1000);
    }
  }

  async delete(key: string): Promise<void> {
    this.state.delete(key);
  }

  async acquireLock(entityId: string, agentId: string, ttlMs: number = 30000): Promise<boolean> {
    const existing = this.locks.get(entityId);
    const now = Date.now();

    if (existing && existing.expiresAt > now) {
      return false; // Locked by someone else (or us, but we return false to strictly follow lock semantics)
    }

    this.locks.set(entityId, {
      entityId,
      agentId,
      acquiredAt: now,
      expiresAt: now + ttlMs
    });

    return true;
  }

  async releaseLock(entityId: string, agentId: string): Promise<boolean> {
    const existing = this.locks.get(entityId);
    if (existing && existing.agentId === agentId) {
      this.locks.delete(entityId);
      return true;
    }
    return false;
  }

  async publish(channel: string, message: any): Promise<void> {
    const handlers = this.subscribers.get(channel) || [];
    handlers.forEach(h => {
      // Simulate async dispatch
      setTimeout(() => h(message), 0);
    });
  }

  async subscribe(channel: string, handler: (message: any) => void): Promise<void> {
    if (!this.subscribers.has(channel)) {
      this.subscribers.set(channel, []);
    }
    this.subscribers.get(channel)!.push(handler);
  }

  async unsubscribe(channel: string, handler: (message: any) => void): Promise<void> {
    const handlers = this.subscribers.get(channel);
    if (handlers) {
      this.subscribers.set(channel, handlers.filter(h => h !== handler));
    }
  }

  async takeSnapshot(): Promise<SwarmMemorySnapshot> {
    const stateObj: Record<string, any> = {};
    for (const [k, v] of this.state.entries()) {
      stateObj[k] = JSON.parse(JSON.stringify(v));
    }
    return {
      id: `snap_${Date.now()}`,
      timestamp: Date.now(),
      state: stateObj,
      locks: Array.from(this.locks.values())
    };
  }

  async close(): Promise<void> {
    this.state.clear();
    this.locks.clear();
    this.subscribers.clear();
  }
}
