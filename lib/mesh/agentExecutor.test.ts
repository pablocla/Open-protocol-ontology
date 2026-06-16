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
          const sys = (opts.config?.systemInstruction || '').toLowerCase();
          if (sys.includes('querier') || sys.includes('data-querier')) {
            const contentsStr = JSON.stringify(opts.contents || '');
            if (contentsStr.includes('trigger tool call')) {
              return { text: 'TOOL: execute_query {"queryId": "recent-sales-orders"}', candidates: [{ content: { parts: [] } }] };
            }
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

vi.mock('../engine/hil/hil-manager', () => ({
  HILManager: {
    async requestApproval(agentId: string) {
      return { approved: true, requestId: 'mock-hil-id-123' };
    }
  }
}));

import { agentExecutor } from './agentExecutor';
import { MeshSession } from './meshTypes';

// Minimal valid session for tests
const makeSession = (pipeline: string[] = ['data-querier', 'reviewer'], suffix = Math.random().toString(36).substring(7)): MeshSession => ({
  id: `test-session-${suffix}`,
  intent: {
    id: `intent-${suffix}`,
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

      const hasHil = events.some(e => e.content && (
        e.content.includes('confirmación') ||
        e.content.includes('HIL pendiente') ||
        e.content.includes('confirmada')
      ));
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

  it('should intercept execute_query for data-querier and format output with serializeOpoResponse and buildConsultaSummary', async () => {
    const { opoRuntime } = await import('./opoRuntime');
    const originalExecute = opoRuntime.executeTool;
    opoRuntime.executeTool = async () => ({
      status: 'success',
      data: {
        data: [{ ID: '000001', EMISION: '2026-06-01', CLIENTE: '000219', TOTAL: 150000 }],
        pagination: {
          hasNextPage: false,
          endCursor: null,
          limit: 50,
          offset: 0,
          returnedCount: 1
        }
      }
    });

    try {
      const session = makeSession(['data-querier']);
      session.intent.rawQuery = 'trigger tool call and fetch sales data';
      const generator = agentExecutor.executePipeline(session, { gemini: 'mock-key' });

      const events: any[] = [];
      for await (const msg of generator) {
        events.push(msg);
      }
      console.log('yielded events:', JSON.stringify(events, null, 2));

      // Check that data-querier's message content has both the summary and the serialized JSON response
      const dataQuerierMsg = events.find(e => e.agentId === 'data-querier' && e.role === 'assistant');
      expect(dataQuerierMsg).toBeDefined();
      expect(dataQuerierMsg.content).toContain('📋 Últimos pedidos de venta:');
      expect(dataQuerierMsg.content).toContain('000001');
      expect(dataQuerierMsg.content).toContain('hasNextPage');
    } finally {
      opoRuntime.executeTool = originalExecute;
    }
  });
});
