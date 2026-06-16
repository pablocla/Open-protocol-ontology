import { getProtheusBaselineManifest, getProtheusBaselineSnapshot } from './protheusBaseline';
import {
  buildDiscoveredEntities,
  buildOpoManifestFromProtheus,
  extractRelationshipsFromSx9,
  suggestProtheusCanonicalName,
} from './protheusDictionaryExtractor';
import {
  EntityRelationship,
  OpoManifestFromProtheus,
  ProtheusDictionarySnapshot,
  ProtheusDiscoveredEntity,
  ProtheusEntityAttribute,
  ProtheusSx2Row,
  ProtheusSx3Row,
  ProtheusSx9Row,
} from './protheusTypes';
import {
  MOCK_LIVE_DELTA_SX2,
  MOCK_LIVE_DELTA_SX3,
  MOCK_LIVE_DELTA_SX9,
  PROTHEUS_BASELINE_VERSION,
} from './protheusBaselineSeed';

export interface ProtheusFieldDelta {
  table: string;
  field: string;
  attribute: ProtheusEntityAttribute;
}

export interface ProtheusDeltaReport {
  baselineVersion: string;
  newTables: ProtheusSx2Row[];
  newFields: ProtheusFieldDelta[];
  newRelationships: EntityRelationship[];
  scannedAt: string;
  hasChanges: boolean;
}

export interface ProtheusIncrementalDiscoveryResult {
  baseline: OpoManifestFromProtheus;
  liveSnapshot: ProtheusDictionarySnapshot;
  delta: ProtheusDeltaReport;
  mergedManifest: OpoManifestFromProtheus;
  entities: ProtheusDiscoveredEntity[];
}

function normalizeTable(name: string): string {
  return name.trim().toUpperCase();
}

function relationKey(rel: Pick<EntityRelationship, 'sourceTable' | 'sourceField' | 'targetTable' | 'targetField'>): string {
  return `${rel.sourceTable}.${rel.sourceField}->${rel.targetTable}.${rel.targetField}`;
}

function buildBaselineFieldIndex(baseline: OpoManifestFromProtheus): Map<string, Set<string>> {
  const companySuffix = baseline.dictionary_meta?.company_suffix || '010';
  const index = new Map<string, Set<string>>();
  for (const mapping of Object.values(baseline.custom_mappings)) {
    const attrs = (mapping.attributes as ProtheusEntityAttribute[]) || [];
    for (const attr of attrs) {
      let table = attr.id.split('-')[1] || '';
      if (!table) continue;
      table = normalizeTable(table);
      if (table.endsWith(companySuffix) && table.length > companySuffix.length) {
        table = table.substring(0, table.length - companySuffix.length);
      }
      const set = index.get(table) ?? new Set<string>();
      set.add(attr.name);
      index.set(table, set);
    }
  }
  return index;
}

function buildBaselineTableSet(baseline: OpoManifestFromProtheus): Set<string> {
  const companySuffix = baseline.dictionary_meta?.company_suffix || '010';
  return new Set(
    (baseline.supported_entities || []).map((e) => {
      const native = normalizeTable(e.native_reference.split(' ')[0]);
      if (native.endsWith(companySuffix) && native.length > companySuffix.length) {
        return native.substring(0, native.length - companySuffix.length);
      }
      return native;
    })
  );
}

function buildBaselineRelationSet(baseline: OpoManifestFromProtheus): Set<string> {
  const companySuffix = baseline.dictionary_meta?.company_suffix || '010';
  return new Set((baseline.relationships || []).map(r => {
    let src = normalizeTable(r.sourceTable);
    let tgt = normalizeTable(r.targetTable);
    if (src.endsWith(companySuffix) && src.length > companySuffix.length) {
      src = src.substring(0, src.length - companySuffix.length);
    }
    if (tgt.endsWith(companySuffix) && tgt.length > companySuffix.length) {
      tgt = tgt.substring(0, tgt.length - companySuffix.length);
    }
    return relationKey({
      sourceTable: src,
      sourceField: r.sourceField,
      targetTable: tgt,
      targetField: r.targetField
    });
  }));
}

/**
 * Compara el diccionario live (SX2/SX3/SX9) contra el baseline y devuelve SOLO lo nuevo.
 */
export function computeProtheusDelta(
  liveSnapshot: ProtheusDictionarySnapshot,
  baseline?: OpoManifestFromProtheus
): ProtheusDeltaReport {
  const base = baseline ?? getProtheusBaselineManifest();
  const companySuffix = base.dictionary_meta?.company_suffix || '010';
  const baselineTables = buildBaselineTableSet(base);
  const baselineFields = buildBaselineFieldIndex(base);
  const baselineRelations = buildBaselineRelationSet(base);

  const newTables = liveSnapshot.tables.filter((t) => {
    let chave = normalizeTable(t.X2_CHAVE);
    if (chave.endsWith(companySuffix) && chave.length > companySuffix.length) {
      chave = chave.substring(0, chave.length - companySuffix.length);
    }
    return !baselineTables.has(chave);
  });

  const newFields: ProtheusFieldDelta[] = [];
  const liveEntities = buildDiscoveredEntities(liveSnapshot);

  for (const entity of liveEntities) {
    let entityTable = normalizeTable(entity.tableName);
    if (entityTable.endsWith(companySuffix) && entityTable.length > companySuffix.length) {
      entityTable = entityTable.substring(0, entityTable.length - companySuffix.length);
    }
    const knownFields = baselineFields.get(entityTable) ?? new Set<string>();
    for (const attr of entity.attributes) {
      if (!knownFields.has(attr.name)) {
        newFields.push({
          table: entity.tableName,
          field: attr.name,
          attribute: { ...attr, comment: `${attr.comment || attr.name} (custom/delta)` },
        });
      }
    }
  }

  const liveRelations = extractRelationshipsFromSx9(liveSnapshot.relationships, liveSnapshot.tables);
  const newRelationships = liveRelations.filter((r) => {
    let src = normalizeTable(r.sourceTable);
    let tgt = normalizeTable(r.targetTable);
    if (src.endsWith(companySuffix) && src.length > companySuffix.length) {
      src = src.substring(0, src.length - companySuffix.length);
    }
    if (tgt.endsWith(companySuffix) && tgt.length > companySuffix.length) {
      tgt = tgt.substring(0, tgt.length - companySuffix.length);
    }
    return !baselineRelations.has(relationKey({
      sourceTable: src,
      sourceField: r.sourceField,
      targetTable: tgt,
      targetField: r.targetField
    }));
  });

  return {
    baselineVersion: PROTHEUS_BASELINE_VERSION,
    newTables,
    newFields,
    newRelationships,
    scannedAt: liveSnapshot.extractedAt,
    hasChanges: newTables.length > 0 || newFields.length > 0 || newRelationships.length > 0,
  };
}

/**
 * Fusiona baseline + delta live → manifiesto OPO final para el cliente.
 * El baseline aporta semántica conocida; el delta agrega customizaciones locales.
 */
export function mergeProtheusBaselineWithLive(
  liveSnapshot: ProtheusDictionarySnapshot,
  baseline?: OpoManifestFromProtheus
): ProtheusIncrementalDiscoveryResult {
  const base = structuredClone(baseline ?? getProtheusBaselineManifest());
  const delta = computeProtheusDelta(liveSnapshot, base);

  if (!delta.hasChanges) {
    return {
      baseline: base,
      liveSnapshot,
      delta,
      mergedManifest: {
        ...base,
        discoveredAt: liveSnapshot.extractedAt,
        dictionary_meta: {
          ...base.dictionary_meta,
          last_delta_scan: liveSnapshot.extractedAt,
          delta_new_tables: 0,
          delta_new_fields: 0,
          delta_new_relationships: 0,
        },
      },
      entities: buildDiscoveredEntities(liveSnapshot),
    };
  }

  const merged = structuredClone(base);

  // Nuevas tablas → nuevas entidades supported_entities + custom_mappings
  for (const table of delta.newTables) {
    const tableName = normalizeTable(table.X2_CHAVE);
    const canonical = `opo:${suggestProtheusCanonicalName(tableName)}`;
    const businessName = canonical.replace(/^opo:/, '');

    merged.supported_entities.push({
      canonical,
      native_reference: tableName,
      confidence: 0.85,
      limitations: `Custom table discovered via SX2 delta: ${table.X2_NOME}`,
    });

    const entityAttrs = delta.newFields
      .filter((f) => normalizeTable(f.table) === tableName)
      .map((f) => ({ ...f.attribute, comment: `${f.attribute.comment} [_opo_origin:delta]` }));

    const fieldsMapping: Record<string, string> = {};
    for (const attr of entityAttrs) {
      const camel = attr.name.toLowerCase().replace(/_([a-z0-9])/gi, (_m, g: string) => g.toUpperCase());
      fieldsMapping[camel] = attr.name;
    }

    merged.custom_mappings[businessName] = {
      [`${tableName}_fields`]: fieldsMapping,
      attributes: entityAttrs,
      protheus_meta: {
        alias: table.X2_ARQUIVO,
        description: table.X2_NOME,
        _opo_origin: 'delta',
      },
    };
  }

  // Campos nuevos en tablas existentes
  const fieldsByTable = new Map<string, ProtheusFieldDelta[]>();
  for (const f of delta.newFields) {
    const list = fieldsByTable.get(normalizeTable(f.table)) ?? [];
    list.push(f);
    fieldsByTable.set(normalizeTable(f.table), list);
  }

  for (const [tableName, fields] of fieldsByTable) {
    const entity = merged.supported_entities.find(
      (e) => normalizeTable(e.native_reference) === tableName
    );
    if (!entity) continue;

    const businessName = entity.canonical.replace(/^opo:/, '');
    const mapping = merged.custom_mappings[businessName] || {};
    const fieldsKey = Object.keys(mapping).find((k) => k.endsWith('_fields')) || `${tableName}_fields`;
    const existingFields = (mapping[fieldsKey] as Record<string, string>) || {};
    const existingAttrs = (mapping.attributes as ProtheusEntityAttribute[]) || [];

    for (const f of fields) {
      const camel = f.field.toLowerCase().replace(/_([a-z0-9])/gi, (_m, g: string) => g.toUpperCase());
      existingFields[camel] = f.field;
      existingAttrs.push({ ...f.attribute, comment: `${f.attribute.comment} [_opo_origin:delta]` });
    }

    merged.custom_mappings[businessName] = {
      ...mapping,
      [fieldsKey]: existingFields,
      attributes: existingAttrs,
    };
  }

  // Nuevas relaciones SX9
  const existingRelKeys = new Set(merged.relationships.map(relationKey));
  for (const rel of delta.newRelationships) {
    if (!existingRelKeys.has(relationKey(rel))) {
      merged.relationships.push({
        ...rel,
        confidence: 0.95,
        metadata: { ...rel.metadata, _opo_origin: 'delta' } as any,
      });
    }
  }

  merged.discoveredAt = liveSnapshot.extractedAt;
  merged.dictionary_meta = {
    ...merged.dictionary_meta,
    source: liveSnapshot.source,
    last_delta_scan: liveSnapshot.extractedAt,
    delta_new_tables: delta.newTables.length,
    delta_new_fields: delta.newFields.length,
    delta_new_relationships: delta.newRelationships.length,
    baseline_version: PROTHEUS_BASELINE_VERSION,
  };

  return {
    baseline: base,
    liveSnapshot,
    delta,
    mergedManifest: merged,
    entities: buildDiscoveredEntities(liveSnapshot),
  };
}

/** Construye snapshot live = baseline + deltas simulados (para demos/tests) */
export function buildMockLiveSnapshotWithDelta(): ProtheusDictionarySnapshot {
  const baseline = getProtheusBaselineSnapshot();
  return {
    tables: [...baseline.tables, ...MOCK_LIVE_DELTA_SX2],
    fields: [...baseline.fields, ...MOCK_LIVE_DELTA_SX3],
    relationships: [...baseline.relationships, ...MOCK_LIVE_DELTA_SX9],
    extractedAt: new Date().toISOString(),
    source: 'mock',
  };
}