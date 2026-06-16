import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import fs from 'fs';
import path from 'path';

// Light mocks
vi.mock('../ollamaHealth', () => ({
  checkOllamaHealth: async (baseUrl: string) => ({
    ok: baseUrl === 'http://localhost:11434',
    models: ['llama3.1'],
  }),
}));

vi.mock('../sqlExecutor', () => ({
  executeParameterizedSql: async ({ connectionString }: any) => {
    if (connectionString.includes('fail')) {
      throw new Error('Database connect error');
    }
    return { rows: [{ ping: 1 }] };
  },
}));

import { pingOllama, pingErp, runDiscovery, persistWorkspace } from './onboardingOrchestrator';
import { OnboardingConfig } from './onboardingTypes';

describe('onboardingOrchestrator', () => {
  const tmpDir = path.join(process.cwd(), 'scratch-onboard-test');

  beforeAll(() => {
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }
  });

  afterAll(() => {
    if (fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('should ping Ollama successfully', async () => {
    const res = await pingOllama('http://localhost:11434');
    expect(res.ok).toBe(true);
    expect(res.models).toContain('llama3.1');

    const resFail = await pingOllama('http://localhost:invalid');
    expect(resFail.ok).toBe(false);
  });

  it('should ping ERP successfully', async () => {
    const res = await pingErp('Server=ok-host;Database=db;', 'mssql');
    expect(res.ok).toBe(true);

    const resFail = await pingErp('Server=fail-host;Database=db;', 'mssql');
    expect(resFail.ok).toBe(false);
    expect(resFail.error).toContain('Database connect error');
  });

  it('should run discovery in demo mode and return a manifest and graph', async () => {
    const config: OnboardingConfig = {
      ai: { provider: 'ollama', ollamaBaseUrl: 'http://localhost:11434', ollamaModel: 'llama3.1' },
      erp: { erpId: 'protheus', dataMode: 'demo', filial: '01', companySuffix: '010' },
    };

    const res = await runDiscovery(config);
    expect(res.manifest).toBeDefined();
    expect(res.graph).toBeDefined();
    expect(res.graph.nodes.length).toBeGreaterThan(0);
  });

  it('should persist workspace files safely with masked passwords', async () => {
    const config: OnboardingConfig = {
      ai: { provider: 'gemini', cloudApiKey: 'test-api-key-123' },
      erp: {
        erpId: 'protheus',
        dataMode: 'live',
        filial: '01',
        companySuffix: '010',
        mssql: {
          server: '192.168.1.10',
          database: 'PROTHEUS',
          user: 'sa',
          password: 'mypassword123',
        },
      },
    };

    const manifest = { supported_entities: [], relationships: [] };
    const graph = { nodes: [], edges: [] };

    const { manifestPath, workspacePath } = await persistWorkspace(config, manifest, graph, tmpDir);

    expect(fs.existsSync(manifestPath)).toBe(true);
    expect(fs.existsSync(workspacePath)).toBe(true);

    const workspaceContent = JSON.parse(fs.readFileSync(workspacePath, 'utf-8'));
    expect(workspaceContent.erpWorkspace.connectionRef).toBeDefined();
    expect(workspaceContent.erpWorkspace.mssqlMasked).toBeDefined();
    expect(workspaceContent.erpWorkspace.mssqlMasked.password).toBeUndefined(); // password should be deleted!
    expect(workspaceContent.ai.cloudApiKeyRef).toBeDefined();
  });
});
