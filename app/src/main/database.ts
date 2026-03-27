import Database from 'better-sqlite3';
import path from 'path';
import { app } from 'electron';
import { HistoryEntry } from '../shared/types';

let db: Database.Database;

export function initDatabase(): void {
  const dbPath = path.join(app.getPath('userData'), 'crux-history.db');
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');

  db.exec(`
    CREATE TABLE IF NOT EXISTS history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      command TEXT NOT NULL,
      directory TEXT NOT NULL,
      timestamp TEXT NOT NULL DEFAULT (datetime('now')),
      exit_code INTEGER DEFAULT 0,
      duration_ms INTEGER DEFAULT 0,
      output_preview TEXT DEFAULT ''
    );
    CREATE INDEX IF NOT EXISTS idx_history_timestamp ON history(timestamp DESC);
    CREATE INDEX IF NOT EXISTS idx_history_command ON history(command);
    CREATE INDEX IF NOT EXISTS idx_history_directory ON history(directory);
  `);
}

export function addHistoryEntry(entry: Omit<HistoryEntry, 'id'>): number {
  const stmt = db.prepare(`
    INSERT INTO history (command, directory, timestamp, exit_code, duration_ms, output_preview)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
    entry.command,
    entry.directory,
    entry.timestamp || new Date().toISOString(),
    entry.exit_code,
    entry.duration_ms,
    entry.output_preview.substring(0, 200)
  );
  return result.lastInsertRowid as number;
}

export function searchHistory(query: string, limit: number = 50): HistoryEntry[] {
  const stmt = db.prepare(`
    SELECT * FROM history
    WHERE command LIKE ?
    ORDER BY timestamp DESC
    LIMIT ?
  `);
  return stmt.all(`%${query}%`, limit) as HistoryEntry[];
}

export function getAllHistory(limit: number = 100, offset: number = 0): HistoryEntry[] {
  const stmt = db.prepare(`
    SELECT * FROM history
    ORDER BY timestamp DESC
    LIMIT ? OFFSET ?
  `);
  return stmt.all(limit, offset) as HistoryEntry[];
}

export function getHistoryByDirectory(directory: string): HistoryEntry[] {
  const stmt = db.prepare(`
    SELECT * FROM history
    WHERE directory = ?
    ORDER BY timestamp DESC
    LIMIT 100
  `);
  return stmt.all(directory) as HistoryEntry[];
}

export function getHistoryStats(): { totalCommands: number; directories: string[] } {
  const countStmt = db.prepare('SELECT COUNT(*) as count FROM history');
  const dirStmt = db.prepare('SELECT DISTINCT directory FROM history ORDER BY directory');
  const count = (countStmt.get() as any).count;
  const dirs = (dirStmt.all() as any[]).map((r) => r.directory);
  return { totalCommands: count, directories: dirs };
}

export function closeDatabase(): void {
  if (db) db.close();
}
