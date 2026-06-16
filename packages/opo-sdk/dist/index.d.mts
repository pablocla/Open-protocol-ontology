declare class OpoOntologyBuilder {
    private mapping;
    constructor();
    setEntity(entityName: string): this;
    setSource(sourceType: 'SQL' | 'REST' | 'GraphQL', tableNameOrEndpoint: string): this;
    setDescription(desc: string): this;
    addField(canonicalName: string, physicalColumn: string, type?: string): this;
    build(): OpoMapping;
}

/** Defaults aligned with public/schemas/OpoQuery.json */
declare const DEFAULT_QUERY_LIMIT = 50;
declare const MAX_QUERY_LIMIT = 100;
interface ResolvedPagination {
    limit: number;
    offset: number;
    /** limit + 1 — used to detect hasNextPage without a second query */
    fetchLimit: number;
    appliedDefault: boolean;
}
interface OpoQueryResponse<T = Record<string, unknown>> {
    data: T[];
    pagination: {
        hasNextPage: boolean;
        endCursor: string | null;
        limit: number;
        offset: number;
        returnedCount: number;
        truncated?: boolean;
        totalFetched?: number;
    };
    meta?: {
        message?: string;
    };
}
/** Unwrap `{ query: { entity, ... } }` envelopes from OpoQuery.json */
declare function normalizeOpoQueryPayload(payload: unknown): Record<string, unknown>;
declare function encodeCursor(offset: number): string;
declare function decodeCursor(cursor?: string | null): number;
declare function resolvePagination(opoQuery: Record<string, unknown>): ResolvedPagination;
declare function buildPaginatedResponse<T>(rows: T[], resolved: ResolvedPagination): OpoQueryResponse<T>;
/** Safety net when raw row arrays reach an LLM context */
declare function truncateRowsForLLM(rows: unknown[], maxRows?: number): {
    data: unknown[];
    truncated: boolean;
    totalFetched: number;
};
declare function truncatePayloadForLLM(payload: unknown, maxChars?: number): string;
/** Normalize MCP/runtime tool payloads before injecting into agent prompts */
declare function sanitizeToolResultForLLM(result: unknown): unknown;

interface OpoField$1 {
    column: string;
    type: string;
}
interface OpoMapping$1 {
    $schema?: string;
    entity: string;
    sourceType: string;
    tableName: string;
    description?: string;
    security?: {
        rowLevelPolicy?: {
            field: string;
            contextKey: string;
        };
    };
    fields: Record<string, OpoField$1>;
    joins?: Record<string, {
        tableName: string;
        on: string;
    }>;
    actions?: Record<string, {
        procedure: string;
        description?: string;
        params: string[];
    }>;
}
interface Dictionary {
    [entityName: string]: OpoMapping$1;
}
interface TranslateOpoToSqlResult {
    sql: string;
    params: unknown[];
    pagination: ResolvedPagination;
}
declare function translateOpoToSql(opoQuery: any, dictionary: Dictionary): TranslateOpoToSqlResult;
declare function translateOpoMutationToSql(opoMutation: any, dictionary: Dictionary): {
    sql: string;
    params: any[];
};

interface OpoMcpServerOptions {
    mappingDir?: string;
    executeCallback?: (sql: string, params: any[]) => Promise<any[]>;
}
declare class OpoMcpServer {
    private dictionary;
    private executeCallback?;
    private initialized;
    constructor(options?: OpoMcpServerOptions);
    private loadMappingsFromDir;
    registerMapping(entity: string, mapping: any): void;
    start(): void;
    private handleMessage;
    private handleInitialize;
    private handleToolsList;
    private handleToolsCall;
    private handleResourcesList;
    private handleResourcesRead;
    private send;
    private sendError;
}

declare class OpoGraphQLAdapter {
    /**
     * Converts an OpoMapping (JSON) into a GraphQL Type Definition string.
     */
    static generateTypeDefs(mapping: OpoMapping): string;
    private static mapToGraphQLType;
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
    security?: {
        rowLevelPolicy?: {
            field: string;
            contextKey: string;
        };
    };
    fields: Record<string, OpoField>;
    actions?: Record<string, {
        procedure: string;
        description?: string;
        params: string[];
    }>;
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

export { DEFAULT_QUERY_LIMIT, type Dictionary, MAX_QUERY_LIMIT, OpoClient, type OpoClientOptions, type OpoField, OpoGraphQLAdapter, type OpoMapping, OpoMcpServer, type OpoMcpServerOptions, OpoOntologyBuilder, type OpoQueryResponse, type ResolvedPagination, type TranslateOpoToSqlResult, buildPaginatedResponse, decodeCursor, encodeCursor, normalizeOpoQueryPayload, resolvePagination, sanitizeToolResultForLLM, translateOpoMutationToSql, translateOpoToSql, truncatePayloadForLLM, truncateRowsForLLM };
