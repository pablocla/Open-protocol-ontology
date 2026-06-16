import Database from 'better-sqlite3';
import { randomBytes, createCipheriv, createDecipheriv } from 'crypto';
import { CredentialKey, VaultEntry } from '../types/credentials';
import path from 'path';
import fs from 'fs';

const ALGORITHM = 'aes-256-gcm';

export class CredentialVault {
  private db: Database.Database;
  private secretKey: Buffer;

  constructor() {
    const dbPath = process.env.OPO_DB_PATH || './data/opo.db';
    const dbDir = path.dirname(dbPath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    this.db = new Database(dbPath);

    let secretHex = process.env.OPO_VAULT_SECRET;
    if (!secretHex) {
      // GROK FIX for critical #4: persist secret to workspace file so AES keys survive server restarts/HMR (env optional for dev)
      const secretPath = path.join(dbDir, '.vault_secret');
      try {
        if (fs.existsSync(secretPath)) {
          secretHex = fs.readFileSync(secretPath, 'utf8').trim();
        } else {
          secretHex = randomBytes(32).toString('hex');
          fs.writeFileSync(secretPath, secretHex, { mode: 0o600 });
          console.log('[CredentialVault] Generated and persisted new vault secret to .vault_secret (set OPO_VAULT_SECRET in prod to override)');
        }
      } catch (e) {
        throw new Error('OPO_VAULT_SECRET not set and failed to read/write persistent .vault_secret in data dir. Set OPO_VAULT_SECRET (64 hex chars) for secure credential storage across restarts.');
      }
    }
    if (!secretHex || secretHex.length !== 64) {
      throw new Error('OPO_VAULT_SECRET must be a 64-character hex string (32 bytes).');
    }
    this.secretKey = Buffer.from(secretHex, 'hex');

    this.initDb();
  }

  private initDb() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS credentials (
        id TEXT PRIMARY KEY,
        provider TEXT NOT NULL,
        name TEXT NOT NULL,
        encryptedValue TEXT NOT NULL,
        iv TEXT NOT NULL,
        createdAt INTEGER NOT NULL
      )
    `);
  }

  private encrypt(text: string): { encryptedValue: string, iv: string } {
    const iv = randomBytes(16);
    const cipher = createCipheriv(ALGORITHM, this.secretKey, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag();
    
    // Store authTag with encrypted value to ensure integrity in GCM mode
    return {
      encryptedValue: encrypted + ':' + authTag.toString('hex'),
      iv: iv.toString('hex')
    };
  }

  private decrypt(encryptedData: string, ivHex: string): string {
    const parts = encryptedData.split(':');
    if (parts.length !== 2) throw new Error('Invalid encrypted data format');
    
    const encryptedText = parts[0];
    const authTag = Buffer.from(parts[1], 'hex');
    const iv = Buffer.from(ivHex, 'hex');
    
    const decipher = createDecipheriv(ALGORITHM, this.secretKey, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  public storeKey(provider: 'openai' | 'gemini' | 'anthropic', name: string, apiKey: string): string {
    const id = `key_${randomBytes(8).toString('hex')}`;
    const { encryptedValue, iv } = this.encrypt(apiKey);
    const createdAt = Date.now();

    const stmt = this.db.prepare('INSERT INTO credentials (id, provider, name, encryptedValue, iv, createdAt) VALUES (?, ?, ?, ?, ?, ?)');
    stmt.run(id, provider, name, encryptedValue, iv, createdAt);
    
    return id;
  }

  public getKey(id: string): string {
    const stmt = this.db.prepare('SELECT encryptedValue, iv FROM credentials WHERE id = ?');
    const row = stmt.get(id) as { encryptedValue: string, iv: string } | undefined;
    
    if (!row) throw new Error(`Credential key with ID ${id} not found.`);
    return this.decrypt(row.encryptedValue, row.iv);
  }

  public listKeys(): CredentialKey[] {
    const stmt = this.db.prepare('SELECT id, provider, name, createdAt FROM credentials');
    return stmt.all() as CredentialKey[];
  }

  public deleteKey(id: string): void {
    const stmt = this.db.prepare('DELETE FROM credentials WHERE id = ?');
    stmt.run(id);
  }

  public close(): void {
    this.db.close();
  }
}
