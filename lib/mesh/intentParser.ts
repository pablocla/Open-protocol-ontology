export interface ParsedIntent {
  goal: string;
  agents: 'auto' | string[];
  memory: 'ontology' | 'none';
  execution: 'mcp' | 'n8n' | 'mixed';
  review: boolean;
  filters?: {
    entity?: string;
    timeframe?: string;
  };
  output?: string;
}

export class IntentParser {
  /**
   * Parses a YAML string into a ParsedIntent.
   * Note: For this MVP, we do a simple regex/split based parsing.
   * In a production environment, use a robust library like 'js-yaml'.
   */
  parse(yamlString: string): ParsedIntent {
    const lines = yamlString.split('\n');
    const result: Partial<ParsedIntent> = {
      agents: 'auto',
      memory: 'ontology',
      execution: 'mcp',
      review: false,
    };
    let inFilters = false;
    let filters: Record<string, string> = {};

    for (let line of lines) {
      // Remove comments
      line = line.split('#')[0].trim();
      if (!line) continue;

      if (line.startsWith('goal:')) {
        result.goal = line.replace('goal:', '').trim();
      } else if (line.startsWith('agents:')) {
        const val = line.replace('agents:', '').trim();
        if (val === 'auto') {
          result.agents = 'auto';
        } else if (val.startsWith('[')) {
          // parse array [agent1, agent2]
          const agentsStr = val.replace('[', '').replace(']', '').trim();
          result.agents = agentsStr.split(',').map(s => s.trim());
        }
      } else if (line.startsWith('memory:')) {
        result.memory = line.replace('memory:', '').trim() as any;
      } else if (line.startsWith('execution:')) {
        result.execution = line.replace('execution:', '').trim() as any;
      } else if (line.startsWith('review:')) {
        result.review = line.replace('review:', '').trim() === 'enabled' || line.replace('review:', '').trim() === 'true';
      } else if (line.startsWith('output:')) {
        result.output = line.replace('output:', '').trim();
      } else if (line.startsWith('filters:')) {
        inFilters = true;
      } else if (inFilters && line.startsWith('  ')) {
        // filter item
        const parts = line.split(':');
        if (parts.length >= 2) {
          const key = parts[0].trim();
          const val = parts.slice(1).join(':').trim();
          filters[key] = val;
        }
      } else {
        inFilters = false;
      }
    }

    if (Object.keys(filters).length > 0) {
      result.filters = filters;
    }

    if (!result.goal) {
      throw new Error("Invalid Intent: 'goal' is required.");
    }

    return result as ParsedIntent;
  }
}

export const intentParser = new IntentParser();
