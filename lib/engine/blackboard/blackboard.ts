import { BlackboardAdapter, SemanticLock, SwarmMemorySnapshot } from '../types/blackboard';
import { MemoryBlackboardAdapter } from './memory-adapter';
import Redis from 'ioredis';

export class RedisBlackboardAdapter implements BlackboardAdapter {
  private client: Redis;
  private pub: Redis;
  private sub: Redis;
  private subscribers: Map<string, Array<(message: any) => void>> = new Map();

  constructor(redisUrl: string) {
    const options = { maxRetriesPerRequest: null, retryStrategy: (times: number) => Math.min(times * 50, 2000) };
    this.client = new Redis(redisUrl, options as any);
    this.pub = new Redis(redisUrl, options as any);
    this.sub = new Redis(redisUrl, options as any);

    const suppressError = (err: any) => {
      if (err.code !== 'ECONNREFUSED') console.error('[Blackboard Redis]', err.message);
    };
    
    this.client.on('error', suppressError);
    this.pub.on('error', suppressError);
    this.sub.on('error', suppressError);

    this.sub.on('message', (channel, message) => {
      const handlers = this.subscribers.get(channel);
      if (handlers) {
        try {
          const parsed = JSON.parse(message);
          handlers.forEach(h => h(parsed));
        } catch (e) {
          console.error('[Blackboard] Error parsing pubsub message', e);
        }
      }
    });
  }

  async get(key: string): Promise<any> {
    const val = await this.client.get(`opo:bb:${key}`);
    return val ? JSON.parse(val) : null;
  }

  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    const strVal = JSON.stringify(value);
    if (ttlSeconds !== undefined && ttlSeconds !== null) {
      await this.client.set(`opo:bb:${key}`, strVal, 'EX', ttlSeconds);
    } else {
      await this.client.set(`opo:bb:${key}`, strVal);
    }
  }

  async delete(key: string): Promise<void> {
    await this.client.del(`opo:bb:${key}`);
  }

  async acquireLock(entityId: string, agentId: string, ttlMs: number = 30000): Promise<boolean> {
    const key = `opo:lock:${entityId}`;
    const value = JSON.stringify({ agentId, acquiredAt: Date.now(), expiresAt: Date.now() + ttlMs });
    
    // NX = Only set the key if it does not already exist.
    // PX = Set the specified expire time, in milliseconds.
    const result = await this.client.set(key, value, 'PX', ttlMs, 'NX');
    return result === 'OK';
  }

  async releaseLock(entityId: string, agentId: string): Promise<boolean> {
    const key = `opo:lock:${entityId}`;
    const current = await this.client.get(key);
    if (!current) return false;

    const data = JSON.parse(current);
    if (data.agentId === agentId) {
      await this.client.del(key);
      return true;
    }
    return false;
  }

  async publish(channel: string, message: any): Promise<void> {
    await this.pub.publish(channel, JSON.stringify(message));
  }

  async subscribe(channel: string, handler: (message: any) => void): Promise<void> {
    if (!this.subscribers.has(channel)) {
      this.subscribers.set(channel, []);
      await this.sub.subscribe(channel);
    }
    this.subscribers.get(channel)!.push(handler);
  }

  async unsubscribe(channel: string, handler: (message: any) => void): Promise<void> {
    const handlers = this.subscribers.get(channel);
    if (handlers) {
      const remaining = handlers.filter(h => h !== handler);
      if (remaining.length === 0) {
        this.subscribers.delete(channel);
        await this.sub.unsubscribe(channel);
      } else {
        this.subscribers.set(channel, remaining);
      }
    }
  }

  async takeSnapshot(): Promise<SwarmMemorySnapshot> {
    const state: Record<string, any> = {};
    let cursor = '0';
    do {
      const [newCursor, keys] = await this.client.scan(cursor, 'MATCH', 'opo:bb:*', 'COUNT', 100);
      cursor = newCursor;
      for (const k of keys) {
        const val = await this.client.get(k);
        state[k.replace('opo:bb:', '')] = val ? JSON.parse(val) : null;
      }
    } while (cursor !== '0');

    const locks: SemanticLock[] = [];
    let lockCursor = '0';
    do {
      const [newCursor, lockKeys] = await this.client.scan(lockCursor, 'MATCH', 'opo:lock:*', 'COUNT', 100);
      lockCursor = newCursor;
      for (const lk of lockKeys) {
        const val = await this.client.get(lk);
        if (val) {
          const parsed = JSON.parse(val);
          locks.push({
            entityId: lk.replace('opo:lock:', ''),
            ...parsed
          });
        }
      }
    } while (lockCursor !== '0');

    return {
      id: `snap_${Date.now()}`,
      timestamp: Date.now(),
      state,
      locks
    };
  }

  async close(): Promise<void> {
    await this.client.quit();
    await this.pub.quit();
    await this.sub.quit();
  }
}

// Global factory logic
let instance: BlackboardAdapter;

export function getBlackboard(): BlackboardAdapter {
  if (!instance) {
    const useMemory = process.env.OPO_USE_MEMORY_BLACKBOARD === 'true';
    const redisUrl = process.env.REDIS_URL;

    if (useMemory || !redisUrl) {
      console.log('[Blackboard] Using MemoryBlackboardAdapter');
      instance = new MemoryBlackboardAdapter();
    } else {
      console.log('[Blackboard] Using RedisBlackboardAdapter');
      instance = new RedisBlackboardAdapter(redisUrl);
    }
  }
  return instance;
}

export const SwarmMemory = getBlackboard();

// GROK OPTIMIZATION: Expose a way to cleanly close Redis connections (prevents leaks on dev server restarts)
export async function closeBlackboard(): Promise<void> {
  if (instance && 'close' in instance) {
    await (instance as any).close?.();
  }
}

/**
 * Multi-tenant helper for future SaaS (Clerk/Supabase tenant isolation).
 * Prefixes keys so different customers' swarms/secrets never collide.
 * Usage: getTenantBlackboard('tenant_123').set(...)
 * Falls back to global if no tenant (current single-tenant behavior).
 */
export function getTenantBlackboard(tenantId: string = 'default') {
  const prefix = `tenant:${tenantId}:`;
  return {
    async get(key: string) {
      return SwarmMemory.get(`${prefix}${key}`);
    },
    async set(key: string, value: any) {
      return SwarmMemory.set(`${prefix}${key}`, value);
    },
    async delete(key: string) {
      return SwarmMemory.delete(`${prefix}${key}`);
    },
    async publish(channel: string, message: any) {
      return SwarmMemory.publish(`${prefix}${channel}`, message);
    },
    async subscribe(channel: string, handler: (msg: any) => void) {
      return SwarmMemory.subscribe(`${prefix}${channel}`, handler);
    },
    // ... other methods can be proxied similarly
  };
}
