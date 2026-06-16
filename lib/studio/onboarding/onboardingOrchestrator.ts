import fs from 'fs';
import path from 'path';
import { checkOllamaHealth } from '../ollamaHealth';
import { executeParameterizedSql } from '../sqlExecutor';
import { detectDriverFromUrl } from '@/lib/mesh/adapters/totvs/protheusDbClient';
import { buildMssqlConnectionString } from './connectionBuilder';
import { CredentialVault } from '@/lib/engine/vault/credential-vault';
import { OnboardingConfig, OnboardingResult } from './onboardingTypes';

export async function pingOllama(baseUrl: string) {
  return checkOllamaHealth(baseUrl);
}

export async function pingErp(connectionString: string, dialect: string, filial?: string) {
  const pingQueries: Record<string, string> = {
    mssql: 'SELECT 1 AS ping',
    postgresql: 'SELECT 1 AS ping',
    oracle: 'SELECT 1 AS ping FROM DUAL',
  };

  const sql = pingQueries[dialect] || pingQueries.mssql;
  try {
    const started = Date.now();
    await executeParameterizedSql({ connectionString, sql, driver: dialect as any });
    return { ok: true, latencyMs: Date.now() - started };
  } catch (err: any) {
    return { ok: false, error: err.message };
  }
}

export async function runDiscovery(config: OnboardingConfig): Promise<{ manifest: any; graph: any }> {
  const {
    getProtheusBaselineManifest,
    discoverProtheusOntologyIncremental,
    manifestToCanvasGraph,
  } = await import('@/lib/mesh/adapters/totvs');

  if (config.erp.erpId === 'protheus') {
    if (config.erp.dataMode === 'demo') {
      const manifest = getProtheusBaselineManifest();
      const graph = manifestToCanvasGraph(manifest);
      return { manifest, graph };
    } else {
      const connectionString = config.erp.connectionString || buildMssqlConnectionString(config.erp.mssql!);
      const result = await discoverProtheusOntologyIncremental(
        {
          mode: 'database',
          connectionString,
          companySuffix: config.erp.companySuffix,
        },
        { baseUrl: '', organizationName: 'OPO Org' }
      );
      const graph = manifestToCanvasGraph(result.mergedManifest, result.delta);
      return { manifest: result.mergedManifest, graph };
    }
  }

  // Non-protheus fallbacks (SAP, Odoo stubs)
  const emptyManifest = {
    opo_version: '0.1.0',
    system_identity: {
      erp_name: config.erp.erpId.toUpperCase(),
      version: '1.0',
      organization_name: 'Stub Org'
    },
    adapter_configuration: { base_url: '', protocol_interface: 'SQL' },
    supported_entities: [],
    custom_mappings: {},
    relationships: [],
    discoveredAt: new Date().toISOString()
  };
  return { manifest: emptyManifest, graph: { nodes: [], edges: [] } };
}

export async function persistWorkspace(
  config: OnboardingConfig,
  manifest: any,
  graph: any,
  overrideWorkspaceDir?: string
): Promise<{ manifestPath: string; workspacePath: string; connectionRef?: string }> {
  const workspaceDir = overrideWorkspaceDir || process.env.OPO_WORKSPACE_DIR || process.cwd();
  
  const manifestDir = path.join(workspaceDir, '.well-known');
  const manifestPath = path.join(manifestDir, 'opo.json');
  const opoDir = path.join(workspaceDir, '.opo');
  const workspacePath = path.join(opoDir, 'workspace.json');

  if (!fs.existsSync(manifestDir)) {
    fs.mkdirSync(manifestDir, { recursive: true });
  }
  if (!fs.existsSync(opoDir)) {
    fs.mkdirSync(opoDir, { recursive: true });
  }

  // Store password/API keys securely
  let connectionRef = '';
  if (config.erp.dataMode === 'live' && config.erp.mssql?.password) {
    try {
      const vault = new CredentialVault();
      const keyId = vault.storeKey('erp-mssql' as any, 'default', config.erp.mssql.password);
      vault.close();
      connectionRef = `vault:${keyId}`;
    } catch (e) {
      console.warn('[OnboardingOrchestrator] Failed to write password to CredentialVault:', e);
    }

    try {
      const secretPath = path.join(opoDir, '.db_secret');
      fs.writeFileSync(secretPath, config.erp.mssql.password, { mode: 0o600 });
      if (!connectionRef) {
        connectionRef = 'file:.opo/.db_secret';
      }
    } catch (e) {
      console.error('[OnboardingOrchestrator] Failed to save fallback secret file:', e);
    }
  }

  let cloudApiKeyRef = '';
  if (config.ai.cloudApiKey) {
    try {
      const vault = new CredentialVault();
      const keyId = vault.storeKey(config.ai.provider as any, 'default', config.ai.cloudApiKey);
      vault.close();
      cloudApiKeyRef = `vault:${keyId}`;
    } catch (e) {
      console.warn('[OnboardingOrchestrator] Failed to write API key to CredentialVault:', e);
    }
  }

  // Write manifest
  // Embed nodes and edges inside manifest _studio_canvas for visual builder compatibility
  const manifestToSave = {
    ...manifest,
    _studio_canvas: {
      project: { name: config.erp.dataMode === 'live' ? `Protheus — ${config.erp.mssql?.database || 'Empresa'}` : 'Protheus ERP Demo' },
      nodes: graph.nodes || [],
      edges: graph.edges || []
    }
  };
  fs.writeFileSync(manifestPath, JSON.stringify(manifestToSave, null, 2), 'utf8');

  // Write workspace.json
  const maskedMssql = config.erp.mssql ? { ...config.erp.mssql } : undefined;
  if (maskedMssql) {
    delete maskedMssql.password;
  }

  const workspaceData = {
    version: '1',
    project: { name: config.erp.dataMode === 'live' ? `Protheus — ${config.erp.mssql?.database || 'Empresa'}` : 'Protheus ERP Demo' },
    erpWorkspace: {
      erpId: config.erp.erpId,
      dataMode: config.erp.dataMode,
      filial: config.erp.filial,
      companySuffix: config.erp.companySuffix,
      dialect: config.erp.erpId === 'protheus' ? 'mssql' : 'postgresql',
      connectionRef: connectionRef || undefined,
      connectionStringMasked: config.erp.connectionString ? maskConnectionString(config.erp.connectionString) : undefined,
      mssqlMasked: maskedMssql
    },
    ai: {
      currentProvider: config.ai.provider,
      ollamaBaseUrl: config.ai.ollamaBaseUrl,
      ollamaModel: config.ai.ollamaModel,
      cloudApiKeyRef: cloudApiKeyRef || undefined
    },
    nodes: graph.nodes || [],
    edges: graph.edges || [],
    onboardedAt: new Date().toISOString()
  };

  fs.writeFileSync(workspacePath, JSON.stringify(workspaceData, null, 2), 'utf8');

  return { manifestPath, workspacePath, connectionRef: connectionRef || undefined };
}

export function buildStudioStorePatch(result: OnboardingResult) {
  return {
    project: { name: result.projectName },
    nodes: result.nodes,
    edges: result.edges,
    erpWorkspace: result.erpWorkspace,
    currentProvider: result.currentProvider as any,
    llmConfigs: result.llmConfigs
  };
}

function maskConnectionString(url: string): string {
  if (!url) return '';
  let masked = url.replace(/(password|pwd)\s*=\s*[^;]+/gi, '$1=******');
  masked = masked.replace(/(\/\/([^:]+):)([^@]+)(@)/g, '$1******$4');
  return masked;
}
