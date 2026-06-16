import { OpoManifestFromProtheus } from './protheusTypes';

/**
 * Describe cómo un agente IA accede a los datos vía OPO después de generar el manifiesto.
 *
 * Flujo:
 * 1. Manifiesto semántico (.well-known/opo.json) — QUÉ existe y CÓMO se relaciona
 * 2. Adapter — CÓMO ejecutar (REST, SQL directo, o MCP)
 * 3. Agente — lee manifiesto + usa herramientas del adapter
 */

export type OpoAccessMode = 'REST' | 'SQL' | 'MCP';

export interface OpoSemanticAccessPlan {
  manifestPath: string;
  accessModes: OpoAccessMode[];
  rest?: {
    baseUrl: string;
    discoveryEndpoint: string;
    entityPattern: string;
    example: string;
  };
  sql?: {
    connectionHint: string;
    translator: string;
    joinNavigation: string;
    example: string;
  };
  mcp?: {
    serverCommand: string;
    tools: string[];
    example: string;
  };
}

export function buildProtheusSemanticAccessPlan(
  manifest: OpoManifestFromProtheus,
  overrides?: { baseUrl?: string; sqlConnection?: string }
): OpoSemanticAccessPlan {
  const baseUrl =
    overrides?.baseUrl ||
    manifest.adapter_configuration?.base_url ||
    'https://protheus.example.com/api/opo/v1';

  const accessModes = (
    (manifest.adapter_configuration as { access_modes?: string[] })?.access_modes || ['REST', 'SQL', 'MCP']
  ) as OpoAccessMode[];

  return {
    manifestPath: '/.well-known/opo.json',
    accessModes,
    rest: {
      baseUrl,
      discoveryEndpoint: `${baseUrl.replace(/\/api\/opo\/v1$/, '')}/.well-known/opo.json`,
      entityPattern: 'GET {baseUrl}/entities/{canonical}/{id}',
      example: `GET ${baseUrl}/entities/Customer/000219`,
    },
    sql: {
      connectionHint: overrides?.sqlConnection || 'postgresql://user:pass@host:5432/protheus_db',
      translator: 'opo-sdk translateOpoToSql — usa custom_mappings + relationships para JOINs',
      joinNavigation:
        'El agente lee relationships[] (ej: SC5.C5_CLIENTE→SA1.A1_COD) y arma JOINs sin inferir',
      example:
        "OpoQuery: { entity: 'SalesOrderHeader', filter: { customerId: { eq: '000219' } } } → SELECT SC5.* FROM SC5010 SC5 JOIN SA1010 SA1 ON SC5.C5_CLIENTE = SA1.A1_COD WHERE ...",
    },
    mcp: {
      serverCommand: 'opo mcp-start --mapping-dir registry/totvs-protheus',
      tools: ['opo_query', 'opo_describe_entity'],
      example:
        'Agente MCP (read-only): opo_query con { entity: "Customer", context: { erp: "protheus", filial: "01" }, filter: { legalName: { like: "%Sol%" } } }',
    },
  };
}

/**
 * Genera los archivos de asignación que el SDK/MCP necesita para traducir OPO→SQL.
 * Toma custom_mappings del manifiesto y produce OpoMapping por entidad.
 */
export function manifestToSdkMappings(manifest: OpoManifestFromProtheus): Record<string, unknown>[] {
  const mappings: Record<string, unknown>[] = [];
  const adapterConfig = manifest.adapter_configuration as {
    company_suffix?: string;
    readOnly?: boolean;
    mutationStrategy?: string;
  };
  const companySuffix =
    adapterConfig?.company_suffix ?? manifest.dictionary_meta?.company_suffix ?? '010';

  const physicalByLogical = new Map<string, string>();
  for (const ent of manifest.supported_entities || []) {
    const physical = ent.native_reference.split(' ')[0];
    const logical = physical.replace(new RegExp(`${companySuffix}$`, 'i'), '');
    physicalByLogical.set(logical.toUpperCase(), physical);
  }

  for (const entity of manifest.supported_entities || []) {
    const canonical = entity.canonical.replace(/^opo:/, '');
    const mapping = manifest.custom_mappings[canonical];
    if (!mapping) continue;

    const protheusMeta = (mapping.protheus_meta || {}) as Record<string, unknown>;
    const mutationPolicy = (mapping.mutation_policy || {
      readOnly: adapterConfig?.readOnly ?? true,
      strategy: adapterConfig?.mutationStrategy ?? 'rest',
    }) as Record<string, unknown>;

    const fieldsKey = Object.keys(mapping).find((k) => k.endsWith('_fields'));
    const semanticKey = '_semantic';
    const nativeFields = (fieldsKey ? mapping[fieldsKey] : {}) as Record<string, string>;
    const semanticFields = (mapping[semanticKey] || nativeFields) as Record<string, string>;

    const sdkFields: Record<string, { column: string; type: string }> = {};
    for (const [opoField, column] of Object.entries(semanticFields)) {
      if (opoField.startsWith('_')) continue;
      sdkFields[opoField] = {
        column,
        type: column.includes('VAL') || column.includes('SALD') || column.includes('TOTAL') ? 'number' : 'string',
      };
    }

    const sourcePhysical = entity.native_reference.split(' ')[0];
    const joins: Record<string, { tableName: string; on: string; conditionSql?: string; protheus?: Record<string, unknown> }> = {};
    for (const rel of manifest.relationships || []) {
      if (rel.sourceCanonical !== entity.canonical) continue;
      const targetName = rel.targetCanonical.replace(/^opo:/, '');
      const targetPhysical =
        physicalByLogical.get(rel.targetTable.toUpperCase()) ??
        `${rel.targetTable}${companySuffix}`;
      const targetMapping = manifest.custom_mappings[targetName];
      const targetMeta = (targetMapping?.protheus_meta || {}) as Record<string, unknown>;

      joins[targetName] = {
        tableName: targetPhysical,
        on: `${sourcePhysical}.${rel.sourceField} = ${targetPhysical}.${rel.targetField}`,
        ...(rel.conditionSql ? { conditionSql: rel.conditionSql } : {}),
        protheus: {
          x2Modo: targetMeta.x2Modo,
          filialField: targetMeta.filialField,
          companySuffix,
          physicalTableName: targetPhysical,
        },
      };
    }

    mappings.push({
      $schema: 'https://openontology.vercel.app/schema/v1/mapping-schema.json',
      entity: canonical,
      sourceType: 'SQL',
      tableName: sourcePhysical,
      description: entity.limitations,
      fields: sdkFields,
      protheus: {
        x2Modo: protheusMeta.x2Modo,
        filialField: protheusMeta.filialField,
        companySuffix,
        physicalTableName: protheusMeta.physicalTableName ?? sourcePhysical,
      },
      mutationPolicy,
      ...(Object.keys(joins).length > 0 ? { joins } : {}),
    });
  }

  return mappings;
}