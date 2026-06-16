import { OntologyGraph, Intent, AgentDefinition } from './meshTypes';
import { registry } from './registry';
import { callLLM, LLMProvider } from './llm';
import {
  formatRecurringQueriesForLLM,
  getRecurringQueriesForContext,
} from '@/lib/studio/recurringQueries';

export class SemanticRouter {
  
  /**
   * Routes a raw user query to a pipeline of agents.
   */
  async route(rawQuery: string, ontology: OntologyGraph, apiKeys: Record<string, string>): Promise<Intent> {
    
    // Step 1 & 2: Entity Detection & Capability Inference using LLM
    const { detectedEntities, detectedCapabilities } = await this.analyzeIntentWithLLM(rawQuery, ontology, apiKeys);

    // Step 3: Agent Matching
    let agentPipeline = this.matchAgents(detectedCapabilities);

    // Fallback: If no agents matched, use default pipeline
    if (agentPipeline.length === 0) {
      agentPipeline = ['data-querier', 'data-analyst', 'reviewer'];
    }

    const intentId = `intent-${Date.now()}`;
    
    return {
      id: intentId,
      rawQuery,
      detectedEntities,
      detectedCapabilities,
      agentPipeline,
      status: 'planning'
    };
  }

  private async analyzeIntentWithLLM(query: string, ontology: OntologyGraph, apiKeys: Record<string, string>): Promise<{ detectedEntities: string[], detectedCapabilities: string[] }> {
    // GROK FIX #5: no window access (backend safe). Prefer passed apiKeys keys or default. Per-agent overrides happen in executor.
    // Client mesh execution may have synced via StudioEditor window globals, but server paths (worker, direct calls) use this.
    const provider: LLMProvider = (apiKeys && Object.keys(apiKeys).length > 0 ? (Object.keys(apiKeys)[0] as LLMProvider) : 'gemini');
    const apiKey = apiKeys[provider] || apiKeys.gemini || apiKeys.openai || '';

    if (!apiKey && provider !== 'ollama') {
      console.warn(`No API key for provider "${provider}". Using fallback routing.`);
      return { detectedEntities: [], detectedCapabilities: ['crud'] };
    }

    const recurringCatalog = formatRecurringQueriesForLLM(
      getRecurringQueriesForContext(ontology, (ontology as any).name || (ontology as any).projectName || '')
    );

    const systemPrompt = `
You are the OPO Semantic Router. Your job is to analyze the user's query and the provided business ontology.
You must extract:
1. Which entities from the ontology are required to answer the query.
2. Which capabilities are needed (e.g., "sql", "crud", "analytics", "validation", "search").

Note: rowCount in entities indicates data volume from DB profiling. High-record tables (e.g. >10k-1M rows) are typically core transactional structures - prioritize them when suggesting or using entities. Low-volume are often config/params (like SX6 in some ERPs).

When the user asks something that matches a recurring query below, prefer mapping to those entities and capabilities (sql + analytics).

${recurringCatalog ? `${recurringCatalog}\n` : ''}
Ontology:
${JSON.stringify(ontology, null, 2)}

Respond ONLY with a valid JSON object matching this schema:
{
  "detectedEntities": ["EntityName1", "EntityName2"],
  "detectedCapabilities": ["capability1", "capability2"]
}
`;

    try {
      const text = await callLLM(query, {
        provider,
        apiKey,
        systemInstruction: systemPrompt,
      });

      const result = JSON.parse(text || '{}');
      return {
        detectedEntities: result.detectedEntities || [],
        detectedCapabilities: result.detectedCapabilities || []
      };
    } catch (error) {
      console.error("LLM Intent Analysis Failed:", error);
      return { detectedEntities: [], detectedCapabilities: ['crud'] };
    }
  }

  private matchAgents(capabilities: string[]): string[] {
    // Use the Registry's dynamic capability matching
    const matchedAgents = registry.findAgentsByCapabilities(capabilities);
    
    // Build ordered pipeline: matched agents first, then reviewer at the end
    const pipeline: string[] = [];
    const reviewerAgent = matchedAgents.find(a => a.capabilities.includes('review'));
    
    // Add non-reviewer agents first
    matchedAgents
      .filter(a => !a.capabilities.includes('review'))
      .forEach(a => pipeline.push(a.id));
    
    // Add reviewer last (if exists)
    if (reviewerAgent) {
      pipeline.push(reviewerAgent.id);
    }
    
    return pipeline;
  }
}

export const semanticRouter = new SemanticRouter();
