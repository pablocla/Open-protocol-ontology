import {
  normalizeOpoQueryPayload,
  resolvePagination,
  type ResolvedPagination,
} from './pagination';

export interface OpoField {
  column: string;
  type: string;
}

export interface OpoMapping {
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

export interface TranslateOpoToSqlResult {
  sql: string;
  params: unknown[];
  pagination: ResolvedPagination;
}

function parseFilterNode(node: any, tableAlias: string, fields: Record<string, OpoField>, params: any[], opoEntity: string): string {
  let conditions: string[] = [];

  for (const [key, value] of Object.entries(node)) {
    if (key === 'AND') {
      const sub = (value as any[]).map(v => parseFilterNode(v, tableAlias, fields, params, opoEntity)).join(' AND ');
      conditions.push(`(${sub})`);
    } else if (key === 'OR') {
      const sub = (value as any[]).map(v => parseFilterNode(v, tableAlias, fields, params, opoEntity)).join(' OR ');
      conditions.push(`(${sub})`);
    } else if (key === 'NOT') {
      conditions.push(`NOT (${parseFilterNode(value, tableAlias, fields, params, opoEntity)})`);
    } else {
      // It's a field condition
      const fieldMeta = fields[key];
      if (!fieldMeta) throw new Error(`Filter field '${key}' not mapped for entity '${opoEntity}'.`);
      const physicalColumn = typeof fieldMeta === 'string' ? fieldMeta : fieldMeta.column;
      const columnRef = `${tableAlias}.${physicalColumn}`;

      for (const [op, val] of Object.entries(value as any)) {
        // SQL Dialect parameter placeholder
        const placeholder = '?'; // Fallback to ?; can be customized
        switch(op) {
          case 'eq': conditions.push(`${columnRef} = ${placeholder}`); params.push(val); break;
          case 'neq': conditions.push(`${columnRef} != ${placeholder}`); params.push(val); break;
          case 'gt': conditions.push(`${columnRef} > ${placeholder}`); params.push(val); break;
          case 'gte': conditions.push(`${columnRef} >= ${placeholder}`); params.push(val); break;
          case 'lt': conditions.push(`${columnRef} < ${placeholder}`); params.push(val); break;
          case 'lte': conditions.push(`${columnRef} <= ${placeholder}`); params.push(val); break;
          case 'like': conditions.push(`${columnRef} LIKE ${placeholder}`); params.push(val); break;
          case 'in': 
            const placeholders = (val as any[]).map(() => placeholder).join(', ');
            conditions.push(`${columnRef} IN (${placeholders})`);
            params.push(...(val as any[]));
            break;
          default: throw new Error(`Unsupported operator '${op}'`);
        }
      }
    }
  }
  return conditions.join(' AND ');
}

export function translateOpoToSql(opoQuery: any, dictionary: Dictionary): TranslateOpoToSqlResult {
  opoQuery = normalizeOpoQueryPayload(opoQuery);
  const pagination = resolvePagination(opoQuery);

  const mapping = dictionary[opoQuery.entity];
  if (!mapping) {
    throw new Error(`Entity '${opoQuery.entity}' not found in mapping dictionary.`);
  }

  const tableName = mapping.tableName;
  const fields = mapping.fields;
  const joins = mapping.joins;
  const security = mapping.security;

  let params: any[] = [];
  let selectClauses: string[] = [];
  let joinClauses: string[] = [];

  // 1. Process Select and Joins
  if (opoQuery.select) {
    for (const [key, value] of Object.entries(opoQuery.select)) {
      if (typeof value === 'boolean' && value) {
        // Primitive field
        const fieldMeta = fields[key];
        if (!fieldMeta) throw new Error(`Field '${key}' not mapped for entity '${opoQuery.entity}'.`);
        const physicalColumn = typeof fieldMeta === 'string' ? fieldMeta : fieldMeta.column;
        selectClauses.push(`${tableName}.${physicalColumn} AS "${key}"`);
      } else if (typeof value === 'object' && value !== null) {
        // Relation / Nested Select
        if (!joins || !joins[key]) {
          throw new Error(`Join '${key}' not mapped for entity '${opoQuery.entity}'.`);
        }
        const relation = joins[key];
        joinClauses.push(`LEFT JOIN ${relation.tableName} ON ${relation.on}`);

        const nestedSelect = (value as any).select;
        if (nestedSelect) {
          for (const [nKey, nVal] of Object.entries(nestedSelect)) {
            if (nVal) {
              selectClauses.push(`${relation.tableName}.${nKey.toUpperCase()} AS "${key}_${nKey}"`);
            }
          }
        }
      }
    }
  }

  if (selectClauses.length === 0) {
    selectClauses.push(`${tableName}.*`);
  }

  let filterConditions: string[] = [];
  
  if (opoQuery.filter && Object.keys(opoQuery.filter).length > 0) {
    filterConditions.push(parseFilterNode(opoQuery.filter, tableName, fields, params, opoQuery.entity));
  }

  // Inject Row-Level Security if schema dictates it
  if (security?.rowLevelPolicy && opoQuery.context) {
    const { field, contextKey } = security.rowLevelPolicy;
    const contextValue = opoQuery.context[contextKey];
    if (contextValue !== undefined) {
      filterConditions.push(`${tableName}.${field} = ?`);
      params.push(contextValue);
    } else {
      throw new Error(`Security Exception: Context missing required key '${contextKey}' for Row-Level Security.`);
    }
  } else if (security?.rowLevelPolicy && !opoQuery.context) {
    throw new Error(`Security Exception: RLS Policy exists but no context was provided in the query.`);
  }

  let whereClause = '';
  if (filterConditions.length > 0) {
    whereClause = 'WHERE ' + filterConditions.join(' AND ');
  }

  // 3. Pagination — default LIMIT 50, max 100, fetch limit+1 for hasNextPage detection
  const limitClause = `LIMIT ${pagination.fetchLimit}`;
  const offsetClause = pagination.offset > 0 ? `OFFSET ${pagination.offset}` : '';

  const sql = `SELECT ${selectClauses.join(', ')}\nFROM ${tableName}\n${joinClauses.join('\n')}\n${whereClause}\n${limitClause}${offsetClause ? ` ${offsetClause}` : ''}`.trim();

  return { sql, params, pagination };
}

export function translateOpoMutationToSql(opoMutation: any, dictionary: Dictionary) {
  const mapping = dictionary[opoMutation.entity];
  if (!mapping) {
    throw new Error(`Entity '${opoMutation.entity}' not found in mapping dictionary.`);
  }

  const tableName = mapping.tableName;
  const fields = mapping.fields;

  let params: any[] = [];
  let sql = '';

  // Inject Row-Level Security for Mutations
  if (mapping.security?.rowLevelPolicy && !opoMutation.context) {
    throw new Error(`Security Exception: RLS Policy exists but no context was provided in the mutation.`);
  }

  switch (opoMutation.action) {
    case 'CALL': {
      if (!mapping.actions || !mapping.actions[opoMutation.procedure]) {
        throw new Error(`RPC Action '${opoMutation.procedure}' is not defined for entity '${opoMutation.entity}'.`);
      }
      const actionDef = mapping.actions[opoMutation.procedure];
      const placeholders: string[] = [];
      
      for (const paramName of actionDef.params) {
        if (opoMutation.payload && opoMutation.payload[paramName] !== undefined) {
          placeholders.push('?');
          params.push(opoMutation.payload[paramName]);
        } else {
          throw new Error(`RPC CALL missing required param '${paramName}' for procedure '${opoMutation.procedure}'`);
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
        if (!fieldMeta) throw new Error(`Payload field '${key}' not mapped for entity '${opoMutation.entity}'.`);
        const physicalColumn = typeof fieldMeta === 'string' ? fieldMeta : fieldMeta.column;
        
        columns.push(physicalColumn);
        placeholders.push('?');
        params.push(value);
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
        if (!fieldMeta) throw new Error(`Payload field '${key}' not mapped for entity '${opoMutation.entity}'.`);
        const physicalColumn = typeof fieldMeta === 'string' ? fieldMeta : fieldMeta.column;
        
        setClauses.push(`${physicalColumn} = ?`);
        params.push(value);
      }

      const whereClause = parseFilterNode(opoMutation.filter, tableName, fields, params, opoMutation.entity);
      sql = `UPDATE ${tableName} SET ${setClauses.join(', ')} WHERE ${whereClause}`;
      break;
    }
    case 'DELETE': {
      if (!opoMutation.filter || Object.keys(opoMutation.filter).length === 0) {
        throw new Error('DELETE mutation requires a filter to prevent mass deletes');
      }

      const whereClause = parseFilterNode(opoMutation.filter, tableName, fields, params, opoMutation.entity);
      sql = `DELETE FROM ${tableName} WHERE ${whereClause}`;
      break;
    }
    default:
      throw new Error(`Unsupported mutation action '${opoMutation.action}'`);
  }

  return { sql, params };
}
