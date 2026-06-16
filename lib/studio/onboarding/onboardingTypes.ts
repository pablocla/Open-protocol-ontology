import { MssqlConnectionFields } from './connectionBuilder';

export type OnboardingStep = 'ai' | 'erp' | 'discover' | 'ready';

export interface OnboardingConfig {
  ai: {
    provider: 'ollama' | 'gemini' | 'openai';
    ollamaBaseUrl?: string;
    ollamaModel?: string;
    cloudApiKey?: string;
  };
  erp: {
    erpId: 'protheus' | 'sap' | 'odoo' | 'otro';
    dataMode: 'demo' | 'live';
    mssql?: MssqlConnectionFields;
    connectionString?: string;
    filial: string;
    companySuffix: string;
  };
}

export interface OnboardingResult {
  success: boolean;
  projectName: string;
  stats: { entities: number; relationships: number };
  manifestPath: string;
  workspacePath: string;
  consultasUrl: string;
  nodes: any[];
  edges: any[];
  erpWorkspace: any;
  currentProvider: string;
  llmConfigs: any;
  errors?: string[];
}
