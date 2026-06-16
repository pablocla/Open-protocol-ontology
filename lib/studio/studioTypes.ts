export type FieldType = 'String' | 'Int' | 'Float' | 'Boolean' | 'DateTime';

export interface EntityAttribute {
  id: string;
  name: string;
  type: FieldType;
  isPrimaryKey: boolean;
  isRequired: boolean;
  isUnique: boolean;
  defaultValue?: string;
  length?: number;      // e.g. VARCHAR(255) → 255, for "espacios para cada dato"
  precision?: number;   // for DECIMAL/NUMERIC
  scale?: number;       // for DECIMAL/NUMERIC
  comment?: string;     // from DB or SX3-like metadata
}

export interface EntityNodeData {
  label: string;
  description?: string;
  type?: string;
  attributes: EntityAttribute[];
  rowCount?: number; // estimated records from profiling (high volume = important for core structures)
  lastProfiled?: string;
  [key: string]: unknown;
}

export type RelationCardinality = 'ONE_TO_ONE' | 'ONE_TO_MANY' | 'MANY_TO_MANY';

export interface RelationEdgeData {
  label?: string;
  cardinality: RelationCardinality;
  sourceFieldName: string;
  targetFieldName: string;
  [key: string]: unknown;
}

export interface AgentNodeData {
  label: string;
  description?: string;
  capabilities: string[];
  domains: string[];
  systemPrompt: string;
  toolBindings: string[];  // IDs de ToolNodes conectados
  llmProvider?: 'ollama' | 'grok' | 'gemini' | 'openai' | 'anthropic' | 'open-code' | 'openrouter'; // optional per-agent LLM if user wants to mix (e.g. local for code, cloud for reasoning)
  llmModel?: string;
  [key: string]: unknown;
}

export interface ToolNodeData {
  label: string;
  type: 'mcp' | 'n8n_webhook' | 'rest_api' | 'sql_direct';
  endpoint: string;
  entityBindings: string[]; // IDs de EntityNodes conectados
  [key: string]: unknown;
}
