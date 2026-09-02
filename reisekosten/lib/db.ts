import { Pool, type QueryResultRow } from 'pg';
import fs from 'node:fs/promises';
import path from 'node:path';

declare global {
  var __reisekostenPgPool: Pool | undefined;
  var __reisekostenSchemaReady: Promise<void> | undefined;
}

function resolveConnectionString(): string {
  const connectionString =
    process.env.DATABASE_URL ?? process.env.POSTGRES_URL ?? process.env.POSTGRES_PRISMA_URL;
  if (!connectionString) {
    throw new Error(
      'Keine Datenbankverbindung gefunden. Bitte DATABASE_URL (oder POSTGRES_URL) setzen, siehe .env.example.'
    );
  }
  return connectionString;
}

function createPool(): Pool {
  const connectionString = resolveConnectionString();
  const isLocal = /localhost|127\.0\.0\.1/.test(connectionString);
  return new Pool({
    connectionString,
    ssl: isLocal ? false : { rejectUnauthorized: false },
    max: 5,
  });
}

export const pool = globalThis.__reisekostenPgPool ?? createPool();
if (process.env.NODE_ENV !== 'production') {
  globalThis.__reisekostenPgPool = pool;
}

async function ensureSchema(): Promise<void> {
  if (!globalThis.__reisekostenSchemaReady) {
    globalThis.__reisekostenSchemaReady = (async () => {
      const schemaSql = await fs.readFile(path.join(process.cwd(), 'lib', 'schema.sql'), 'utf-8');
      await pool.query(schemaSql);
    })();
  }
  return globalThis.__reisekostenSchemaReady;
}

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: unknown[] = []
): Promise<T[]> {
  await ensureSchema();
  const result = await pool.query<T>(text, params);
  return result.rows;
}

export async function queryOne<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: unknown[] = []
): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] ?? null;
}

export async function withTransaction<T>(fn: (tx: TxQuery) => Promise<T>): Promise<T> {
  await ensureSchema();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const tx: TxQuery = async (text, params = []) => (await client.query(text, params)).rows;
    const result = await fn(tx);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export type TxQuery = <T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[]
) => Promise<T[]>;

export function newId(): string {
  return crypto.randomUUID();
}

export function nowIso(): string {
  return new Date().toISOString();
}
