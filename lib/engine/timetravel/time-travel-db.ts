import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { SwarmMemorySnapshot } from '../types/blackboard';

/**
 * TimeTravelDB
 * Persistent snapshot storage for the OPO Cognitive Mesh Time-Travel Debugger.
 * 
 * // GROK OPTIMIZATION: Extracted from inline definition in the timeline route.
 * Provides indexes for fast session lookups + automatic pruning of obsolete snapshots
 * to prevent unbounded local DB growth (addresses FASE 2 requirement).
 */
export class TimeTravelDB {
  private db: Database.Database;
  private readonly MAX_SNAPSHOTS_PER_SESSION = 40; // Keep last N for UX sanity

  constructor() {
    const dbPath = process.env.OPO_TIMETRAVEL_DB_PATH || './data/timetravel.db';
    const dbDir = path.dirname(dbPath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    this.db = new Database(dbPath);

    this.initSchema();
  }

  private initSchema() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS snapshots (
        id TEXT PRIMARY KEY,
        sessionId TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        data TEXT NOT NULL
      )
    `);

    // GROK OPTIMIZATION: Critical index for sessionId lookups used by the debugger UI
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_snapshots_session_ts 
      ON snapshots(sessionId, timestamp DESC)
    `);
  }

  /**
   * Save a snapshot for a given execution session.
   * Automatically prunes old entries for this session after insert.
   */
  saveSnapshot(sessionId: string, snapshot: SwarmMemorySnapshot): void {
    const stmt = this.db.prepare(
      'INSERT OR REPLACE INTO snapshots (id, sessionId, timestamp, data) VALUES (?, ?, ?, ?)'
    );
    stmt.run(snapshot.id, sessionId, snapshot.timestamp, JSON.stringify(snapshot));

    // Auto cleanup to keep the DB lean
    this.pruneOldSnapshots(sessionId);
  }

  /**
   * Retrieve all snapshots for a session, ordered chronologically.
   */
  getSnapshots(sessionId: string): SwarmMemorySnapshot[] {
    const stmt = this.db.prepare(
      'SELECT data FROM snapshots WHERE sessionId = ? ORDER BY timestamp ASC'
    );
    const rows = stmt.all(sessionId) as { data: string }[];
    return rows.map((r) => JSON.parse(r.data) as SwarmMemorySnapshot);
  }

  /**
   * Prune old snapshots for a session, keeping only the most recent N.
   * This prevents the local timetravel.db from growing forever.
   */
  pruneOldSnapshots(sessionId: string, keepLast: number = this.MAX_SNAPSHOTS_PER_SESSION): void {
    const deleteStmt = this.db.prepare(`
      DELETE FROM snapshots 
      WHERE sessionId = ? 
        AND id NOT IN (
          SELECT id FROM snapshots 
          WHERE sessionId = ? 
          ORDER BY timestamp DESC 
          LIMIT ?
        )
    `);
    deleteStmt.run(sessionId, sessionId, keepLast);
  }

  /**
   * Global maintenance: prune very old sessions entirely (optional call from admin/debug routes).
   */
  pruneOldSessions(olderThanDays: number = 7): number {
    const cutoff = Date.now() - (olderThanDays * 24 * 60 * 60 * 1000);
    const stmt = this.db.prepare('DELETE FROM snapshots WHERE timestamp < ?');
    const result = stmt.run(cutoff);
    return result.changes;
  }

  close(): void {
    this.db.close();
  }
}

// Convenience singleton for server routes (similar to other engine singletons)
let instance: TimeTravelDB | null = null;

export function getTimeTravelDB(): TimeTravelDB {
  if (!instance) {
    instance = new TimeTravelDB();
  }
  return instance;
}
