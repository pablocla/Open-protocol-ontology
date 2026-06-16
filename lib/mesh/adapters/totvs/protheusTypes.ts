import { FieldType, RelationCardinality } from '../../../studio/studioTypes';

// ─── Filas crudas del diccionario de datos Protheus (tablas SX) ───────────────

/** SX2 — Manutenção dos Arquivos (catálogo de tablas) */
export interface ProtheusSx2Row {
  X2_CHAVE: string;
  X2_ARQUIVO: string;
  X2_NOME: string;
  X2_NOMETAB?: string;
  X2_MODO?: string;
}

/** SX3 — Manutenção dos Campos (columnas por tabla) */
export interface ProtheusSx3Row {
  X3_ARQUIVO: string;
  X3_CAMPO: string;
  X3_TIPO: string;
  X3_TITULO: string;
  X3_TAMANHO?: number;
  X3_DECIMAL?: number;
  X3_OBRIGAT?: 'S' | 'N' | string;
  X3_CONTEXT?: string;
  X3_ORDEM?: string;
  X3_F3?: string;
  X3_RELACAO?: string;
}

/**
 * SX9 — Manutenção de Relacionamento entre Arquivos (DER oficial).
 * X9_DOM/X9_CDOM = tabla/campo origen; X9_LIGDOM/X9_LIGCDOM = tabla/campo destino.
 */
export interface ProtheusSx9Row {
  X9_DOM: string;
  X9_CDOM: string;
  X9_LIGDOM: string;
  X9_LIGCDOM: string;
  X9_IDENT: string;
  X9_EXPDOM?: string;
  X9_EXPCDOM?: string;
  X9_CONDSQL?: string;
  X9_ENABLE?: 'S' | 'N' | string;
  X9_PROPRI?: string;
}

// ─── Tipos OPO derivados del diccionario ─────────────────────────────────────

export type RelationshipSource = 'sx9' | 'sx3_f3' | 'inferred';

/**
 * Relación tipada que OPO consume para navegar entre tablas sin inferencia IA.
 * Compatible con el campo `relationships` del manifiesto opo.json.
 */
export interface EntityRelationship {
  id: string;
  sourceTable: string;
  targetTable: string;
  sourceCanonical: string;
  targetCanonical: string;
  sourceField: string;
  targetField: string;
  cardinality: RelationCardinality;
  conditionSql?: string;
  source: RelationshipSource;
  confidence: number;
  metadata?: {
    sx9Ident?: string;
    sx9ExpandedSource?: string;
    sx9ExpandedTarget?: string;
    description?: string;
  };
}

export interface ProtheusEntityAttribute {
  id: string;
  name: string;
  type: FieldType;
  isPrimaryKey: boolean;
  isRequired: boolean;
  isUnique: boolean;
  length?: number;
  precision?: number;
  scale?: number;
  comment?: string;
}

export interface ProtheusDiscoveredEntity {
  tableName: string;
  alias: string;
  description: string;
  canonical: string;
  attributes: ProtheusEntityAttribute[];
  outgoingRelations: EntityRelationship[];
  incomingRelations: EntityRelationship[];
}

export interface ProtheusDictionarySnapshot {
  tables: ProtheusSx2Row[];
  fields: ProtheusSx3Row[];
  relationships: ProtheusSx9Row[];
  extractedAt: string;
  source: 'mock' | 'database';
}

export interface ProtheusDictionaryQueryOptions {
  /** 'mock' usa datos embebidos; 'database' ejecuta SQL contra SX2/SX3/SX9 */
  mode?: 'mock' | 'database';
  connectionString?: string;
  /** Sufijo de empresa Protheus, ej. "010" → tablas SX2010, SX3010, SX9010 */
  companySuffix?: string;
  /** Filtro glob de tablas a incluir, ej. "SC*,SA*,SF*" */
  tableFilter?: string;
}

export interface ProtheusManifestEntity {
  canonical: string;
  native_reference: string;
  confidence: number;
  limitations: string;
}

export interface OpoManifestFromProtheus {
  opo_version: string;
  system_identity: {
    erp_name: string;
    version: string;
    jurisdictions?: string[];
    organization_name: string;
  };
  adapter_configuration: {
    base_url: string;
    protocol_interface: string;
    dictionary_source?: string;
  };
  supported_entities: ProtheusManifestEntity[];
  custom_mappings: Record<string, Record<string, unknown>>;
  relationships: EntityRelationship[];
  discoveredAt: string;
  dictionary_meta: {
    source: 'mock' | 'database';
    tables_count: number;
    fields_count: number;
    relationships_count: number;
    company_suffix?: string;
    baseline_version?: string;
    is_baseline?: boolean;
    last_delta_scan?: string;
    delta_new_tables?: number;
    delta_new_fields?: number;
    delta_new_relationships?: number;
  };
}

export interface BuildProtheusManifestOptions {
  projectName?: string;
  organizationName?: string;
  erpVersion?: string;
  baseUrl?: string;
  jurisdictions?: string[];
  companySuffix?: string;
}