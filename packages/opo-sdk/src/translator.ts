import {
  normalizeOpoQueryPayload,
  resolvePagination,
  type ResolvedPagination,
} from './pagination';
import {
  buildProtheusTableGuards,
  formatPaginationClause,
  formatSelectPrefix,
  type OpoSystemContext,
  type ProtheusMappingExtension,
  type ProtheusSqlDialect,
  resolvePhysicalTableName,
  PROTHEUS_SOFT_DELETE_FIELD,
  PROTHEUS_ACTIVE_DELETE_MARKER,
} from './protheusGuards';

export interface OpoField {
  column: string;
  type: string;
}

export interface OpoMapping extends ProtheusMappingExtension {
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

export interface Dictionary {
  [entityName: string]: OpoMapping;
}

export interface TranslateOpoToSqlOptions {
  context?: OpoSystemContext;
}

export interface TranslateOpoToSqlResult {
  sql: string;
  params: unknown[];
  pagination: ResolvedPagination;
}

function getFieldColumn(fieldMeta: OpoField | string): string {
  return typeof fieldMeta === 'string' ? fieldMeta : fieldMeta.column;
}

function getDialect(
  mapping: OpoMapping,
  context?: OpoSystemContext
): ProtheusSqlDialect {
  return context?.dialect ?? mapping.protheus?.companySuffix ? 'mssql' : 'postgresql';
}

function resolveTableName(mapping: OpoMapping, context?: OpoSystemContext): string {
  const suffix =
    context?.companySuffix ?? mapping.protheus?.companySuffix;
  const base =
    mapping.protheus?.physicalTableName ?? mapping.tableName;
  return resolvePhysicalTableName(base, suffix);
}

function collectFieldColumns(fields: Record<string, OpoField>): string[] {
  return Object.values(fields).map((f) => getFieldColumn(f));
}

function injectGuardsForTable(
  tableAlias: string,
  meta: ProtheusMappingExtension['protheus'],
  context: OpoSystemContext | undefined,
  fieldColumns: string[],
  conditions: string[],
  params: unknown[]
): void {
  const guards = buildProtheusTableGuards(tableAlias, meta, context, fieldColumns);
  conditions.push(...guards.conditions);
  params.push(...guards.params);
}

function parseFilterNode(
  node: any,
  tableAlias: string,
  fields: Record<string, OpoField>,
  params: any[],
  opoEntity: string,
  dialect: ProtheusSqlDialect
): string {
  let conditions: string[] = [];

  for (const [key, value] of Object.entries(node)) {
    if (key === 'AND') {
      const sub = (value as any[])
        .map((v) => parseFilterNode(v, tableAlias, fields, params, opoEntity, dialect))
        .join(' AND ');
      conditions.push(`(${sub})`);
    } else if (key === 'OR') {
      const sub = (value as any[])
        .map((v) => parseFilterNode(v, tableAlias, fields, params, opoEntity, dialect))
        .join(' OR ');
      conditions.push(`(${sub})`);
    } else if (key === 'NOT') {
      conditions.push(
        `NOT (${parseFilterNode(value, tableAlias, fields, params, opoEntity, dialect)})`
      );
    } else {
      const fieldMeta = fields[key];
      if (!fieldMeta) {
        throw new Error(`Filter field '${key}' not mapped for entity '${opoEntity}'.`);
      }
      const physicalColumn = getFieldColumn(fieldMeta);
      const columnRef = `${tableAlias}.${physicalColumn}`;
      const placeholder = '?';

      for (const [op, val] of Object.entries(value as any)) {
        switch (op) {
          case 'eq':
            conditions.push(`${columnRef} = ${placeholder}`);
            params.push(val);
            break;
          case 'neq':
            conditions.push(`${columnRef} != ${placeholder}`);
            params.push(val);
            break;
          case 'gt':
            conditions.push(`${columnRef} > ${placeholder}`);
            params.push(val);
            break;
          case 'gte':
            conditions.push(`${columnRef} >= ${placeholder}`);
            params.push(val);
            break;
          case 'lt':
            conditions.push(`${columnRef} < ${placeholder}`);
            params.push(val);
            break;
          case 'lte':
            conditions.push(`${columnRef} <= ${placeholder}`);
            params.push(val);
            break;
          case 'like':
            conditions.push(`${columnRef} LIKE ${placeholder}`);
            params.push(val);
            break;
          case 'in': {
            const placeholders = (val as any[]).map(() => placeholder).join(', ');
            conditions.push(`${columnRef} IN (${placeholders})`);
            params.push(...(val as any[]));
            break;
          }
          default:
            throw new Error(`Unsupported operator '${op}'`);
        }
      }
    }
  }
  return conditions.join(' AND ');
}

function assertMutationAllowed(mapping: OpoMapping): void {
  const policy = mapping.mutationPolicy;
  if (policy?.readOnly) {
    throw new Error(
      `Mutation blocked: entity '${mapping.entity}' is read-only. Use REST/TLPP endpoints (mutationPolicy.strategy='rest').`
    );
  }
  if (policy?.strategy === 'rest') {
    throw new Error(
      `Mutation blocked: entity '${mapping.entity}' requires REST adapter (${policy.restEndpoint ?? 'configure restEndpoint in manifest'}).`
    );
  }
}

export function translateOpoToSql(
  opoQuery: any,
  dictionary: Dictionary,
  options: TranslateOpoToSqlOptions = {}
): TranslateOpoToSqlResult {
  opoQuery = normalizeOpoQueryPayload(opoQuery);
  const pagination = resolvePagination(opoQuery);

  const mapping = dictionary[opoQuery.entity];
  if (!mapping) {
    throw new Error(`Entity '${opoQuery.entity}' not found in mapping dictionary.`);
  }

  const context: OpoSystemContext = {
    erp: options.context?.erp ?? opoQuery.context?.erp,
    filial: options.context?.filial ?? opoQuery.context?.filial,
    companySuffix:
      options.context?.companySuffix ?? opoQuery.context?.companySuffix,
    dialect: options.context?.dialect ?? opoQuery.context?.dialect,
  };

  if (mapping.protheus && !context.erp) {
    context.erp = 'protheus';
  }

  const tableName = resolveTableName(mapping, context);
  const fields = mapping.fields;
  const joins = mapping.joins;
  const security = mapping.security;
  const dialect = getDialect(mapping, context);

  let params: any[] = [];
  let selectClauses: string[] = [];
  let joinClauses: string[] = [];
  const guardedTables = new Set<string>();

  if (opoQuery.select) {
    for (const [key, value] of Object.entries(opoQuery.select)) {
      if (typeof value === 'boolean' && value) {
        const fieldMeta = fields[key];
        if (!fieldMeta) {
          throw new Error(`Field '${key}' not mapped for entity '${opoQuery.entity}'.`);
        }
        const physicalColumn = getFieldColumn(fieldMeta);
        selectClauses.push(`${tableName}.${physicalColumn} AS "${key}"`);
      } else if (typeof value === 'object' && value !== null) {
        if (!joins || !joins[key]) {
          throw new Error(`Join '${key}' not mapped for entity '${opoQuery.entity}'.`);
        }
        const relation = joins[key];
        const joinTable = resolvePhysicalTableName(
          relation.tableName,
          context.companySuffix ?? mapping.protheus?.companySuffix
        );
        let onClause = relation.on;
        if (relation.conditionSql?.trim()) {
          onClause = `${onClause} AND (${relation.conditionSql})`;
        }
        joinClauses.push(`LEFT JOIN ${joinTable} ON ${onClause}`);

        const nestedSelect = (value as any).select;
        if (nestedSelect) {
          for (const [nKey, nVal] of Object.entries(nestedSelect)) {
            if (nVal) {
              selectClauses.push(
                `${joinTable}.${String(nKey).toUpperCase()} AS "${key}_${nKey}"`
              );
            }
          }
        }
      }
    }
  }

  if (selectClauses.length === 0) {
    selectClauses.push(`${tableName}.*`);
  }

  const filterConditions: string[] = [];

  if (opoQuery.filter && Object.keys(opoQuery.filter).length > 0) {
    filterConditions.push(
      parseFilterNode(opoQuery.filter, tableName, fields, params, opoQuery.entity, dialect)
    );
  }

  if (security?.rowLevelPolicy && opoQuery.context) {
    const { field, contextKey } = security.rowLevelPolicy;
    const contextValue = opoQuery.context[contextKey];
    if (contextValue !== undefined) {
      filterConditions.push(`${tableName}.${field} = ?`);
      params.push(contextValue);
    } else {
      throw new Error(
        `Security Exception: Context missing required key '${contextKey}' for Row-Level Security.`
      );
    }
  } else if (security?.rowLevelPolicy && !opoQuery.context) {
    throw new Error(
      `Security Exception: RLS Policy exists but no context was provided in the query.`
    );
  }

  injectGuardsForTable(
    tableName,
    mapping.protheus,
    context,
    collectFieldColumns(fields),
    filterConditions,
    params
  );
  guardedTables.add(tableName);

  if (joins) {
    for (const relation of Object.values(joins)) {
      const joinTable = resolvePhysicalTableName(
        relation.tableName,
        context.companySuffix ?? mapping.protheus?.companySuffix
      );
      if (guardedTables.has(joinTable)) continue;
      injectGuardsForTable(
        joinTable,
        relation.protheus,
        context,
        [],
        filterConditions,
        params
      );
      guardedTables.add(joinTable);
    }
  }

  let whereClause = '';
  if (filterConditions.length > 0) {
    whereClause = 'WHERE ' + filterConditions.join(' AND ');
  }

  const selectPrefix = formatSelectPrefix(dialect, pagination.fetchLimit, pagination.offset);
  const paginationClause = formatPaginationClause(
    dialect,
    pagination.fetchLimit,
    pagination.offset
  );

  let sql: string;
  if (dialect === 'mssql' && pagination.offset === 0) {
    sql = `SELECT ${selectPrefix}${selectClauses.join(', ')}\nFROM ${tableName}\n${joinClauses.join('\n')}\n${whereClause}`.trim();
  } else if (dialect === 'mssql' && pagination.offset > 0) {
    sql = `SELECT ${selectClauses.join(', ')}\nFROM ${tableName}\n${joinClauses.join('\n')}\n${whereClause}\nORDER BY (SELECT NULL)\n${paginationClause}`.trim();
  } else {
    sql = `SELECT ${selectClauses.join(', ')}\nFROM ${tableName}\n${joinClauses.join('\n')}\n${whereClause}\n${paginationClause}`.trim();
  }

  return { sql, params, pagination };
}

export function translateOpoMutationToSql(
  opoMutation: any,
  dictionary: Dictionary,
  options: TranslateOpoToSqlOptions = {}
) {
  const mapping = dictionary[opoMutation.entity];
  if (!mapping) {
    throw new Error(`Entity '${opoMutation.entity}' not found in mapping dictionary.`);
  }

  assertMutationAllowed(mapping);

  const context: OpoSystemContext = {
    erp: options.context?.erp ?? opoMutation.context?.erp,
    filial: options.context?.filial ?? opoMutation.context?.filial,
    companySuffix:
      options.context?.companySuffix ?? opoMutation.context?.companySuffix,
    dialect: options.context?.dialect ?? opoMutation.context?.dialect,
  };
  if (mapping.protheus && !context.erp) {
    context.erp = 'protheus';
  }

  const tableName = resolveTableName(mapping, context);
  const fields = mapping.fields;
  const dialect = getDialect(mapping, context);

  let params: any[] = [];
  let sql = '';

  if (mapping.security?.rowLevelPolicy && !opoMutation.context) {
    throw new Error(
      `Security Exception: RLS Policy exists but no context was provided in the mutation.`
    );
  }

  const appendMutationGuards = (conditions: string[]) => {
    injectGuardsForTable(
      tableName,
      mapping.protheus,
      context,
      collectFieldColumns(fields),
      conditions,
      params
    );
  };

  switch (opoMutation.action) {
    case 'CALL': {
      if (!mapping.actions || !mapping.actions[opoMutation.procedure]) {
        throw new Error(
          `RPC Action '${opoMutation.procedure}' is not defined for entity '${opoMutation.entity}'.`
        );
      }
      const actionDef = mapping.actions[opoMutation.procedure];
      const placeholders: string[] = [];

      for (const paramName of actionDef.params) {
        if (opoMutation.payload && opoMutation.payload[paramName] !== undefined) {
          placeholders.push('?');
          params.push(opoMutation.payload[paramName]);
        } else {
          throw new Error(
            `RPC CALL missing required param '${paramName}' for procedure '${opoMutation.procedure}'`
          );
        }
      }

      sql = `CALL ${actionDef.procedure}(${placeholders.join(', ')})`;
      break;
    }
    case 'CREATE': {
      if (!opoMutation.payload || Object.keys(opoMutation.payload).length === 0) {
        throw new Error('CREATE mutation requires a payload');
      }

      const columns: string[] = [];
      const placeholders: string[] = [];

      for (const [key, value] of Object.entries(opoMutation.payload)) {
        const fieldMeta = fields[key];
        if (!fieldMeta) {
          throw new Error(
            `Payload field '${key}' not mapped for entity '${opoMutation.entity}'.`
          );
        }
        const physicalColumn = getFieldColumn(fieldMeta);
        columns.push(physicalColumn);
        placeholders.push('?');
        params.push(value);
      }

      if (context.erp === 'protheus') {
        if (!columns.includes(PROTHEUS_SOFT_DELETE_FIELD)) {
          columns.push(PROTHEUS_SOFT_DELETE_FIELD);
          placeholders.push('?');
          params.push(PROTHEUS_ACTIVE_DELETE_MARKER);
        }
        const filialField = mapping.protheus?.filialField;
        const filial = context.filial;
        if (
          filialField &&
          filial &&
          !columns.includes(filialField)
        ) {
          columns.push(filialField);
          placeholders.push('?');
          params.push(filial);
        }
      }

      sql = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders.join(', ')})`;
      break;
    }
    case 'UPDATE': {
      if (!opoMutation.payload || Object.keys(opoMutation.payload).length === 0) {
        throw new Error('UPDATE mutation requires a payload');
      }
      if (!opoMutation.filter || Object.keys(opoMutation.filter).length === 0) {
        throw new Error('UPDATE mutation requires a filter to prevent mass updates');
      }

      const setClauses: string[] = [];
      for (const [key, value] of Object.entries(opoMutation.payload)) {
        const fieldMeta = fields[key];
        if (!fieldMeta) {
          throw new Error(
            `Payload field '${key}' not mapped for entity '${opoMutation.entity}'.`
          );
        }
        const physicalColumn = getFieldColumn(fieldMeta);
        setClauses.push(`${physicalColumn} = ?`);
        params.push(value);
      }

      const whereParts: string[] = [
        parseFilterNode(
          opoMutation.filter,
          tableName,
          fields,
          params,
          opoMutation.entity,
          dialect
        ),
      ];
      appendMutationGuards(whereParts);
      sql = `UPDATE ${tableName} SET ${setClauses.join(', ')} WHERE ${whereParts.join(' AND ')}`;
      break;
    }
    case 'DELETE': {
      if (!opoMutation.filter || Object.keys(opoMutation.filter).length === 0) {
        throw new Error('DELETE mutation requires a filter to prevent mass deletes');
      }

      const whereParts: string[] = [
        parseFilterNode(
          opoMutation.filter,
          tableName,
          fields,
          params,
          opoMutation.entity,
          dialect
        ),
      ];
      appendMutationGuards(whereParts);

      if (context.erp === 'protheus') {
        sql = `UPDATE ${tableName} SET ${PROTHEUS_SOFT_DELETE_FIELD} = ? WHERE ${whereParts.join(' AND ')}`;
        params.push('*');
      } else {
        sql = `DELETE FROM ${tableName} WHERE ${whereParts.join(' AND ')}`;
      }
      break;
    }
    default:
      throw new Error(`Unsupported mutation action '${opoMutation.action}'`);
  }

  return { sql, params };
}