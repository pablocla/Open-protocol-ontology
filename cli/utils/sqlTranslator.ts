const DEFAULT_QUERY_LIMIT = 50;
const MAX_QUERY_LIMIT = 100;

function decodeCursor(cursor?: string | null): number {
  if (!cursor || typeof cursor !== 'string') return 0;
  try {
    const json = Buffer.from(cursor, 'base64url').toString('utf8');
    const parsed = JSON.parse(json) as { o?: number; offset?: number };
    const o = Number(parsed?.o ?? parsed?.offset ?? 0);
    return Number.isFinite(o) && o >= 0 ? Math.floor(o) : 0;
  } catch {
    return 0;
  }
}

function resolvePagination(opoQuery: any) {
  const rawLimit = opoQuery?.limit ?? opoQuery?.pagination?.limit;
  const appliedDefault = rawLimit === undefined || rawLimit === null;
  let limit = appliedDefault ? DEFAULT_QUERY_LIMIT : Number(rawLimit);
  if (!Number.isFinite(limit) || limit < 1) limit = DEFAULT_QUERY_LIMIT;
  limit = Math.min(Math.floor(limit), MAX_QUERY_LIMIT);
  const offset = decodeCursor(opoQuery?.pagination?.cursor);
  return { limit, offset, fetchLimit: limit + 1, appliedDefault };
}

export interface Dictionary {
  [entityName: string]: {
    tableName: string;
    fields: { [semanticField: string]: string };
    joins?: {
      [relationName: string]: {
        tableName: string;
        on: string;
      };
    };
  };
}

function parseFilterNode(node: any, tableAlias: string, fields: { [semanticField: string]: string }, params: any[], opoEntity: string): string {
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
      const physicalColumn = fields[key];
      if (!physicalColumn) throw new Error(`Filter field '${key}' not mapped for entity '${opoEntity}'.`);
      
      const columnRef = `${tableAlias}.${physicalColumn}`;
      
      for (const [op, val] of Object.entries(value as any)) {
        switch(op) {
          case 'eq': conditions.push(`${columnRef} = ?`); params.push(val); break;
          case 'neq': conditions.push(`${columnRef} != ?`); params.push(val); break;
          case 'gt': conditions.push(`${columnRef} > ?`); params.push(val); break;
          case 'gte': conditions.push(`${columnRef} >= ?`); params.push(val); break;
          case 'lt': conditions.push(`${columnRef} < ?`); params.push(val); break;
          case 'lte': conditions.push(`${columnRef} <= ?`); params.push(val); break;
          case 'like': conditions.push(`${columnRef} LIKE ?`); params.push(val); break;
          case 'in': 
            const placeholders = (val as any[]).map(() => '?').join(', ');
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

export function translateOpoToSql(opoQuery: any, dictionary: Dictionary) {
  if (opoQuery?.query && typeof opoQuery.query === 'object') {
    opoQuery = opoQuery.query;
  }
  const pagination = resolvePagination(opoQuery);

  const entityDict = dictionary[opoQuery.entity];
  if (!entityDict) {
    throw new Error(`Entity '${opoQuery.entity}' not found in mapping dictionary.`);
  }

  const { tableName, fields, joins } = entityDict;
  let params: any[] = [];
  let selectClauses: string[] = [];
  let joinClauses: string[] = [];
  
  // 1. Process Select and Joins
  if (opoQuery.select) {
    for (const [key, value] of Object.entries(opoQuery.select)) {
      if (typeof value === 'boolean' && value) {
        // Primitive field
        const physicalColumn = fields[key];
        if (!physicalColumn) throw new Error(`Field '${key}' not mapped for entity '${opoQuery.entity}'.`);
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

  let whereClause = '';
  if (opoQuery.filter && Object.keys(opoQuery.filter).length > 0) {
    whereClause = 'WHERE ' + parseFilterNode(opoQuery.filter, tableName, fields, params, opoQuery.entity);
  }

  const limitClause = `LIMIT ${pagination.fetchLimit}`;
  const offsetClause = pagination.offset > 0 ? `OFFSET ${pagination.offset}` : '';

  const sql = `SELECT ${selectClauses.join(', ')}\nFROM ${tableName}\n${joinClauses.join('\n')}\n${whereClause}\n${limitClause}${offsetClause ? ` ${offsetClause}` : ''}`.trim();

  return { sql, params, pagination };
}

export function translateOpoMutationToSql(opoMutation: any, dictionary: Dictionary) {
  const entityDict = dictionary[opoMutation.entity];
  if (!entityDict) {
    throw new Error(`Entity '${opoMutation.entity}' not found in mapping dictionary.`);
  }

  const { tableName, fields } = entityDict;
  let params: any[] = [];
  let sql = '';

  switch (opoMutation.action) {
    case 'CREATE': {
      if (!opoMutation.payload || Object.keys(opoMutation.payload).length === 0) {
        throw new Error('CREATE mutation requires a payload');
      }
      
      const columns: string[] = [];
      const placeholders: string[] = [];

      for (const [key, value] of Object.entries(opoMutation.payload)) {
        const physicalColumn = fields[key];
        if (!physicalColumn) throw new Error(`Payload field '${key}' not mapped for entity '${opoMutation.entity}'.`);
        
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
        const physicalColumn = fields[key];
        if (!physicalColumn) throw new Error(`Payload field '${key}' not mapped for entity '${opoMutation.entity}'.`);
        
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
