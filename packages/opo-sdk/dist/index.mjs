// src/index.ts
var OpoClient = class {
  registryUrl;
  constructor(options) {
    this.registryUrl = options?.registryUrl || "https://openontology.vercel.app";
  }
  /**
   * Fetches the canonical mapping for a specific ERP provider and entity.
   * @param provider e.g. "sap-s4hana", "odoo-17", "totvs-protheus"
   * @param entity e.g. "Invoice", "Customer", "Order"
   * @returns The parsed OPO JSON Mapping
   */
  async getMapping(provider, entity) {
    const url = `${this.registryUrl}/registry/${provider}/${entity}.json`;
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch OPO mapping for ${provider}/${entity} (Status: ${response.status})`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`[OpoClient] Error fetching mapping from ${url}:`, error);
      throw error;
    }
  }
  /**
   * Generates a simple prompt context instructing an AI how to output an OpoQuery 
   * for the retrieved mapping.
   */
  generateSystemPrompt(mapping) {
    const fieldNames = Object.keys(mapping.fields).join(", ");
    return `You are an intelligent agent connecting to ${mapping.sourceType} table "${mapping.tableName}".
When querying or mutating the ${mapping.entity} entity, use the following canonical fields: ${fieldNames}.
The OPO Sidecar will automatically translate these to the underlying columns.`;
  }
};
export {
  OpoClient
};
