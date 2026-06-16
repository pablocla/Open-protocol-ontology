import { SwarmMemory } from '../engine/blackboard/blackboard';
import { AgentMessage } from './meshTypes';
import { SwarmMemorySnapshot } from '../engine/types/blackboard';

/**
 * sessionMemory
 * Helpers for coordinating swarm session memory in the shared Blackboard (SwarmMemory).
 */

export async function getSessionMessages(sessionId: string): Promise<AgentMessage[]> {
  const messages = await SwarmMemory.get(`session:${sessionId}:messages`);
  return messages || [];
}

export async function saveSessionMessages(sessionId: string, messages: AgentMessage[]): Promise<void> {
  // Store messages in blackboard with a 24-hour TTL (86400 seconds)
  await SwarmMemory.set(`session:${sessionId}:messages`, messages, 86400);
}

export async function appendMessage(sessionId: string, message: AgentMessage): Promise<void> {
  const messages = await getSessionMessages(sessionId);
  messages.push(message);
  await saveSessionMessages(sessionId, messages);
}

export async function getAgentContext(sessionId: string, agentId: string): Promise<any> {
  return SwarmMemory.get(`session:${sessionId}:agent:${agentId}:last`);
}

export async function setAgentContext(sessionId: string, agentId: string, context: any): Promise<void> {
  // Store agent local context with 24-hour TTL
  await SwarmMemory.set(`session:${sessionId}:agent:${agentId}:last`, context, 86400);
}

export async function getSemanticFacts(sessionId: string): Promise<any> {
  return SwarmMemory.get(`session:${sessionId}:facts`);
}

export async function setSemanticFacts(sessionId: string, facts: any): Promise<void> {
  // Store extracted facts (SQL, decisions, entities) with a 7-day TTL (604800 seconds)
  await SwarmMemory.set(`session:${sessionId}:facts`, facts, 604800);
}

/**
 * Creates a session-specific snapshot of the Swarm Memory,
 * filtering out any blackboard state keys that do not belong to this session.
 */
export async function takeSessionSnapshot(sessionId: string): Promise<SwarmMemorySnapshot> {
  const fullSnapshot = await SwarmMemory.takeSnapshot();
  const sessionState: Record<string, any> = {};
  const prefix = `session:${sessionId}:`;

  for (const [key, value] of Object.entries(fullSnapshot.state)) {
    if (key.startsWith(prefix)) {
      sessionState[key] = value;
    }
  }

  return {
    id: fullSnapshot.id,
    timestamp: fullSnapshot.timestamp,
    state: sessionState,
    locks: fullSnapshot.locks // Include lock statuses to see visual card overlays in UI
  };
}
