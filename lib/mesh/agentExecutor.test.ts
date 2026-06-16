import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';

// --- Mocks (must be hoisted) ---
vi.mock('bullmq', () => ({
  Queue: class MockQueue {
    async add() { return { id: 'job-mock-123' }; }
    async close() { return; }
  },
  Worker: class MockWorker {
    constructor() {}
    async close() { return; }
  }
}));

vi.mock('ioredis', () => ({
  default: class MockRedis {
    async quit() {}
  }
}));

// Mock GoogleGenAI — the critical dependency for executor
vi.mock('@google/genai', () => {
  return {
    GoogleGenAI: class MockGoogleGenAI {
      models = {
        async generateContent(opts: any) {
          // Return different responses based on systemInstruction to simulate agents
          const sys = opts.config?.systemInstruction || '';
          if (sys.includes('data-querier')) {
            return { text: 'Queried sales data for last month.', candidates: [{ content: { parts: [] } }] };
          }
          if (sys.includes('reviewer')) {
            return { text: 'Review complete. All good.', candidates: [{ content: { parts: [] } }] };
          }
          return { text: 'Agent response from mock Gemini.', candidates: [{ content: { parts: [] } }] };
        }
      };
    }
  };
});

// Also mock the ResourceBroker and Guardrails lightly to avoid real vault/redis work
vi.mock('../engine/broker/resource-broker', () => ({
  ResourceBroker: {
    acquireKey: async () => ({ id: 'key-mock', provider: 'gemini', name: 'test', createdAt: Date.now() }),
    releaseKey: async () => {},
    getConsumptionReport: async () => ({ keys: {}, agents: {} })
  }
}));

vi.mock('../engine/guardrails/middleware', () => ({
  GuardrailMiddleware: {
    async executeWithGuardrails({ llmCaller }: any) {
      return llmCaller();
    }
  }
}));

import { agentExecutor } from './agentExecutor';
import { MeshSession } from './meshTypes';

// Minimal valid session for tests
const makeSession = (pipeline: string[] = ['data-querier', 'reviewer']): MeshSession => ({
  id: 'test-session-1',
  intent: {
    id: 'intent-1',
    rawQuery: 'test query about sales',
    detectedEntities: ['Sales'],
    detectedCapabilities: ['query'],
    agentPipeline: pipeline,
    status: 'planning'
  },
  messages: [],
  ontologySnapshot: { projectName: 'Test', entities: [], compiledAt: new Date().toISOString() },
  createdAt: new Date().toISOString()
});

describe('AgentExecutor (with mocks)', () => {
  const originalEnv = process.env.OPO_USE_MEMORY_BLACKBOARD;

  beforeAll(() => {
    process.env.OPO_USE_MEMORY_BLACKBOARD = 'true';
  });

  afterAll(() => {
    process.env.OPO_USE_MEMORY_BLACKBOARD = originalEnv;
  });

  it('should execute a simple pipeline and yield messages including start/done', async () => {
    const session = makeSession();
    const generator = agentExecutor.executePipeline(session, { gemini: 'mock-key' });

    const events: any[] = [];
    for await (const msg of generator) {
      events.push(msg);
    }

    expect(events.length).toBeGreaterThan(3);
    expect(events.some(e => e.content?.includes('OPO Swarm initialized'))).toBe(true);
    expect(events.some(e => e.content?.includes('Pipeline execution completed'))).toBe(true);
  });

  it('should handle HIL approval path without crashing (mocked)', async () => {
    // Patch registry for this test so the approval trigger condition is met
    const { registry } = await import('./registry');
    const originalGet = registry.getAgent.bind(registry);
    (registry as any).getAgent = (id: string) => {
      if (id === 'approval-reviewer') {
        return {
          id: 'approval-reviewer',
          name: 'Approval Reviewer',
          systemPrompt: 'APPROVAL_REQUIRED Please review carefully',
          capabilities: ['review'],
          domains: [],
          tools: []
        };
      }
      return originalGet(id);
    };

    try {
      const session = makeSession(['data-querier', 'approval-reviewer']);
      const generator = agentExecutor.executePipeline(session, { gemini: 'mock-key' });

      const events: any[] = [];
      // Only consume limited messages — the HIL promise can hang in unit test without full blackboard roundtrip
      let count = 0;
      for await (const msg of generator) {
        events.push(msg);
        count++;
        if (count > 14) break;
      }

      const hasHil = events.some(e => e.content && (e.content.includes('Human-in-the-Loop') || e.content.includes('HIL pending') || e.content.includes('approved')));
      expect(hasHil).toBe(true);
    } finally {
      // restore
      (registry as any).getAgent = originalGet;
    }
  }, 4500);

  it('should not leak raw API keys into yielded messages or snapshots (basic safety)', async () => {
    const session = makeSession(['data-querier']);
    const generator = agentExecutor.executePipeline(session, { gemini: 'sk-secret-should-not-leak-12345' });

    for await (const msg of generator) {
      const serialized = JSON.stringify(msg);
      expect(serialized).not.toContain('sk-secret-should-not-leak');
    }
  });
});
