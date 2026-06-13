interface OpoField {
    column: string;
    type: string;
}
interface OpoMapping {
    $schema: string;
    entity: string;
    sourceType: string;
    tableName: string;
    description?: string;
    fields: Record<string, OpoField>;
}
interface OpoClientOptions {
    /**
     * The base URL of the OPO registry.
     * Defaults to https://openontology.vercel.app
     */
    registryUrl?: string;
}
declare class OpoClient {
    private registryUrl;
    constructor(options?: OpoClientOptions);
    /**
     * Fetches the canonical mapping for a specific ERP provider and entity.
     * @param provider e.g. "sap-s4hana", "odoo-17", "totvs-protheus"
     * @param entity e.g. "Invoice", "Customer", "Order"
     * @returns The parsed OPO JSON Mapping
     */
    getMapping(provider: string, entity: string): Promise<OpoMapping>;
    /**
     * Generates a simple prompt context instructing an AI how to output an OpoQuery
     * for the retrieved mapping.
     */
    generateSystemPrompt(mapping: OpoMapping): string;
}

export { OpoClient, type OpoClientOptions, type OpoField, type OpoMapping };
