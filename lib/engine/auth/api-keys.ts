import Database from 'better-sqlite3';
import { randomBytes } from 'crypto';
import path from 'path';
import fs from 'fs';

export interface TenantApiKey {
  key: string;
  tenantId: string;
  name: string;
  createdAt: number;
}

export class ApiKeyManager {
  private db: Database.Database;

  constructor() {
    const dbPath = process.env.OPO_DB_PATH || './data/opo.db';
    const dbDir = path.dirname(dbPath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    this.db = new Database(dbPath);
    this.initDb();
  }

  private initDb() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS api_keys (
        key TEXT PRIMARY KEY,
        tenantId TEXT NOT NULL,
        name TEXT NOT NULL,
        createdAt INTEGER NOT NULL
      )
    `);
  }

  public createApiKey(tenantId: string, name: string): string {
    const key = `opo_${randomBytes(24).toString('hex')}`;
    const createdAt = Date.now();
    const stmt = this.db.prepare('INSERT INTO api_keys (key, tenantId, name, createdAt) VALUES (?, ?, ?, ?)');
    stmt.run(key, tenantId, name, createdAt);
    return key;
  }

  public verifyApiKey(key: string): TenantApiKey | null {
    const stmt = this.db.prepare('SELECT key, tenantId, name, createdAt FROM api_keys WHERE key = ?');
    const row = stmt.get(key) as TenantApiKey | undefined;
    return row || null;
  }

  public listKeysForTenant(tenantId: string): TenantApiKey[] {
    const stmt = this.db.prepare('SELECT key, tenantId, name, createdAt FROM api_keys WHERE tenantId = ?');
    return stmt.all(tenantId) as TenantApiKey[];
  }

  public revokeApiKey(key: string): void {
    const stmt = this.db.prepare('DELETE FROM api_keys WHERE key = ?');
    stmt.run(key);
  }

  public close(): void {
    this.db.close();
  }
}

// Singleton
let instance: ApiKeyManager;
export function getApiKeyManager(): ApiKeyManager {
  if (!instance) {
    instance = new ApiKeyManager();
  }
  return instance;
}
