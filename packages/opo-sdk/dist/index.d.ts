declare class OpoOntologyBuilder {
    private mapping;
    constructor();
    setEntity(entityName: string): this;
    setSource(sourceType: 'SQL' | 'REST' | 'GraphQL', tableNameOrEndpoint: string): this;
    setDescription(desc: string): this;
    addField(canonicalName: string, physicalColumn: string, type?: string): this;
    build(): OpoMapping;
}

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
    registryUrl?: string;
}
declare class OpoClient {
    private registryUrl;
    constructor(options?: OpoClientOptions);
    getMapping(provider: string, entity: string): Promise<OpoMapping>;
    generateSystemPrompt(mapping: OpoMapping): string;
}

export { OpoClient, type OpoClientOptions, type OpoField, type OpoMapping, OpoOntologyBuilder };
