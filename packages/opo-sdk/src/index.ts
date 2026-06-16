import { OpoMapping, OpoField } from './translator';

export interface OpoClientOptions {
  registryUrl?: string;
}

export class OpoClient {
  private registryUrl: string;

  constructor(options?: OpoClientOptions) {
    this.registryUrl = options?.registryUrl || 'https://openontology.vercel.app';
  }

  async getMapping(provider: string, entity: string): Promise<OpoMapping> {
    const url = `${this.registryUrl}/registry/${provider}/${entity}.json`;
    
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch OPO mapping for ${provider}/${entity} (Status: ${response.status})`);
      }
      const data = await response.json() as OpoMapping;
      return data;
    } catch (error) {
      console.error(`[OpoClient] Error fetching mapping from ${url}:`, error);
      throw error;
    }
  }

  generateSystemPrompt(mapping: OpoMapping): string {
    const fieldNames = Object.keys(mapping.fields).join(', ');
    return `You are an intelligent agent connecting to ${mapping.sourceType} table "${mapping.tableName}".\n` +
           `When querying or mutating the ${mapping.entity} entity, use the following canonical fields: ${fieldNames}.\n` +
           `The OPO Sidecar will automatically translate these to the underlying columns.`;
  }
}

export * from './builder';
export * from './translator';
export * from './protheusGuards';
export * from './pagination';
export * from './mcp';
export * from './adapters/graphql';