/**
 * Protheus/TOTVS query guards: soft-delete (D_E_L_E_T_) and filial isolation (X2_MODO).
 */

export const PROTHEUS_SOFT_DELETE_FIELD = 'D_E_L_E_T_';
export const PROTHEUS_ACTIVE_DELETE_MARKER = ' ';

export type ProtheusSqlDialect = 'postgresql' | 'mssql' | 'oracle' | 'ansi';

export interface OpoSystemContext {
  erp?: 'protheus' | 'sap' | 'generic';
  filial?: string;
  companySuffix?: string;
  dialect?: ProtheusSqlDialect;
}

export interface ProtheusTableMeta {
  /** SX2_MODO: E/1 = exclusiva por filial, C/2 = compartida */
  x2Modo?: string;
  filialField?: string;
  companySuffix?: string;
  physicalTableName?: string;
}

export interface ProtheusMappingExtension {
  protheus?: ProtheusTableMeta;
  mutationPolicy?: {
    readOnly?: boolean;
    strategy?: 'sql' | 'rest';
    restEndpoint?: string;
  };
}

/** X2_MODO values that require filial filtering in business queries. */
export function isProtheusTableExclusive(x2Modo?: string): boolean {
  if (!x2Modo) return true;
  const mode = x2Modo.trim().toUpperCase();
  if (['C', '2', 'S'].includes(mode)) return false;
  if (['E', '1', '3'].includes(mode)) return true;
  return true;
}

export function resolvePhysicalTableName(
  logicalOrPhysical: string,
  companySuffix?: string
): string {
  const name = logicalOrPhysical.trim();
  if (!companySuffix) return name;
  const suffix = companySuffix.trim();
  if (name.toLowerCase().endsWith(suffix.toLowerCase())) return name;
  return `${name}${suffix}`;
}

/** Derive filial column from first field prefix (SA1/A1_COD → A1_FILIAL). */
export function deriveFilialFieldFromColumns(
  fieldColumns: string[],
  explicitFilialField?: string
): string | undefined {
  if (explicitFilialField?.trim()) return explicitFilialField.trim();
  const filialCol = fieldColumns.find((c) => /_FILIAL$/i.test(c));
  if (filialCol) return filialCol;
  const first = fieldColumns.find((c) => c.includes('_'));
  if (!first) return undefined;
  const prefix = first.split('_')[0];
  return prefix ? `${prefix}_FILIAL` : undefined;
}

export function buildProtheusSoftDeleteCondition(tableAlias: string): string {
  return `${tableAlias}.${PROTHEUS_SOFT_DELETE_FIELD} = ?`;
}

export function buildProtheusFilialCondition(
  tableAlias: string,
  filialField: string
): string {
  return `${tableAlias}.${filialField} = ?`;
}

export interface ProtheusGuardInjection {
  conditions: string[];
  params: unknown[];
}

/**
 * Build mandatory WHERE fragments for a Protheus business table.
 */
export function buildProtheusTableGuards(
  tableAlias: string,
  meta: ProtheusTableMeta | undefined,
  context: OpoSystemContext | undefined,
  fieldColumns: string[] = []
): ProtheusGuardInjection {
  const conditions: string[] = [];
  const params: unknown[] = [];

  const erp = context?.erp;
  const isProtheus = erp === 'protheus' || !!meta;
  if (!isProtheus) {
    return { conditions, params };
  }

  conditions.push(buildProtheusSoftDeleteCondition(tableAlias));
  params.push(PROTHEUS_ACTIVE_DELETE_MARKER);

  const x2Modo = meta?.x2Modo;
  if (isProtheusTableExclusive(x2Modo)) {
    const filial = context?.filial?.trim();
    if (!filial) {
      throw new Error(
        `Protheus Security: filial is required for exclusive table '${tableAlias}' (X2_MODO=${x2Modo ?? 'E'}). Provide context.filial in the OPO query.`
      );
    }
    const filialField =
      meta?.filialField ?? deriveFilialFieldFromColumns(fieldColumns);
    if (!filialField) {
      throw new Error(
        `Protheus Security: cannot derive filial field for table '${tableAlias}'. Set protheus.filialField in the mapping.`
      );
    }
    conditions.push(buildProtheusFilialCondition(tableAlias, filialField));
    params.push(filial);
  }

  return { conditions, params };
}

export function formatPaginationClause(
  dialect: ProtheusSqlDialect | undefined,
  fetchLimit: number,
  offset: number
): string {
  const d = dialect ?? 'postgresql';
  if (d === 'mssql' && offset === 0) {
    return `TOP ${fetchLimit}`;
  }
  if (d === 'mssql' && offset > 0) {
    return `OFFSET ${offset} ROWS FETCH NEXT ${fetchLimit} ROWS ONLY`;
  }
  const limitClause = `LIMIT ${fetchLimit}`;
  const offsetClause = offset > 0 ? ` OFFSET ${offset}` : '';
  return `${limitClause}${offsetClause}`;
}

export function formatSelectPrefix(dialect: ProtheusSqlDialect | undefined, fetchLimit: number, offset: number): string {
  const d = dialect ?? 'postgresql';
  if (d === 'mssql' && offset === 0) {
    return `TOP ${fetchLimit} `;
  }
  return '';
}