import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';

const DB_PATH = path.join(process.cwd(), 'data', 'reisekosten.db');
const SCHEMA_PATH = path.join(process.cwd(), 'lib', 'schema.sql');

declare global {
  var __reisekostenDb: Database.Database | undefined;
}

function createConnection(): Database.Database {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  const connection = new Database(DB_PATH);
  connection.pragma('journal_mode = WAL');
  connection.pragma('foreign_keys = ON');
  connection.exec(fs.readFileSync(SCHEMA_PATH, 'utf-8'));
  return connection;
}

export const db = globalThis.__reisekostenDb ?? createConnection();

if (process.env.NODE_ENV !== 'production') {
  globalThis.__reisekostenDb = db;
}

export function newId(): string {
  return crypto.randomUUID();
}
