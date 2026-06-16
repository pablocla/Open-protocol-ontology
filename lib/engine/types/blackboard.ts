export interface SemanticLock {
  entityId: string;
  agentId: string;
  acquiredAt: number;
  expiresAt: number;
}

export interface SwarmMemorySnapshot {
  id: string;
  timestamp: number;
  state: Record<string, any>;
  locks: SemanticLock[];
}

export interface BlackboardAdapter {
  get(key: string): Promise<any>;
  set(key: string, value: any, ttlSeconds?: number): Promise<void>;
  delete(key: string): Promise<void>;
  
  acquireLock(entityId: string, agentId: string, ttlMs?: number): Promise<boolean>;
  releaseLock(entityId: string, agentId: string): Promise<boolean>;
  
  publish(channel: string, message: any): Promise<void>;
  subscribe(channel: string, handler: (message: any) => void): Promise<void>;
  unsubscribe(channel: string, handler: (message: any) => void): Promise<void>;

  takeSnapshot(): Promise<SwarmMemorySnapshot>;
  close(): Promise<void>;
}
