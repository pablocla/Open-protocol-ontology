export type ProtheusDbDriver = 'postgresql' | 'mssql' | 'oracle';

export interface ProtheusDbClient {
  query(sql: string): Promise<{ rows: Record<string, unknown>[] }>;
  close(): Promise<void>;
}

export function detectDriverFromUrl(connectionString: string): ProtheusDbDriver {
  const url = connectionString.trim().toLowerCase();
  if (
    url.startsWith('mssql://') ||
    url.startsWith('sqlserver://') ||
    url.includes('server=') ||
    url.includes('driver={sql server}')
  ) {
    return 'mssql';
  }
  if (
    url.startsWith('oracle://') ||
    url.startsWith('oracledb://') ||
    (url.includes('host=') && url.includes('service_name='))
  ) {
    return 'oracle';
  }
  return 'postgresql';
}

export async function createProtheusDbClient(
  connectionString: string
): Promise<ProtheusDbClient> {
  const driver = detectDriverFromUrl(connectionString);

  if (driver === 'postgresql') {
    let Client: new (config: { connectionString: string }) => {
      connect(): Promise<void>;
      query(sql: string): Promise<{ rows: Record<string, unknown>[] }>;
      end(): Promise<void>;
    };
    try {
      Client = require('pg').Client;
    } catch {
      throw new Error('El paquete "pg" es requerido para conexiones PostgreSQL.');
    }
    const client = new Client({ connectionString });
    await client.connect();
    return {
      query: (sql) => client.query(sql),
      close: () => client.end(),
    };
  }

  if (driver === 'mssql') {
    let sql: {
      connect(config: string): Promise<unknown>;
      query(q: string): Promise<{ recordset: Record<string, unknown>[] }>;
      close(): Promise<void>;
    };
    try {
      sql = require('mssql');
    } catch {
      throw new Error('El paquete "mssql" es requerido para conexiones SQL Server.');
    }
    await sql.connect(connectionString);
    return {
      query: async (q) => {
        const res = await sql.query(q);
        return { rows: res.recordset ?? [] };
      },
      close: () => sql.close(),
    };
  }

  let oracledb: {
    getConnection(
      config: string | { user: string; password: string; connectString: string }
    ): Promise<{
      execute(
        sql: string,
        binds?: unknown[],
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
  return {
    query: async (q) => {
      const res = await conn.execute(q, [], {
        outFormat: oracledb.OUT_FORMAT_OBJECT,
      });
      return { rows: (res.rows as Record<string, unknown>[]) ?? [] };
    },
    close: () => conn.close(),
  };
}