import { describe, it, expect } from 'vitest';
import {
  computeProtheusDelta,
  mergeProtheusBaselineWithLive,
  buildMockLiveSnapshotWithDelta,
} from './protheusDeltaMerge';
import { getProtheusBaselineManifest } from './protheusBaseline';

describe('Protheus incremental delta merge', () => {
  it('detecta tabla custom ZZ1 y campo C5_XOPOCRM como delta', () => {
    const live = buildMockLiveSnapshotWithDelta();
    const delta = computeProtheusDelta(live);

    expect(delta.hasChanges).toBe(true);
    expect(delta.newTables.map((t) => t.X2_CHAVE)).toContain('ZZ1');
    expect(delta.newFields.some((f) => f.table === 'SC5' && f.field === 'C5_XOPOCRM')).toBe(true);
    expect(delta.newRelationships.some((r) => r.sourceTable === 'ZZ1' && r.targetTable === 'SA1')).toBe(true);
  });

  it('no reporta deltas cuando live == baseline', () => {
    const baseline = getProtheusBaselineManifest();
    const live = {
      tables: baseline.supported_entities.map((e) => ({
        X2_CHAVE: e.native_reference.split(' ')[0],
        X2_ARQUIVO: e.native_reference.split(' ')[0],
        X2_NOME: e.limitations,
      })),
      fields: [],
      relationships: baseline.relationships.map((r) => ({
        X9_DOM: r.sourceTable,
        X9_CDOM: r.sourceField,
        X9_LIGDOM: r.targetTable,
        X9_LIGCDOM: r.targetField,
        X9_IDENT: '001',
        X9_ENABLE: 'S',
      })),
      extractedAt: new Date().toISOString(),
      source: 'mock' as const,
    };

    // Sin campos en live, delta de campos no aplica; relaciones y tablas deben coincidir
    const delta = computeProtheusDelta(live, baseline);
    expect(delta.newTables.length).toBe(0);
    expect(delta.newRelationships.length).toBe(0);
  });

  it('fusiona baseline + delta en manifiesto merged', () => {
    const live = buildMockLiveSnapshotWithDelta();
    const result = mergeProtheusBaselineWithLive(live);

    expect(result.mergedManifest.supported_entities.some((e) => e.native_reference === 'ZZ1')).toBe(true);
    expect(result.mergedManifest.dictionary_meta.delta_new_tables).toBe(1);
    expect(result.mergedManifest.dictionary_meta.delta_new_fields).toBeGreaterThanOrEqual(2);
    expect(result.mergedManifest.relationships.length).toBeGreaterThan(
      result.baseline.relationships.length
    );
  });
});