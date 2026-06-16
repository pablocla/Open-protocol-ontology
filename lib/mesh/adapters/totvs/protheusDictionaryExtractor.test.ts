import { describe, it, expect } from 'vitest';
import {
  queryProtheusDictionary,
  extractRelationshipsFromSx9,
  buildDiscoveredEntities,
  buildOpoManifestFromProtheus,
  discoverProtheusOntology,
} from './protheusDictionaryExtractor';
import { MOCK_SX9_RELATIONSHIPS } from './protheusMockData';

describe('Protheus SX Dictionary Extractor', () => {
  it('extrae la relación SC5.C5_CLIENTE → SA1.A1_COD desde SX9', async () => {
    const snapshot = await queryProtheusDictionary({ mode: 'mock' });
    const relationships = extractRelationshipsFromSx9(snapshot.relationships, snapshot.tables);

    const sc5ToSa1 = relationships.find(
      (r) =>
        r.sourceTable === 'SC5' &&
        r.sourceField === 'C5_CLIENTE' &&
        r.targetTable === 'SA1' &&
        r.targetField === 'A1_COD'
    );

    expect(sc5ToSa1).toBeDefined();
    expect(sc5ToSa1?.source).toBe('sx9');
    expect(sc5ToSa1?.confidence).toBe(1.0);
    expect(sc5ToSa1?.sourceCanonical).toBe('opo:SalesOrderHeader');
    expect(sc5ToSa1?.targetCanonical).toBe('opo:Customer');
    expect(sc5ToSa1?.cardinality).toBe('ONE_TO_MANY');
  });

  it('excluye relaciones SX9 deshabilitadas (X9_ENABLE = N)', async () => {
    const snapshot = await queryProtheusDictionary({ mode: 'mock' });
    const relationships = extractRelationshipsFromSx9(snapshot.relationships, snapshot.tables);

    const disabled = relationships.find(
      (r) => r.sourceTable === 'SC5' && r.targetTable === 'SF2'
    );
    expect(disabled).toBeUndefined();
    expect(MOCK_SX9_RELATIONSHIPS.some((r) => r.X9_ENABLE === 'N')).toBe(true);
  });

  it('aplica tableFilter para escaneos progresivos', async () => {
    const snapshot = await queryProtheusDictionary({
      mode: 'mock',
      tableFilter: 'SC*,SA1',
    });

    expect(snapshot.tables.map((t) => t.X2_CHAVE).sort()).toEqual(['SA1', 'SC5', 'SC6']);
    expect(snapshot.relationships.every((r) => ['SC5', 'SC6', 'SA1'].includes(r.X9_DOM))).toBe(true);
  });

  it('construye entidades con atributos SX3 y relaciones salientes', async () => {
    const snapshot = await queryProtheusDictionary({ mode: 'mock' });
    const entities = buildDiscoveredEntities(snapshot);

    const sc5 = entities.find((e) => e.tableName === 'SC5');
    expect(sc5).toBeDefined();
    expect(sc5?.attributes.some((a) => a.name === 'C5_CLIENTE')).toBe(true);
    expect(sc5?.outgoingRelations.some((r) => r.targetTable === 'SA1')).toBe(true);
  });

  it('genera manifiesto OPO con relationships inyectadas', async () => {
    const { manifest } = await discoverProtheusOntology(
      { mode: 'mock' },
      { organizationName: 'Test Corp', erpVersion: '12.1.2310' }
    );

    expect(manifest.system_identity.erp_name).toBe('TOTVS Protheus');
    expect(manifest.supported_entities.length).toBeGreaterThan(0);
    expect(manifest.relationships.length).toBeGreaterThanOrEqual(5);
    expect(manifest.dictionary_meta.source).toBe('mock');
    expect(manifest.adapter_configuration.dictionary_source).toBe('SX2/SX3/SX9');

    const customerMapping = manifest.custom_mappings.Customer;
    expect(customerMapping).toBeDefined();
    expect(customerMapping.SA1_fields).toBeDefined();
  });
});