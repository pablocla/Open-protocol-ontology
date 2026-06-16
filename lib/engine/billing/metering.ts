import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

export interface UsageRecord {
  id: string;
  tenantId: string;
  swarmId: string;
  tokensUsed: number;
  costEstimate: number; // in USD
  createdAt: number;
}

export class MeteringService {
  private db: Database.Database;
  private readonly PRICE_PER_1K_TOKENS = 0.005; // $0.005 per 1k tokens combined

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
      CREATE TABLE IF NOT EXISTS usage_records (
        id TEXT PRIMARY KEY,
        tenantId TEXT NOT NULL,
        swarmId TEXT NOT NULL,
        tokensUsed INTEGER NOT NULL,
        costEstimate REAL NOT NULL,
        createdAt INTEGER NOT NULL
      )
    `);
  }

  public reportUsage(tenantId: string, swarmId: string, tokensUsed: number): void {
    const id = `usage_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const costEstimate = (tokensUsed / 1000) * this.PRICE_PER_1K_TOKENS;
    const createdAt = Date.now();

    const stmt = this.db.prepare('INSERT INTO usage_records (id, tenantId, swarmId, tokensUsed, costEstimate, createdAt) VALUES (?, ?, ?, ?, ?, ?)');
    stmt.run(id, tenantId, swarmId, tokensUsed, costEstimate, createdAt);

    console.log(`[Metering] Reported ${tokensUsed} tokens ($${costEstimate.toFixed(4)}) for tenant ${tenantId} running swarm ${swarmId}.`);
    
    // TODO: In production, this would call Stripe Metering API
    // stripe.billing.meterEvents.create({ event_name: 'swarm_execution', payload: { value: tokensUsed, stripe_customer_id: ... } })
  }

  public getUsageForTenant(tenantId: string): UsageRecord[] {
    const stmt = this.db.prepare('SELECT id, tenantId, swarmId, tokensUsed, costEstimate, createdAt FROM usage_records WHERE tenantId = ? ORDER BY createdAt DESC');
    return stmt.all(tenantId) as UsageRecord[];
  }

  public close(): void {
    this.db.close();
  }
}

// Singleton
let instance: MeteringService;
export function getMeteringService(): MeteringService {
  if (!instance) {
    instance = new MeteringService();
  }
  return instance;
}
