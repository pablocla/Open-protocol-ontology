import { z } from 'zod';
import { OntologyGraph } from '@/lib/mesh/meshTypes';

/**
 * DigitalEmployee - The official ALPHA standard for a packaged, sellable OPO Swarm.
 * 
 * This is the core product format for the Marketplace.
 * It follows "Vibe Coding" principles: built visually, exposed as a clean API.
 * 
 * Structure inspired by BridgeSwarm / BridgeMind Digital Employees.
 */

export const AgentRoleSchema = z.enum(['Coordinator', 'Specialist', 'Validator']);

export const DigitalEmployeeRoleSchema = z.object({
  id: z.string(),
  role: AgentRoleSchema,
  agentId: z.string(), // references the agent definition in the registry
  systemPrompt: z.string().describe("Master prompt for this role in the swarm"),
  capabilities: z.array(z.string()),
  tools: z.array(z.string()).optional(), // tool IDs bound to this role
});

export const DigitalEmployeeSchema = z.object({
  // === Public Metadata (visible in Marketplace) ===
  id: z.string(),
  name: z.string(),
  version: z.string().default('1.0.0'),
  description: z.string(),
  tags: z.array(z.string()).default([]),
  category: z.enum(['automation', 'analysis', 'integration', 'compliance', 'custom']).default('automation'),
  creatorId: z.string(),

  // === Business / Pricing ===
  pricePerExecution: z.number().default(0.05), // in USD
  priceModel: z.enum(['per-execution', 'subscription', 'credits']).default('per-execution'),
  estimatedTokensPerExecution: z.number().optional(),

  // === Public Contract (for headless consumers) ===
  inputsSchema: z.any().describe("Zod schema or JSON Schema for inputs"),
  outputsSchema: z.any().describe("Zod schema or JSON Schema for outputs"),
  exampleInput: z.record(z.string(), z.any()),
  exampleOutput: z.record(z.string(), z.any()),

  // === Core OPO Definition (what powers the swarm) ===
  ontology: z.custom<OntologyGraph>(),
  masterGoal: z.string().describe("The high-level goal this DigitalEmployee solves"),
  roles: z.array(DigitalEmployeeRoleSchema).min(1).describe("Structured roles (Coordinator, Specialist, Validator)"),

  // === Internal / Protected (never exposed to buyers) ===
  sourceCanvasSnapshot: z.any().optional().describe("The original Studio canvas for debugging / updates"),
  internalPrompts: z.record(z.string(), z.string()).optional(), // full master prompts if needed

  // === Marketplace / SaaS Metadata ===
  isPublic: z.boolean().default(true),
  createdAt: z.string(),
  usageCount: z.number().default(0),
});

export type DigitalEmployee = z.infer<typeof DigitalEmployeeSchema>;

export const HeadlessRunRequestSchema = z.object({
  digitalEmployeeId: z.string(),
  input: z.any()
});

// Runtime validator
export const validateDigitalEmployee = (data: unknown): DigitalEmployee => {
  return DigitalEmployeeSchema.parse(data);
};

// Helper to package current Studio canvas into a DigitalEmployee
export function packageCanvasToDigitalEmployee(
  nodes: any[],
  edges: any[],
  project: { name: string },
  options: {
    name?: string;
    description?: string;
    creatorId?: string;
    pricePerExecution?: number;
  } = {}
): DigitalEmployee {
  const now = new Date().toISOString();
  const id = `de-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

  // Extract agents and turn them into roles (simplified for ALPHA)
  const agentNodes = nodes.filter((n: any) => n.type === 'agentNode');
  const roles = agentNodes.map((agent: any, index: number) => ({
    id: `role-${index}`,
    role: index === 0 ? 'Coordinator' : (index === agentNodes.length - 1 ? 'Validator' : 'Specialist') as any,
    agentId: agent.id,
    systemPrompt: agent.data.systemPrompt || `You are a ${agent.data.label} specialist.`,
    capabilities: agent.data.capabilities || [],
    tools: (agent.data.toolBindings || []).map((t: any) => t.toolId),
    // Preserve user-chosen LLM if set (so "implement them if the user desires")
    llmProvider: agent.data.llmProvider,
    llmModel: agent.data.llmModel,
  }));

  // Basic ontology extraction (in real life we would use ontologyCompiler)
  const ontology = {
    projectName: project?.name || 'Untitled',
    entities: nodes
      .filter((n: any) => n.type === 'entityNode')
      .map((e: any) => ({
        id: e.id,
        name: e.data.label,
        attributes: e.data.attributes || [],
        relations: [],
      })),
    compiledAt: now,
  };

  return {
    id,
    name: options.name || `${project?.name || 'Untitled'} Digital Employee`,
    version: '1.0.0',
    description: options.description || 'Packaged from OPO Studio Vibe Coding session.',
    tags: ['vibe-coded', 'alpha'],
    category: 'automation',
    creatorId: options.creatorId || 'demo-tenant',
    pricePerExecution: options.pricePerExecution || 0.05,
    priceModel: 'per-execution',
    estimatedTokensPerExecution: 1200,
    inputsSchema: {
      type: 'object',
      properties: {
        query: { type: 'string' },
        context: { type: 'object' },
      },
    },
    outputsSchema: {
      type: 'object',
      properties: {
        result: { type: 'string' },
        structuredData: { type: 'object' },
        auditLog: { type: 'array', items: { type: 'string' } },
      },
    },
    exampleInput: { query: "Process this request" },
    exampleOutput: { result: "Task completed successfully" },
    ontology: ontology as any,
    masterGoal: "Execute the visual workflow defined in the canvas with reliable agent roles",
    roles,
    sourceCanvasSnapshot: { project, nodes, edges },
    internalPrompts: {},
    isPublic: true,
    createdAt: now,
    usageCount: 0,
  };
}
