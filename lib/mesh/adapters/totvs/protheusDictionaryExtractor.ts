import { FieldType, RelationCardinality } from '../../../studio/studioTypes';
import { deriveFilialFieldFromColumns } from 'opo-sdk';
import { createProtheusDbClient } from './protheusDbClient';
import { MOCK_SX2_TABLES, MOCK_SX3_FIELDS, MOCK_SX9_RELATIONSHIPS } from './protheusMockData';
import {
  BuildProtheusManifestOptions,
  EntityRelationship,
  OpoManifestFromProtheus,
  ProtheusDictionaryQueryOptions,
  ProtheusDictionarySnapshot,
  ProtheusDiscoveredEntity,
  ProtheusEntityAttribute,
  ProtheusSx2Row,
  ProtheusSx3Row,
  ProtheusSx9Row,
} from './protheusTypes';

// Diccionario ERP: abreviaturas Protheus → nombres canónicos OPO
const PROTHEUS_CANONICAL_MAP: Record<string, string> = {
  sa1: 'Customer',
  sa2: 'Supplier',
  sb1: 'Product',
  sf1: 'PurchaseInvoiceHeader',
  sf2: 'SalesInvoiceHeader',
  sc5: 'SalesOrderHeader',
  sc6: 'SalesOrderItem',
  sc7: 'PurchaseOrderHeader',
  sc9: 'SalesOrderReleases',
};

const PROTHEUS_TYPE_MAP: Record<string, FieldType> = {
  C: 'String',
  N: 'Float',
  D: 'DateTime',
  L: 'Boolean',
  M: 'String',
  V: 'String',
};

function normalizeTableName(name: string): string {
  return name.trim().toUpperCase();
}

export function suggestProtheusCanonicalName(tableName: string): string {
  const key = tableName.trim().toLowerCase();
  if (PROTHEUS_CANONICAL_MAP[key]) return PROTHEUS_CANONICAL_MAP[key];
  return tableName
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join('');
}

function mapProtheusFieldType(sx3Type: string): FieldType {
  return PROTHEUS_TYPE_MAP[sx3Type.trim().toUpperCase()] ?? 'String';
}

function matchesTableFilter(tableName: string, filter?: string): boolean {
  if (!filter?.trim()) return true;
  const patterns = filter.split(',').map((p) => p.trim().toLowerCase().replace(/\*/g, '.*'));
  const regexes = patterns.map((p) => new RegExp(`^${p}$`, 'i'));
  return regexes.some((re) => re.test(tableName.toLowerCase()));
}

function isRelationshipEnabled(row: ProtheusSx9Row): boolean {
  return (row.X9_ENABLE ?? 'S').toUpperCase() !== 'N';
}

/**
 * Simula (o en el futuro ejecuta) la consulta a SX2, SX3 y SX9 del diccionario Protheus.
 */
export async function queryProtheusDictionary(
  options: ProtheusDictionaryQueryOptions = {}
): Promise<ProtheusDictionarySnapshot> {
  const mode = options.mode ?? 'mock';

  if (mode === 'mock') {
    return buildSnapshotFromRows(
      MOCK_SX2_TABLES,
      MOCK_SX3_FIELDS,
      MOCK_SX9_RELATIONSHIPS,
      'mock',
      options.tableFilter
    );
  }

  if (!options.connectionString) {
    throw new Error('connectionString es requerido cuando mode=database');
  }

  const suffix = options.companySuffix ?? '010';
  const sx2Table = `SX2${suffix}`;
  const sx3Table = `SX3${suffix}`;
  const sx9Table = `SX9${suffix}`;

  const client = await createProtheusDbClient(options.connectionString);

  try {
    const deletedFilter = "D_E_L_E_T_ <> '*'";

    const sx2Res = await client.query(`
      SELECT X2_CHAVE, X2_ARQUIVO, X2_NOME, X2_NOMETAB, X2_MODO
      FROM ${sx2Table}
      WHERE ${deletedFilter}
      ORDER BY X2_CHAVE
    `);

    const sx3Res = await client.query(`
      SELECT X3_ARQUIVO, X3_CAMPO, X3_TIPO, X3_TITULO, X3_TAMANHO, X3_DECIMAL,
             X3_OBRIGAT, X3_CONTEXT, X3_ORDEM, X3_F3, X3_RELACAO
      FROM ${sx3Table}
      WHERE ${deletedFilter}
      ORDER BY X3_ARQUIVO, X3_ORDEM
    `);

    const sx9Res = await client.query(`
      SELECT X9_DOM, X9_CDOM, X9_LIGDOM, X9_LIGCDOM, X9_IDENT,
             X9_EXPDOM, X9_EXPCDOM, X9_CONDSQL, X9_ENABLE, X9_PROPRI
      FROM ${sx9Table}
      WHERE ${deletedFilter}
      ORDER BY X9_DOM, X9_IDENT
    `);

    return buildSnapshotFromRows(
      sx2Res.rows as unknown as ProtheusSx2Row[],
      sx3Res.rows as unknown as ProtheusSx3Row[],
      sx9Res.rows as unknown as ProtheusSx9Row[],
      'database',
      options.tableFilter
    );
  } finally {
    await client.close();
  }
}

function buildSnapshotFromRows(
  tables: ProtheusSx2Row[],
  fields: ProtheusSx3Row[],
  relationships: ProtheusSx9Row[],
  source: 'mock' | 'database',
  tableFilter?: string
): ProtheusDictionarySnapshot {
  const filteredTables = tables.filter((t) =>
    matchesTableFilter(normalizeTableName(t.X2_CHAVE), tableFilter)
  );
  const tableSet = new Set(filteredTables.map((t) => normalizeTableName(t.X2_CHAVE)));

  const filteredFields = fields.filter((f) =>
    tableSet.has(normalizeTableName(f.X3_ARQUIVO))
  );

  const filteredRelationships = relationships.filter(
    (r) =>
      isRelationshipEnabled(r) &&
      tableSet.has(normalizeTableName(r.X9_DOM)) &&
      tableSet.has(normalizeTableName(r.X9_LIGDOM))
  );

  return {
    tables: filteredTables,
    fields: filteredFields,
    relationships: filteredRelationships,
    extractedAt: new Date().toISOString(),
    source,
  };
}

/**
 * Parsea filas SX9 y produce relaciones tipadas EntityRelationship.
 * Esta es la fuente de verdad del DER — sin inferencia IA.
 */
export function extractRelationshipsFromSx9(
  sx9Rows: ProtheusSx9Row[],
  sx2Rows: ProtheusSx2Row[] = []
): EntityRelationship[] {
  const tableDescriptions = new Map(
    sx2Rows.map((t) => [normalizeTableName(t.X2_CHAVE), t.X2_NOME || t.X2_NOMETAB || t.X2_CHAVE])
  );

  return sx9Rows
    .filter(isRelationshipEnabled)
    .map((row) => {
      const sourceTable = normalizeTableName(row.X9_DOM);
      const targetTable = normalizeTableName(row.X9_LIGDOM);
      const sourceField = row.X9_CDOM.trim();
      const targetField = row.X9_LIGCDOM.trim();

      return {
        id: `rel-sx9-${sourceTable}-${sourceField}-${targetTable}-${targetField}`,
        sourceTable,
        targetTable,
        sourceCanonical: `opo:${suggestProtheusCanonicalName(sourceTable)}`,
        targetCanonical: `opo:${suggestProtheusCanonicalName(targetTable)}`,
        sourceField,
        targetField,
        cardinality: 'ONE_TO_MANY' as RelationCardinality,
        conditionSql: row.X9_CONDSQL?.trim() || undefined,
        source: 'sx9' as const,
        confidence: 1.0,
        metadata: {
          sx9Ident: row.X9_IDENT,
          sx9ExpandedSource: row.X9_EXPDOM,
          sx9ExpandedTarget: row.X9_EXPCDOM,
          description: `${sourceTable}.${sourceField} → ${targetTable}.${targetField} (${tableDescriptions.get(targetTable) ?? targetTable})`,
        },
      };
    });
}

function filialFieldForTable(tableName: string, fields: ProtheusSx3Row[]): string | undefined {
  const tableFields = fields.filter(
    (f) => normalizeTableName(f.X3_ARQUIVO) === normalizeTableName(tableName)
  );
  return deriveFilialFieldFromColumns(tableFields.map((f) => f.X3_CAMPO));
}

function buildAttributesForTable(
  tableName: string,
  fields: ProtheusSx3Row[]
): ProtheusEntityAttribute[] {
  const tableFields = fields
    .filter((f) => normalizeTableName(f.X3_ARQUIVO) === normalizeTableName(tableName))
    .sort((a, b) => (a.X3_ORDEM ?? '').localeCompare(b.X3_ORDEM ?? ''));

  return tableFields.map((field, idx) => {
    const isPk = idx === 0 || field.X3_ORDEM === '01';
    const isRequired = field.X3_OBRIGAT?.toUpperCase() === 'S' || isPk;

    return {
      id: `attr-${tableName}-${field.X3_CAMPO}`,
      name: field.X3_CAMPO,
      type: mapProtheusFieldType(field.X3_TIPO),
      isPrimaryKey: isPk,
      isRequired,
      isUnique: isPk,
      length: field.X3_TAMANHO,
      scale: field.X3_DECIMAL,
      comment: field.X3_TITULO,
    };
  });
}

/**
 * Combina SX2 + SX3 + relaciones SX9 en entidades descubiertas con grafo navegable.
 */
export function buildDiscoveredEntities(
  snapshot: ProtheusDictionarySnapshot
): ProtheusDiscoveredEntity[] {
  const allRelationships = extractRelationshipsFromSx9(snapshot.relationships, snapshot.tables);

  const outgoingByTable = new Map<string, EntityRelationship[]>();
  const incomingByTable = new Map<string, EntityRelationship[]>();

  for (const rel of allRelationships) {
    const out = outgoingByTable.get(rel.sourceTable) ?? [];
    out.push(rel);
    outgoingByTable.set(rel.sourceTable, out);

    const inc = incomingByTable.get(rel.targetTable) ?? [];
    inc.push(rel);
    incomingByTable.set(rel.targetTable, inc);
  }

  return snapshot.tables.map((table) => {
    const tableName = normalizeTableName(table.X2_CHAVE);
    const canonical = suggestProtheusCanonicalName(tableName);

    return {
      tableName,
      alias: table.X2_ARQUIVO,
      description: table.X2_NOME || table.X2_NOMETAB || tableName,
      canonical: `opo:${canonical}`,
      attributes: buildAttributesForTable(tableName, snapshot.fields),
      outgoingRelations: outgoingByTable.get(tableName) ?? [],
      incomingRelations: incomingByTable.get(tableName) ?? [],
    };
  });
}

/**
 * Genera el manifiesto OPO completo a partir del snapshot del diccionario Protheus.
 * Las relaciones SX9 se inyectan en `relationships` para que agentes MCP naveguen sin inferir.
 */
export function buildOpoManifestFromProtheus(
  snapshot: ProtheusDictionarySnapshot,
  options: BuildProtheusManifestOptions = {}
): OpoManifestFromProtheus {
  const entities = buildDiscoveredEntities(snapshot);
  const relationships = extractRelationshipsFromSx9(snapshot.relationships, snapshot.tables);

  const companySuffix = options.companySuffix ?? '010';

  const supportedEntities = entities.map((entity) => ({
    canonical: entity.canonical,
    native_reference: `${entity.tableName}${companySuffix}`,
    confidence: 1.0,
    limitations: `Auto-discovered from Protheus dictionary (SX2): ${entity.description}`,
  }));

  const customMappings: Record<string, Record<string, unknown>> = {};

  const sx2ByTable = new Map(
    snapshot.tables.map((t) => [normalizeTableName(t.X2_CHAVE), t])
  );

  for (const entity of entities) {
    const businessName = entity.canonical.replace(/^opo:/, '');
    const fieldsMapping: Record<string, string> = {};
    const sx2 = sx2ByTable.get(normalizeTableName(entity.tableName));

    for (const attr of entity.attributes) {
      const camelName = attr.name
        .toLowerCase()
        .replace(/_([a-z0-9])/gi, (_m, g: string) => g.toUpperCase());
      fieldsMapping[camelName] = attr.name;
    }

    const physicalTableName = `${entity.tableName}${companySuffix}`;
    const filialField = filialFieldForTable(entity.tableName, snapshot.fields);

    customMappings[businessName] = {
      [`${entity.tableName}_fields`]: fieldsMapping,
      attributes: entity.attributes,
      protheus_meta: {
        alias: entity.alias,
        description: entity.description,
        physicalTableName,
        companySuffix,
        x2Modo: sx2?.X2_MODO,
        filialField,
        outgoing_relations: entity.outgoingRelations.map((r) => r.id),
        incoming_relations: entity.incomingRelations.map((r) => r.id),
      },
      mutation_policy: {
        readOnly: true,
        strategy: 'rest',
      },
    };
  }

  return {
    opo_version: '0.1.0',
    system_identity: {
      erp_name: options.projectName ?? 'TOTVS Protheus',
      version: options.erpVersion ?? '12.1.2310',
      jurisdictions: options.jurisdictions ?? ['BR', 'AR'],
      organization_name: options.organizationName ?? 'Auto-Discovered Org',
    },
    adapter_configuration: {
      base_url: options.baseUrl ?? '',
      protocol_interface: 'REST',
      dictionary_source: 'SX2/SX3/SX9',
      readOnly: true,
      mutationStrategy: 'rest',
      company_suffix: companySuffix,
    } as any,
    supported_entities: supportedEntities,
    custom_mappings: customMappings,
    relationships,
    discoveredAt: snapshot.extractedAt,
    dictionary_meta: {
      source: snapshot.source,
      tables_count: snapshot.tables.length,
      fields_count: snapshot.fields.length,
      relationships_count: relationships.length,
      company_suffix: options.companySuffix,
    },
  };
}

/**
 * Pipeline de alto nivel: consulta diccionario → extrae DER → genera manifiesto OPO.
 */
export async function discoverProtheusOntology(
  queryOptions: ProtheusDictionaryQueryOptions = {},
  manifestOptions: BuildProtheusManifestOptions = {}
): Promise<{
  snapshot: ProtheusDictionarySnapshot;
  entities: ProtheusDiscoveredEntity[];
  manifest: OpoManifestFromProtheus;
}> {
  const snapshot = await queryProtheusDictionary(queryOptions);
  const entities = buildDiscoveredEntities(snapshot);
  const manifest = buildOpoManifestFromProtheus(snapshot, {
    ...manifestOptions,
    companySuffix: queryOptions.companySuffix ?? manifestOptions.companySuffix,
  });

  return { snapshot, entities, manifest };
}

/**
 * Discovery incremental: carga baseline pre-armado + escanea solo deltas (tablas/campos/relaciones nuevas).
 */
import {
  mergeProtheusBaselineWithLive,
  buildMockLiveSnapshotWithDelta,
  ProtheusIncrementalDiscoveryResult,
} from './protheusDeltaMerge';

export async function discoverProtheusOntologyIncremental(
  queryOptions: ProtheusDictionaryQueryOptions & { simulateDelta?: boolean } = {},
  manifestOptions: BuildProtheusManifestOptions = {}
): Promise<ProtheusIncrementalDiscoveryResult> {

  let liveSnapshot: ProtheusDictionarySnapshot;

  if (queryOptions.simulateDelta) {
    liveSnapshot = buildMockLiveSnapshotWithDelta();
  } else {
    liveSnapshot = await queryProtheusDictionary(queryOptions);
  }

  const result = mergeProtheusBaselineWithLive(liveSnapshot);

  if (manifestOptions.baseUrl) {
    result.mergedManifest.adapter_configuration.base_url = manifestOptions.baseUrl;
  }
  if (manifestOptions.organizationName) {
    result.mergedManifest.system_identity.organization_name = manifestOptions.organizationName;
  }

  return result;
}