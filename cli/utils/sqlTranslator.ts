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

export function translateOpoToSql(opoQuery: any, dictionary: Dictionary) {
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
        
        // This is a simplified 1-level deep join for the SDK example
        // A production SDK would support infinite recursion.
        const nestedSelect = (value as any).select;
        if (nestedSelect) {
          // Assume the relation is another entity in the dictionary?
          // Or just allow direct physical mapping in a flat dictionary for this prototype
          // To keep it simple, we assume fields are fully qualified in dictionary if they are related
          // OR we could require the mapping to declare the target entity.
          // For now, we will just alias the JSON result or flat map it.
          // In a real scenario, nested objects are constructed via JSON_AGG or similar.
          // For this MVP SDK translator, we'll prefix fields to show capabilities:
          for (const [nKey, nVal] of Object.entries(nestedSelect)) {
             if (nVal) {
               // We fake a column lookup for the prototype
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

  // 2. Process Filters
  const parseFilterNode = (node: any, tableAlias: string): string => {
    let conditions: string[] = [];

    for (const [key, value] of Object.entries(node)) {
      if (key === 'AND') {
        const sub = (value as any[]).map(v => parseFilterNode(v, tableAlias)).join(' AND ');
        conditions.push(`(${sub})`);
      } else if (key === 'OR') {
        const sub = (value as any[]).map(v => parseFilterNode(v, tableAlias)).join(' OR ');
        conditions.push(`(${sub})`);
      } else if (key === 'NOT') {
        conditions.push(`NOT (${parseFilterNode(value, tableAlias)})`);
      } else {
        // It's a field condition
        const physicalColumn = fields[key];
        if (!physicalColumn) throw new Error(`Filter field '${key}' not mapped for entity '${opoQuery.entity}'.`);
        
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
  };

  let whereClause = '';
  if (opoQuery.filter && Object.keys(opoQuery.filter).length > 0) {
    whereClause = 'WHERE ' + parseFilterNode(opoQuery.filter, tableName);
  }

  // 3. Process Pagination
  let limitClause = '';
  if (opoQuery.pagination?.limit) {
    limitClause = `LIMIT ${opoQuery.pagination.limit}`;
  }

  // Compile final SQL
  const sql = `SELECT ${selectClauses.join(', ')}\nFROM ${tableName}\n${joinClauses.join('\n')}\n${whereClause}\n${limitClause}`.trim();

  return { sql, params };
}
