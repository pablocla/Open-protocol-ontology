import {
  createProtheusDbClient,
  detectDriverFromUrl,
  type ProtheusDbDriver,
} from '@/lib/mesh/adapters/totvs/protheusDbClient';
import { isConnectionAllowed } from '@/lib/studio/connectionGuard';

export interface ExecuteSqlOptions {
  connectionString: string;
  sql: string;
  params?: unknown[];
  driver?: ProtheusDbDriver;
}

export interface ExecuteSqlResult {
  rows: Record<string, unknown>[];
  driver: ProtheusDbDriver;
}

function bindSqlForDriver(
  sql: string,
  params: unknown[],
  driver: ProtheusDbDriver
): { sql: string; binds: unknown[] | Record<string, unknown> } {
  if (!params.length) return { sql, binds: [] };

  if (driver === 'postgresql') {
    let i = 0;
    const text = sql.replace(/\?/g, () => `$${++i}`);
    return { sql: text, binds: params };
  }

  if (driver === 'mssql') {
    let i = 0;
    const text = sql.replace(/\?/g, () => `@p${i++}`);
    const binds: Record<string, unknown> = {};
    params.forEach((value, idx) => {
      binds[`p${idx}`] = value;
    });
    return { sql: text, binds };
  }

  let i = 0;
  const text = sql.replace(/\?/g, () => `:p${++i}`);
  const binds: Record<string, unknown> = {};
  params.forEach((value, idx) => {
    binds[`p${idx}`] = value;
  });
  return { sql: text, binds };
}

async function runParameterizedQuery(
  connectionString: string,
  sql: string,
  params: unknown[],
  driver: ProtheusDbDriver
): Promise<Record<string, unknown>[]> {
  const { sql: boundSql, binds } = bindSqlForDriver(sql, params, driver);

  if (driver === 'postgresql') {
    let Client: new (config: { connectionString: string }) => {
      connect(): Promise<void>;
      query(text: string, values?: unknown[]): Promise<{ rows: Record<string, unknown>[] }>;
      end(): Promise<void>;
    };
    try {
      Client = require('pg').Client;
    } catch {
      throw new Error('El paquete "pg" es requerido para conexiones PostgreSQL.');
    }
    const client = new Client({ connectionString });
    await client.connect();
    try {
      const res = await client.query(boundSql, binds as unknown[]);
      return res.rows ?? [];
    } finally {
      await client.end();
    }
  }

  if (driver === 'mssql') {
    let mssql: {
      connect(config: string): Promise<unknown>;
      Request: new () => {
        input(name: string, value: unknown): void;
        query(q: string): Promise<{ recordset: Record<string, unknown>[] }>;
      };
      close(): Promise<void>;
    };
    try {
      mssql = require('mssql');
    } catch {
      throw new Error('El paquete "mssql" es requerido para conexiones SQL Server.');
    }
    await mssql.connect(connectionString);
    try {
      const request = new mssql.Request();
      const namedBinds = binds as Record<string, unknown>;
      for (const [name, value] of Object.entries(namedBinds)) {
        request.input(name, value);
      }
      const res = await request.query(boundSql);
      return res.recordset ?? [];
    } finally {
      await mssql.close();
    }
  }

  let oracledb: {
    getConnection(config: string): Promise<{
      execute(
        sql: string,
        binds?: unknown[] | Record<string, unknown>,
        opts?: { outFormat: number }
      ): Promise<{ rows?: Record<string, unknown>[] }>;
      close(): Promise<void>;
    }>;
    OUT_FORMAT_OBJECT: number;
  };
  try {
    oracledb = require('oracledb');
  } catch {
    throw new Error('El paquete "oracledb" es requerido para conexiones Oracle.');
  }

  const conn = await oracledb.getConnection(connectionString);
  try {
    const res = await conn.execute(boundSql, binds as Record<string, unknown>, {
      outFormat: oracledb.OUT_FORMAT_OBJECT,
    });
    return (res.rows as Record<string, unknown>[]) ?? [];
  } finally {
    await conn.close();
  }
}

export async function executeParameterizedSql(
  options: ExecuteSqlOptions
): Promise<ExecuteSqlResult> {
  const { connectionString, sql, params = [] } = options;
  const driver = options.driver ?? detectDriverFromUrl(connectionString);

  if (!isConnectionAllowed(connectionString, driver)) {
    throw new Error(
      'Destino de conexión no permitido. Configurá OPO_ALLOWED_DB_HOSTS o usá localhost/servidores aprobados.'
    );
  }

  const rows = await runParameterizedQuery(connectionString, sql, params, driver);
  return { rows, driver };
}

/** Convenience wrapper using the shared Protheus DB client factory (non-parameterized fallback). */
export async function executeSqlViaClient(
  connectionString: string,
  sql: string,
  params: unknown[] = []
): Promise<ExecuteSqlResult> {
  if (params.length > 0) {
    return executeParameterizedSql({ connectionString, sql, params });
  }

  const client = await createProtheusDbClient(connectionString);
  try {
    const { rows } = await client.query(sql);
    return { rows, driver: detectDriverFromUrl(connectionString) };
  } finally {
    await client.close();
  }
}