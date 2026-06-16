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

/**
 * Protheus/TOTVS query guards: soft-delete (D_E_L_E_T_) and filial isolation (X2_MODO).
 */
declare const PROTHEUS_SOFT_DELETE_FIELD = "D_E_L_E_T_";
declare const PROTHEUS_ACTIVE_DELETE_MARKER = " ";
type ProtheusSqlDialect = 'postgresql' | 'mssql' | 'oracle' | 'ansi';
interface OpoSystemContext {
    erp?: 'protheus' | 'sap' | 'generic';
    filial?: string;
    companySuffix?: string;
    dialect?: ProtheusSqlDialect;
}
interface ProtheusTableMeta {
    /** SX2_MODO: E/1 = exclusiva por filial, C/2 = compartida */
    x2Modo?: string;
    filialField?: string;
    companySuffix?: string;
    physicalTableName?: string;
}
interface ProtheusMappingExtension {
    protheus?: ProtheusTableMeta;
    mutationPolicy?: {
        readOnly?: boolean;
        strategy?: 'sql' | 'rest';
        restEndpoint?: string;
    };
}
/** X2_MODO values that require filial filtering in business queries. */
declare function isProtheusTableExclusive(x2Modo?: string): boolean;
declare function resolvePhysicalTableName(logicalOrPhysical: string, companySuffix?: string): string;
/** Derive filial column from first field prefix (SA1/A1_COD → A1_FILIAL). */
declare function deriveFilialFieldFromColumns(fieldColumns: string[], explicitFilialField?: string): string | undefined;
declare function buildProtheusSoftDeleteCondition(tableAlias: string): string;
declare function buildProtheusFilialCondition(tableAlias: string, filialField: string): string;
interface ProtheusGuardInjection {
    conditions: string[];
    params: unknown[];
}
/**
 * Build mandatory WHERE fragments for a Protheus business table.
 */
declare function buildProtheusTableGuards(tableAlias: string, meta: ProtheusTableMeta | undefined, context: OpoSystemContext | undefined, fieldColumns?: string[]): ProtheusGuardInjection;
declare function formatPaginationClause(dialect: ProtheusSqlDialect | undefined, fetchLimit: number, offset: number): string;
declare function formatSelectPrefix(dialect: ProtheusSqlDialect | undefined, fetchLimit: number, offset: number): string;

interface OpoField {
    column: string;
    type: string;
}
interface OpoMapping extends ProtheusMappingExtension {
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
    fields: Record<string, OpoField>;
    joins?: Record<string, {
        tableName: string;
        on: string;
        conditionSql?: string;
        protheus?: ProtheusMappingExtension['protheus'];
    }>;
    actions?: Record<string, {
        procedure: string;
        description?: string;
        params: string[];
    }>;
}
interface Dictionary {
    [entityName: string]: OpoMapping;
}
interface TranslateOpoToSqlOptions {
    context?: OpoSystemContext;
}
interface TranslateOpoToSqlResult {
    sql: string;
    params: unknown[];
    pagination: ResolvedPagination;
}
declare function translateOpoToSql(opoQuery: any, dictionary: Dictionary, options?: TranslateOpoToSqlOptions): TranslateOpoToSqlResult;
declare function translateOpoMutationToSql(opoMutation: any, dictionary: Dictionary, options?: TranslateOpoToSqlOptions): {
    sql: string;
    params: any[];
};

declare class OpoOntologyBuilder {
    private mapping;
    constructor();
    setEntity(entityName: string): this;
    setSource(sourceType: 'SQL' | 'REST' | 'GraphQL', tableNameOrEndpoint: string): this;
    setDescription(desc: string): this;
    addField(canonicalName: string, physicalColumn: string, type?: string): this;
    build(): OpoMapping;
}

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

interface OpoClientOptions {
    registryUrl?: string;
}
declare class OpoClient {
    private registryUrl;
    constructor(options?: OpoClientOptions);
    getMapping(provider: string, entity: string): Promise<OpoMapping>;
    generateSystemPrompt(mapping: OpoMapping): string;
}

export { DEFAULT_QUERY_LIMIT, type Dictionary, MAX_QUERY_LIMIT, OpoClient, type OpoClientOptions, type OpoField, OpoGraphQLAdapter, type OpoMapping, OpoMcpServer, type OpoMcpServerOptions, OpoOntologyBuilder, type OpoQueryResponse, type OpoSystemContext, PROTHEUS_ACTIVE_DELETE_MARKER, PROTHEUS_SOFT_DELETE_FIELD, type ProtheusGuardInjection, type ProtheusMappingExtension, type ProtheusSqlDialect, type ProtheusTableMeta, type ResolvedPagination, type TranslateOpoToSqlOptions, type TranslateOpoToSqlResult, buildPaginatedResponse, buildProtheusFilialCondition, buildProtheusSoftDeleteCondition, buildProtheusTableGuards, decodeCursor, deriveFilialFieldFromColumns, encodeCursor, formatPaginationClause, formatSelectPrefix, isProtheusTableExclusive, normalizeOpoQueryPayload, resolvePagination, resolvePhysicalTableName, sanitizeToolResultForLLM, translateOpoMutationToSql, translateOpoToSql, truncatePayloadForLLM, truncateRowsForLLM };
