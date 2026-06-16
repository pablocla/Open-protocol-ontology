import { NextResponse } from 'next/server';
import { isConnectionAllowed } from '@/lib/studio/connectionGuard';

// OPO Type mapping from SQL physical types
const SQL_TO_OPO_TYPE: Record<string, string> = {
  // Integers
  'int': 'Int', 'integer': 'Int', 'smallint': 'Int', 'bigint': 'Int',
  'tinyint': 'Int', 'mediumint': 'Int', 'serial': 'Int', 'bigserial': 'Int', 'number': 'Int',
  // Floats
  'float': 'Float', 'double': 'Float', 'double precision': 'Float', 'decimal': 'Float', 'numeric': 'Float',
  'real': 'Float', 'money': 'Float', 'smallmoney': 'Float', 'float4': 'Float', 'float8': 'Float',
  // Booleans
  'boolean': 'Boolean', 'bool': 'Boolean', 'bit': 'Boolean',
  // DateTime
  'date': 'DateTime', 'datetime': 'DateTime', 'datetime2': 'DateTime',
  'timestamp': 'DateTime', 'timestamptz': 'DateTime', 'timestamp without time zone': 'DateTime', 'timestamp with time zone': 'DateTime',
  'time': 'DateTime', 'datetimeoffset': 'DateTime',
  // Strings (default)
  'varchar': 'String', 'nvarchar': 'String', 'char': 'String', 'text': 'String',
  'ntext': 'String', 'clob': 'String', 'blob': 'String', 'json': 'String',
  'jsonb': 'String', 'xml': 'String', 'uuid': 'String', 'bytea': 'String',
  'inet': 'String', 'cidr': 'String', 'macaddr': 'String', 'character varying': 'String', 'character': 'String', 'name': 'String'
};

function mapSqlType(sqlType: string): string {
  if (!sqlType) return 'String';
  const normalized = sqlType.split('(')[0].toLowerCase().trim(); // handle varchar(255)
  return SQL_TO_OPO_TYPE[normalized] || 'String';
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      driver = 'postgresql',
      connectionString,
      filePath,
      tableFilter,
      protheusMode = 'incremental',
      companySuffix = '010',
      simulateDelta = false,
      baseUrl,
    } = body;

    // TOTVS Protheus: baseline pre-armado + scan incremental de deltas SX
    if (driver === 'totvs-protheus') {
      const {
        getProtheusBaselineManifest,
        discoverProtheusOntologyIncremental,
        manifestToDiscoverEntities,
        manifestToCanvasGraph,
        buildProtheusSemanticAccessPlan,
      } = await import('@/lib/mesh/adapters/totvs');

      if (protheusMode === 'baseline') {
        const manifest = getProtheusBaselineManifest();
        const graph = manifestToCanvasGraph(manifest);
        return NextResponse.json({
          success: true,
          mode: 'baseline',
          entities: manifestToDiscoverEntities(manifest),
          manifest,
          graph,
          accessPlan: buildProtheusSemanticAccessPlan(manifest, { baseUrl }),
          summary: `Ontología baseline Protheus v${manifest.dictionary_meta.baseline_version}: ${manifest.supported_entities.length} entidades, ${manifest.relationships.length} relaciones SX9.`,
        });
      }

      const needsConnection = protheusMode === 'incremental' && !simulateDelta;
      if (needsConnection && !connectionString) {
        return NextResponse.json({
          success: false,
          error: 'Para scan incremental real necesitás connectionString. Usá simulateDelta:true para demo sin BD.',
        }, { status: 400 });
      }

      const result = await discoverProtheusOntologyIncremental(
        {
          mode: simulateDelta ? 'mock' : 'database',
          connectionString,
          companySuffix,
          tableFilter,
          simulateDelta: !!simulateDelta,
        },
        { baseUrl, organizationName: body.organizationName }
      );

      const graph = manifestToCanvasGraph(result.mergedManifest, result.delta);

      return NextResponse.json({
        success: true,
        mode: protheusMode,
        entities: manifestToDiscoverEntities(result.mergedManifest, result.delta),
        manifest: result.mergedManifest,
        graph,
        delta: result.delta,
        accessPlan: buildProtheusSemanticAccessPlan(result.mergedManifest, {
          baseUrl,
          sqlConnection: connectionString,
        }),
        summary: result.delta.hasChanges
          ? `Baseline + delta: ${result.delta.newTables.length} tabla(s) nueva(s), ${result.delta.newFields.length} campo(s), ${result.delta.newRelationships.length} relación(es) SX9.`
          : `Sin cambios respecto al baseline v${result.delta.baselineVersion}. Instalación estándar.`,
      });
    }

    if (!connectionString && !filePath) {
      return NextResponse.json({ success: false, error: 'Missing connectionString or filePath parameter.' }, { status: 400 });
    }

    // GROK FIX 3B (risk): basic SSRF / malicious host guard. In prod set OPO_ALLOWED_DB_HOSTS=localhost,127.0.0.1,your-db.company.internal
    if (!isConnectionAllowed(connectionString || filePath || '', driver)) {
      return NextResponse.json({ success: false, error: 'Connection target not allowed. Configure OPO_ALLOWED_DB_HOSTS env or use localhost/approved hosts only.' }, { status: 403 });
    }

    let entities: any[] = [];
    let summaryCount = 0;

    switch (driver) {
      case 'postgresql': {
        let Client;
        try { Client = require('pg').Client; } catch (e) { throw new Error('El módulo "pg" no está instalado.'); }
        const client = new Client({ connectionString, connectionTimeoutMillis: 8000 });
        await client.connect();
        
        const q = `
          SELECT 
            c.table_name, c.column_name, c.data_type, c.is_nullable, c.column_default,
            c.character_maximum_length as length,
            c.numeric_precision as precision,
            c.numeric_scale as scale,
            pgd.description as comment,
            CASE WHEN pk.column_name IS NOT NULL THEN true ELSE false END as is_primary_key
          FROM information_schema.columns c
          LEFT JOIN (
            SELECT kcu.table_name, kcu.column_name
            FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
            WHERE tc.constraint_type = 'PRIMARY KEY' AND tc.table_schema = 'public'
          ) pk ON c.table_name = pk.table_name AND c.column_name = pk.column_name
          LEFT JOIN pg_catalog.pg_statio_all_tables st ON st.relname = c.table_name
          LEFT JOIN pg_catalog.pg_description pgd ON pgd.objoid = st.relid AND pgd.objsubid = c.ordinal_position
          WHERE c.table_schema = 'public'
          ORDER BY c.table_name, c.ordinal_position;
        `;
        const res = await client.query(q);
        await client.end();
        summaryCount = res.rows.length;
        entities = processRows(res.rows, 'table_name', 'column_name', 'data_type', 'is_nullable', 'is_primary_key', 'length', 'precision', 'scale', 'comment');
        break;
      }
      case 'mysql':
      case 'mariadb': {
        let mysql;
        try { mysql = require('mysql2/promise'); } catch (e) { throw new Error('El módulo "mysql2" no está instalado.'); }
        const conn = await mysql.createConnection(connectionString);
        
        const q = `
          SELECT 
            TABLE_NAME as table_name, COLUMN_NAME as column_name, DATA_TYPE as data_type, IS_NULLABLE as is_nullable,
            CHARACTER_MAXIMUM_LENGTH as length,
            NUMERIC_PRECISION as precision,
            NUMERIC_SCALE as scale,
            COLUMN_COMMENT as comment,
            CASE WHEN COLUMN_KEY = 'PRI' THEN true ELSE false END as is_primary_key
          FROM information_schema.COLUMNS
          WHERE TABLE_SCHEMA = DATABASE()
          ORDER BY TABLE_NAME, ORDINAL_POSITION;
        `;
        const [rows] = await conn.execute(q);
        await conn.end();
        summaryCount = (rows as any[]).length;
        entities = processRows(rows as any[], 'table_name', 'column_name', 'data_type', 'is_nullable', 'is_primary_key', 'length', 'precision', 'scale', 'comment');
        break;
      }
      case 'mssql': {
        let sql;
        try { sql = require('mssql'); } catch (e) { throw new Error('El módulo "mssql" no está instalado.'); }
        await sql.connect(connectionString);
        
        const q = `
          SELECT 
            t.name AS table_name, c.name AS column_name, ty.name AS data_type, 
            CASE WHEN c.is_nullable = 1 THEN 'YES' ELSE 'NO' END AS is_nullable,
            c.max_length as length,
            c.precision as precision,
            c.scale as scale,
            ep.value as comment,
            CASE WHEN ic.column_id IS NOT NULL THEN true ELSE false END AS is_primary_key
          FROM sys.tables t
          JOIN sys.columns c ON t.object_id = c.object_id
          JOIN sys.types ty ON c.user_type_id = ty.user_type_id
          LEFT JOIN sys.indexes i ON t.object_id = i.object_id AND i.is_primary_key = 1
          LEFT JOIN sys.index_columns ic ON i.object_id = ic.object_id AND i.index_id = ic.index_id AND c.column_id = ic.column_id
          LEFT JOIN sys.extended_properties ep ON ep.major_id = t.object_id AND ep.minor_id = c.column_id AND ep.name = 'MS_Description'
          ORDER BY t.name, c.column_id;
        `;
        const res = await sql.query(q);
        await sql.close();
        summaryCount = res.recordset.length;
        entities = processRows(res.recordset, 'table_name', 'column_name', 'data_type', 'is_nullable', 'is_primary_key', 'length', 'precision', 'scale', 'comment');
        break;
      }
      case 'oracle': {
        let oracledb;
        try { oracledb = require('oracledb'); } catch (e) { throw new Error('El módulo "oracledb" no está instalado.'); }
        // For oracle, connectionString usually requires separate user/pass/connectString. We'll attempt a generic connect if provided, or expect them in the body.
        const conn = await oracledb.getConnection(body.user && body.password ? {
           user: body.user, password: body.password, connectString: connectionString
        } : connectionString);
        
        const q = `
          SELECT 
            utc.TABLE_NAME as table_name, utc.COLUMN_NAME as column_name, utc.DATA_TYPE as data_type,
            utc.NULLABLE as is_nullable,
            utc.DATA_LENGTH as length,
            utc.DATA_PRECISION as precision,
            utc.DATA_SCALE as scale,
            ucc.comments as comment,
            CASE WHEN uc.CONSTRAINT_NAME IS NOT NULL THEN 1 ELSE 0 END AS is_primary_key
          FROM USER_TAB_COLUMNS utc
          LEFT JOIN USER_COL_COMMENTS ucc ON utc.TABLE_NAME = ucc.TABLE_NAME AND utc.COLUMN_NAME = ucc.COLUMN_NAME
          LEFT JOIN USER_CONS_COLUMNS ucons ON utc.TABLE_NAME = ucons.TABLE_NAME AND utc.COLUMN_NAME = ucons.COLUMN_NAME
          LEFT JOIN USER_CONSTRAINTS uc ON ucons.CONSTRAINT_NAME = uc.CONSTRAINT_NAME AND uc.CONSTRAINT_TYPE = 'P'
          ORDER BY utc.TABLE_NAME, utc.COLUMN_ID
        `;
        const res = await conn.execute(q, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
        await conn.close();
        summaryCount = res.rows?.length || 0;
        // Map 1/0 to true/false for is_primary_key
        const mappedRows = (res.rows || []).map((r: any) => ({ ...r, is_primary_key: r.IS_PRIMARY_KEY === 1 }));
        entities = processRows(mappedRows, 'TABLE_NAME', 'COLUMN_NAME', 'DATA_TYPE', 'IS_NULLABLE', 'is_primary_key', 'length', 'precision', 'scale', 'comment');
        break;
      }
      case 'sqlite': {
        let Database;
        try { Database = require('better-sqlite3'); } catch (e) { throw new Error('El módulo "better-sqlite3" no está instalado.'); }
        const db = new Database(filePath || connectionString, { readonly: true });
        
        const tables = db.pragma('table_list') as any[];
        const allColumns = [];
        
        for (const t of tables) {
          if (t.name.startsWith('sqlite_')) continue;
          const cols = db.pragma(`table_info('${t.name}')`) as any[];
          for (const c of cols) {
            allColumns.push({
              table_name: t.name,
              column_name: c.name,
              data_type: c.type,
              is_nullable: c.notnull === 0 ? 'YES' : 'NO',
              is_primary_key: c.pk > 0,
              length: null, // SQLite pragma doesn't expose length easily
              precision: null,
              scale: null,
              comment: null
            });
          }
        }
        db.close();
        summaryCount = allColumns.length;
        entities = processRows(allColumns, 'table_name', 'column_name', 'data_type', 'is_nullable', 'is_primary_key', 'length', 'precision', 'scale', 'comment');
        break;
      }
      default:
        throw new Error(`Driver "${driver}" no soportado.`);
    }

    // Profile data volumes so the AI (semantic router, agents, swarms) can see which tables have many records (core structures to model in OPO ontology) vs low-volume (config/params).
    // Uses fast DB stats (not full COUNT(*) for performance on large Protheus-like DBs). For Protheus: SX2/SX3 give table/field dict, SX6 params; row counts help prioritize transactional tables.
    // General for any DB: high rowCount tables are likely important business entities.
    const rowCounts = await getRowCounts(driver, connectionString, filePath, body);
    entities = entities.map(e => ({
      ...e,
      rowCount: rowCounts[e.originalTable?.toLowerCase()] || rowCounts[e.name?.toLowerCase()] || 0
    }));

    if (entities.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'No se encontraron tablas. ¿La BD tiene tablas creadas?' 
      });
    }

    // GROK FIX 2A: apply client-provided tableFilter (glob style SF*, SA*, customer*) so giant DBs (2000+ tables like Protheus) don't hang/timeout
    let filteredEntities = entities;
    if (tableFilter && typeof tableFilter === 'string' && tableFilter.trim()) {
      const patterns = tableFilter.split(',').map((p: string) => p.trim().toLowerCase().replace(/\*/g, '.*'));
      const regexes = patterns.map((p: string) => new RegExp('^' + p + '$', 'i'));
      filteredEntities = entities.filter((e: any) => {
        const tbl = (e.originalTable || e.name || '').toLowerCase();
        return regexes.some((re: RegExp) => re.test(tbl));
      });
    }

    // Re-profile only the filtered set if we have a filter (saves time on huge DBs)
    let finalEntities = filteredEntities;
    if (tableFilter && filteredEntities.length > 0) {
      try {
        const filteredTableNames = filteredEntities.map((e: any) => e.originalTable).filter(Boolean);
        const filteredCounts = await getRowCounts(driver, connectionString, filePath || '', body, filteredTableNames);
        finalEntities = filteredEntities.map((e: any) => ({
          ...e,
          rowCount: filteredCounts[(e.originalTable || '').toLowerCase()] ?? e.rowCount ?? 0
        }));
      } catch (e) { /* non fatal */ }
    }

    const highVolume = finalEntities.filter(e => (e.rowCount || 0) > 10000).length;
    return NextResponse.json({ 
      success: true, 
      entities: finalEntities,
      summary: `Escaneadas ${finalEntities.length} tabla(s) con ${summaryCount} columna(s) total usando driver ${driver}. ${highVolume} tablas de alto volumen (>10k registros) priorizadas para estructuras core.${tableFilter ? ` (filtro: ${tableFilter})` : ''}`
    });

  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      error: `Error interno: ${error.message}` 
    }, { status: 500 });
  }
}

// Helper para agrupar filas de BD en entidades OPO
function processRows(rows: any[], tableField: string, colField: string, typeField: string, nullField: string, pkField: string, lengthField: string = 'length', precisionField: string = 'precision', scaleField: string = 'scale', commentField: string = 'comment') {
  const tables: Record<string, any[]> = {};
  for (const row of rows) {
    const tName = row[tableField];
    if (!tables[tName]) tables[tName] = [];
    tables[tName].push(row);
  }

  return Object.entries(tables).map(([tableName, columns]) => {
    // PascalCase
    const entityName = tableName.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('');
    
    const attributes = columns.map((col, idx) => {
      const isPk = col[pkField];
      const isNullStr = String(col[nullField] || '').toUpperCase();
      const isReq = isNullStr === 'NO' || isNullStr === 'N';
      return {
        id: `attr-${Date.now()}-${idx}-${Math.floor(Math.random() * 1000)}`,
        name: col[colField],
        type: mapSqlType(col[typeField]),
        isPrimaryKey: !!isPk,
        isRequired: isReq,
        isUnique: !!isPk,
        length: col[lengthField] ? parseInt(col[lengthField]) : undefined,
        precision: col[precisionField] ? parseInt(col[precisionField]) : undefined,
        scale: col[scaleField] ? parseInt(col[scaleField]) : undefined,
        comment: col[commentField] || undefined,
      };
    });

    return {
      name: entityName,
      originalTable: tableName,
      description: `Auto-discovered from table "${tableName}"`,
      attributes,
      rowCount: 0 // will be filled by profiling
    };
  });
}

// Data volume profiler: gets approximate row counts efficiently (stats, not full COUNT for large Protheus-like DBs)
// AI/agents use this to see which tables have more records (core transactional) vs low (config/params like SX6)
// and prioritize structures for ontology modeling.
async function getRowCounts(driver: string, connectionString: string, filePath: string, body: any, knownTables: string[] = []): Promise<Record<string, number>> {
  const counts: Record<string, number> = {};
  try {
    if (driver === 'postgresql') {
      let Client = require('pg').Client;
      const client = new Client({ connectionString });
      await client.connect();
      const q = `SELECT relname as table_name, reltuples::bigint as row_count FROM pg_class WHERE relkind='r' AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname='public')`;
      const res = await client.query(q);
      await client.end();
      res.rows.forEach((r: any) => { counts[r.table_name.toLowerCase()] = r.row_count; });
    } else if (driver === 'mssql') {
      let sql = require('mssql');
      await sql.connect(connectionString);
      const q = `SELECT t.name AS table_name, SUM(p.rows) AS row_count FROM sys.tables t JOIN sys.indexes i ON t.object_id = i.object_id JOIN sys.partitions p ON i.object_id = p.object_id AND i.index_id = p.index_id WHERE i.index_id <= 1 GROUP BY t.name`;
      const res = await sql.query(q);
      await sql.close();
      res.recordset.forEach((r: any) => { counts[r.table_name.toLowerCase()] = r.row_count; });
    } else if (driver === 'mysql' || driver === 'mariadb') {
      let mysql = require('mysql2/promise');
      const conn = await mysql.createConnection(connectionString);
      const [rows] = await conn.execute(`SELECT TABLE_NAME as table_name, TABLE_ROWS as row_count FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE()`);
      await conn.end();
      (rows as any[]).forEach(r => { counts[r.table_name.toLowerCase()] = r.row_count || 0; });
    } else if (driver === 'oracle') {
      let oracledb = require('oracledb');
      const conn = await oracledb.getConnection(body.user && body.password ? { user: body.user, password: body.password, connectString: connectionString } : connectionString);
      const res = await conn.execute(`SELECT table_name, num_rows FROM user_tables`, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
      await conn.close();
      (res.rows || []).forEach((r: any) => { counts[r.TABLE_NAME.toLowerCase()] = r.NUM_ROWS || 0; });
    } else if (driver === 'sqlite') {
      let Database = require('better-sqlite3');
      const db = new Database(filePath || connectionString, { readonly: true });
      const tables = db.pragma('table_list') as any[];
      for (const t of tables) {
        if (t.name.startsWith('sqlite_')) continue;
        const countRow = db.prepare(`SELECT COUNT(*) as c FROM "${t.name}"`).get() as any;
        counts[t.name.toLowerCase()] = countRow.c;
      }
      db.close();
    }
  } catch (e) {
    console.warn('[Discover] Row count profiling failed (non-fatal):', (e as any).message);
  }
  return counts;
}


