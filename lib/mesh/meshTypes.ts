import { FieldType, RelationCardinality } from '../studio/studioTypes';

// === ONTOLOGY GRAPH (compilado del canvas) ===
export interface OntologyEntity {
  id: string;                    // ID del nodo en ReactFlow
  name: string;                  // label del EntityNode
  description?: string;
  attributes: OntologyAttribute[];
  relations: OntologyRelation[]; // edges compiladas
  rowCount?: number;             // from DB profiling - high volume tables are core structures AI should prioritize for modeling
}

export interface OntologyAttribute {
  id: string;
  name: string;
  type: FieldType;
  isPrimaryKey: boolean;
  isRequired: boolean;
  isUnique: boolean;
  semanticTags?: string[];       // Ej: ["identifier", "customer_name"]
}

export interface OntologyRelation {
  id: string;
  targetEntityId: string;        // node ID of the target
  targetEntityName: string;      // label of the target
  cardinality: RelationCardinality;
  sourceFieldName: string;
  targetFieldName: string;
}

export interface OntologyGraph {
  projectName: string;
  entities: OntologyEntity[];
  compiledAt: string;
}

// === AGENT REGISTRY ===
export interface AgentDefinition {
  id: string;                    // Ej: "sql-architect"
  name: string;                  // Ej: "SQL Architect"
  description: string;
  capabilities: string[];        // Ej: ["sql", "postgres", "analytics"]
  domains: string[];             // Ej: ["database", "reporting"]
  tools: ToolBinding[];          // Herramientas que puede usar
  systemPrompt: string;          // Prompt de sistema del agente
}

export interface ToolBinding {
  toolId: string;                // Referencia al Tool Registry
  permissions: ('read' | 'write' | 'delete')[];
}

// === TOOL REGISTRY ===
export type ToolType = 'mcp' | 'n8n_webhook' | 'rest_api' | 'sql_direct' | 'opo_internal';

export interface ToolDefinition {
  id: string;                    // Ej: "mcp-protheus"
  name: string;
  type: ToolType;
  endpoint: string;              // URL o path al MCP server
  entities: string[];            // Entidades de la ontología que cubre
  operations: ToolOperation[];
}

export interface ToolOperation {
  name: string;                  // Ej: "search_cliente"
  description: string;
  entityTarget: string;          // Qué entidad de la ontología resuelve
  inputSchema: Record<string, unknown>;
}

// === SEMANTIC ROUTING ===
export type IntentStatus = 'planning' | 'executing' | 'completed' | 'failed';

export interface Intent {
  id: string;
  rawQuery: string;              // Lo que el usuario escribió
  detectedEntities: string[];    // Entidades de la ontología mencionadas
  detectedCapabilities: string[];// Capabilities necesarias
  agentPipeline: string[];       // IDs de agentes en orden
  status: IntentStatus;
}

export type AgentRole = 'system' | 'user' | 'assistant' | 'tool_result';

export interface AgentMessage {
  id: string;
  agentId?: string;
  role: AgentRole;
  content: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface MeshSession {
  id: string;
  intent: Intent;
  messages: AgentMessage[];
  ontologySnapshot: OntologyGraph;
  createdAt: string;
}

// GROK OPTIMIZATION: Shared event shapes for SSE (used by /api/mesh/query) and console parsing.
// This homogenizes the ad-hoc {type, ...} objects that were scattered before.
export type MeshSSEEvent =
  | { type: 'session'; sessionId: string }
  | { type: 'status'; message: string }
  | { type: 'intent'; intent: Intent }
  | { type: 'message'; message: AgentMessage & { hilRequestId?: string } }
  | { type: 'done' }
  | { type: 'error'; error: string };

export type HILPubSubMessage = { status: 'approved' | 'rejected' };
