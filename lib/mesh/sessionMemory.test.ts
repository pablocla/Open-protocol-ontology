import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  getSessionMessages,
  saveSessionMessages,
  appendMessage,
  getAgentContext,
  setAgentContext,
  getSemanticFacts,
  setSemanticFacts,
  takeSessionSnapshot
} from './sessionMemory';
import { SwarmMemory } from '../engine/blackboard/blackboard';
import { AgentMessage } from './meshTypes';

describe('sessionMemory', () => {
  const sessionId = 'test-session-123';

  beforeAll(() => {
    process.env.OPO_USE_MEMORY_BLACKBOARD = 'true';
  });

  afterAll(async () => {
    await SwarmMemory.delete(`session:${sessionId}:messages`);
    await SwarmMemory.delete(`session:${sessionId}:facts`);
    await SwarmMemory.delete(`session:${sessionId}:agent:test-agent:last`);
  });

  it('should get empty messages initially', async () => {
    const messages = await getSessionMessages(sessionId);
    expect(messages).toEqual([]);
  });

  it('should save and get messages', async () => {
    const testMessages: AgentMessage[] = [
      { id: '1', role: 'user', content: 'hello', timestamp: new Date().toISOString() },
      { id: '2', role: 'assistant', content: 'world', timestamp: new Date().toISOString() }
    ];

    await saveSessionMessages(sessionId, testMessages);
    const retrieved = await getSessionMessages(sessionId);
    expect(retrieved).toEqual(testMessages);
  });

  it('should append messages correctly', async () => {
    const additionalMessage: AgentMessage = {
      id: '3',
      role: 'user',
      content: 'test append',
      timestamp: new Date().toISOString()
    };

    await appendMessage(sessionId, additionalMessage);
    const messages = await getSessionMessages(sessionId);
    expect(messages.length).toBe(3);
    expect(messages[2]).toEqual(additionalMessage);
  });

  it('should manage agent contexts', async () => {
    const context = { state: 'finished', count: 42 };
    await setAgentContext(sessionId, 'test-agent', context);

    const retrieved = await getAgentContext(sessionId, 'test-agent');
    expect(retrieved).toEqual(context);
  });

  it('should manage semantic facts', async () => {
    const facts = { sqlRun: 'SELECT * FROM customers', entity: 'customers' };
    await setSemanticFacts(sessionId, facts);

    const retrieved = await getSemanticFacts(sessionId);
    expect(retrieved).toEqual(facts);
  });

  it('should filter snapshots to only contain session-specific state keys', async () => {
    // Write another session's data to ensure filtering works
    await SwarmMemory.set('session:other-session:messages', [{ id: '99', role: 'user', content: 'other' }]);

    const snapshot = await takeSessionSnapshot(sessionId);
    expect(snapshot.state).toBeDefined();
    
    // Should contain this session's keys
    expect(snapshot.state[`session:${sessionId}:messages`]).toBeDefined();
    expect(snapshot.state[`session:${sessionId}:facts`]).toBeDefined();
    expect(snapshot.state[`session:${sessionId}:agent:test-agent:last`]).toBeDefined();

    // Should NOT contain the other session's keys
    expect(snapshot.state['session:other-session:messages']).toBeUndefined();

    // Cleanup other session data
    await SwarmMemory.delete('session:other-session:messages');
  });
});
