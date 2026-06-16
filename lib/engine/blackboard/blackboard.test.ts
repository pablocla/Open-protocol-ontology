import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { MemoryBlackboardAdapter } from './memory-adapter';

// We test the MemoryBlackboardAdapter as a proxy for the interface
// since it runs reliably without Redis.

describe('SwarmMemory (Blackboard)', () => {
  let bb: MemoryBlackboardAdapter;

  beforeEach(() => {
    bb = new MemoryBlackboardAdapter();
  });

  afterAll(async () => {
    await bb.close();
  });

  it('should allow setting and getting values', async () => {
    await bb.set('test_key', { foo: 'bar' });
    const val = await bb.get('test_key');
    expect(val).toEqual({ foo: 'bar' });
  });

  it('should allow acquiring and releasing semantic locks', async () => {
    // Agent 1 acquires the lock
    const acquired = await bb.acquireLock('SalesOrder', 'agent_1', 5000);
    expect(acquired).toBe(true);

    // Agent 2 attempts to acquire the same lock, should fail
    const acquired2 = await bb.acquireLock('SalesOrder', 'agent_2', 5000);
    expect(acquired2).toBe(false);

    // Agent 1 releases the lock
    const released = await bb.releaseLock('SalesOrder', 'agent_1');
    expect(released).toBe(true);

    // Agent 2 attempts again, should succeed
    const acquired3 = await bb.acquireLock('SalesOrder', 'agent_2', 5000);
    expect(acquired3).toBe(true);
  });

  it('should allow pub/sub communication', async () => {
    const messages: any[] = [];
    const handler = (msg: any) => messages.push(msg);

    await bb.subscribe('test_channel', handler);
    await bb.publish('test_channel', { hello: 'world' });

    // Wait for macro task queue to clear since publish uses setTimeout in MemoryAdapter
    await new Promise(r => setTimeout(r, 10));

    expect(messages.length).toBe(1);
    expect(messages[0]).toEqual({ hello: 'world' });
  });

  it('should take a snapshot of the current state', async () => {
    await bb.set('key1', 'value1');
    await bb.acquireLock('entity1', 'agent1');

    const snap = await bb.takeSnapshot();
    expect(snap.state['key1']).toBe('value1');
    expect(snap.locks.length).toBe(1);
    expect(snap.locks[0].entityId).toBe('entity1');
    expect(snap.locks[0].agentId).toBe('agent1');
  });
});
