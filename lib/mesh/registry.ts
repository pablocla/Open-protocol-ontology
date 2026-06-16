import { AgentDefinition, ToolDefinition, OntologyGraph } from './meshTypes';
import { DEFAULT_AGENTS } from './defaultAgents';
import { DEFAULT_OPO_QUERY_TOOL } from './defaultOpoTool';

/**
 * In-memory Registry for Agents and Tools.
 * In a production environment, this would be backed by a database.
 */
class MeshRegistry {
  private agents: Map<string, AgentDefinition>;
  private tools: Map<string, ToolDefinition>;

  constructor() {
    this.agents = new Map();
    this.tools = new Map();

    DEFAULT_AGENTS.forEach(agent => this.registerAgent(agent));
    this.registerTool(DEFAULT_OPO_QUERY_TOOL);
  }

  // --- AGENTS ---
  registerAgent(agent: AgentDefinition): void {
    this.agents.set(agent.id, agent);
  }

  getAgent(id: string): AgentDefinition | undefined {
    return this.agents.get(id);
  }

  getAllAgents(): AgentDefinition[] {
    return Array.from(this.agents.values());
  }

  findAgentsByCapabilities(requiredCaps: string[]): AgentDefinition[] {
    if (!requiredCaps || requiredCaps.length === 0) return [];
    
    return this.getAllAgents().filter(agent => {
      // Check if agent has at least one of the required capabilities
      return requiredCaps.some(cap => agent.capabilities.includes(cap));
    });
  }

  // --- TOOLS ---
  registerTool(tool: ToolDefinition): void {
    this.tools.set(tool.id, tool);
  }

  getTool(id: string): ToolDefinition | undefined {
    return this.tools.get(id);
  }

  getAllTools(): ToolDefinition[] {
    return Array.from(this.tools.values());
  }

  findToolsForEntity(entityName: string): ToolDefinition[] {
    return this.getAllTools().filter(tool => 
      tool.entities.includes(entityName)
    );
  }

  getToolsForAgent(agentId: string): ToolDefinition[] {
    const agent = this.getAgent(agentId);
    if (!agent) return [];
    
    return agent.tools
      .map(binding => this.getTool(binding.toolId))
      .filter((tool): tool is ToolDefinition => tool !== undefined);
  }

  // --- AUTO REGISTRATION ---
  /**
   * Automatically register tools from an MCP server based on the Ontology.
   */
  registerMCPTools(ontology: OntologyGraph, mcpEndpoint: string, serverName: string): void {
    // In a real scenario, this would connect to the MCP server, call listTools, 
    // and map them to the entities.
    // For now, we simulate the registration based on the compiled ontology.
    
    const toolDef: ToolDefinition = {
      id: `mcp-${serverName}`,
      name: `${serverName} MCP Server`,
      type: 'mcp',
      endpoint: mcpEndpoint,
      entities: ontology.entities.map(e => e.name),
      operations: []
    };

    ontology.entities.forEach(entity => {
      toolDef.operations.push({
        name: `search_${entity.name.toLowerCase()}`,
        description: `Search in ${entity.name}`,
        entityTarget: entity.name,
        inputSchema: { query: { type: 'string' } }
      });
    });

    this.registerTool(toolDef);
  }
}

// Export a singleton instance
export const registry = new MeshRegistry();
