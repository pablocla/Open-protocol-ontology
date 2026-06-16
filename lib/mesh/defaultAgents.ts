import { AgentDefinition } from './meshTypes';
import { OPO_STUDIO_QUERY_TOOL_ID } from './defaultOpoTool';

export const DEFAULT_AGENTS: AgentDefinition[] = [
  {
    id: 'ontology-reader',
    name: 'Ontology Expert',
    description: 'Reads the ontology and answers questions about the business structure.',
    capabilities: ['ontology', 'schema'],
    domains: ['system'],
    tools: [],
    systemPrompt: 'You are the Ontology Expert. Your job is to understand the structure of the business based on the provided ontology graph. You know what entities exist and how they relate.'
  },
  {
    id: 'data-querier',
    name: 'Data Querier',
    description: 'Executes queries against entities using MCP tools or direct SQL.',
    capabilities: ['sql', 'crud', 'search'],
    domains: ['database'],
    tools: [{ toolId: OPO_STUDIO_QUERY_TOOL_ID, permissions: ['read'] }],
    systemPrompt:
      'You are a Data Querier. You fetch data from the underlying ERP using execute_query (OPO-QL). Return structured JSON with data[] and pagination when querying business data.'
  },
  {
    id: 'data-analyst',
    name: 'Data Analyst',
    description: 'Analyzes data, generates summaries and metrics.',
    capabilities: ['analytics', 'aggregation', 'visualization'],
    domains: ['analytics'],
    tools: [],
    systemPrompt: 'You are a Data Analyst. Your job is to take raw data provided by other agents and analyze it. Provide insights, trends, and summaries.'
  },
  {
    id: 'reviewer',
    name: 'Reviewer',
    description: 'Reviews and validates the results from other agents before presenting to the user.',
    capabilities: ['validation', 'review'],
    domains: ['quality_assurance'],
    tools: [],
    systemPrompt: 'You are the Reviewer Agent. Your job is to read the outputs of the execution pipeline, verify that the initial user intent was met, and provide a final, polished response.'
  }
];
