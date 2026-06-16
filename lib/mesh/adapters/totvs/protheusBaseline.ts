import {
  BASELINE_SEMANTIC_MAPPINGS,
  BASELINE_SX2,
  BASELINE_SX3,
  BASELINE_SX9,
  PROTHEUS_BASELINE_VERSION,
} from './protheusBaselineSeed';
import { buildOpoManifestFromProtheus } from './protheusDictionaryExtractor';
import { OpoManifestFromProtheus, ProtheusDictionarySnapshot } from './protheusTypes';

let cachedBaseline: OpoManifestFromProtheus | null = null;

export function getProtheusBaselineSnapshot(): ProtheusDictionarySnapshot {
  return {
    tables: BASELINE_SX2,
    fields: BASELINE_SX3,
    relationships: BASELINE_SX9,
    extractedAt: '2026-01-01T00:00:00.000Z',
    source: 'mock',
  };
}

/**
 * Manifiesto OPO pre-armado con todo el conocimiento público de Protheus.
 * No requiere conexión a BD — es la "premodelo" que OPO Studio carga al inicio.
 */
export function getProtheusBaselineManifest(): OpoManifestFromProtheus {
  if (cachedBaseline) return structuredClone(cachedBaseline);

  const snapshot = getProtheusBaselineSnapshot();
  const manifest = buildOpoManifestFromProtheus(snapshot, {
    projectName: 'TOTVS Protheus',
    erpVersion: '12.1.2310',
    organizationName: 'OPO Baseline Registry',
    jurisdictions: ['BR', 'AR', 'MX'],
  });

  // Inyectar mapeos semánticos canónicos (opo:Customer.id → A1_COD+A1_LOJA, etc.)
  for (const [entityName, semanticFields] of Object.entries(BASELINE_SEMANTIC_MAPPINGS)) {
    if (!manifest.custom_mappings[entityName]) continue;
    const tableKey = Object.keys(manifest.custom_mappings[entityName]).find((k) => k.endsWith('_fields'));
    if (tableKey) {
      manifest.custom_mappings[entityName][tableKey] = {
        ...(manifest.custom_mappings[entityName][tableKey] as Record<string, string>),
        ...semanticFields,
      };
    }
    manifest.custom_mappings[entityName]._semantic = semanticFields;
  }

  manifest.dictionary_meta = {
    ...manifest.dictionary_meta,
    source: 'mock',
    baseline_version: PROTHEUS_BASELINE_VERSION,
    is_baseline: true,
  } as typeof manifest.dictionary_meta & { baseline_version: string; is_baseline: boolean };

  manifest.adapter_configuration = {
    ...manifest.adapter_configuration,
    access_modes: ['REST', 'SQL', 'MCP'],
    discovery_strategy: 'baseline_plus_delta',
  } as typeof manifest.adapter_configuration & {
    access_modes: string[];
    discovery_strategy: string;
  };

  cachedBaseline = manifest;
  return structuredClone(manifest);
}

export function getProtheusBaselineVersion(): string {
  return PROTHEUS_BASELINE_VERSION;
}