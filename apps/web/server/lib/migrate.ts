import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import { env } from './env.js';

type MigrationJournal = {
  entries: Array<{ tag: string; when: number }>;
};

// Résolu depuis le cwd du process : /app en Docker (WORKDIR), racine projet en dev
const MIGRATIONS_DIR = resolve(process.cwd(), 'server/db/migrations');

// Baseline : si des tables publiques existent mais __drizzle_migrations est vide
// (drift typique d'un drizzle-kit push initial basculé vers migrate), stamper les
// migrations déjà dans l'image comme appliquées. created_at = when + 1 pour éviter
// la comparaison d'égalité bugguée dans drizzle-orm 0.45.
async function baselineIfNeeded(client: ReturnType<typeof postgres>): Promise<void> {
  await client.unsafe('CREATE SCHEMA IF NOT EXISTS drizzle');
  await client.unsafe(
    'CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations (id SERIAL PRIMARY KEY, hash text NOT NULL, created_at bigint)',
  );

  const stamped = await client`SELECT 1 FROM drizzle.__drizzle_migrations LIMIT 1`;
  if (stamped.length > 0) return;

  const publicTables = await client`SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' LIMIT 1`;
  if (publicTables.length === 0) return;

  const journal = JSON.parse(
    readFileSync(`${MIGRATIONS_DIR}/meta/_journal.json`, 'utf8'),
  ) as MigrationJournal;

  console.log(`Baselining ${journal.entries.length} existing migration(s)…`);
  for (const entry of journal.entries) {
    const sql = readFileSync(`${MIGRATIONS_DIR}/${entry.tag}.sql`, 'utf8');
    const hash = createHash('sha256').update(sql).digest('hex');
    await client`INSERT INTO drizzle.__drizzle_migrations (hash, created_at) VALUES (${hash}, ${entry.when + 1})`;
  }
}

export async function runMigrations(): Promise<void> {
  const client = postgres(env.DATABASE_URL, { max: 1 });
  const db = drizzle(client);

  try {
    await baselineIfNeeded(client);
    console.log('Applying migrations…');
    await migrate(db, { migrationsFolder: MIGRATIONS_DIR });
    console.log('Migrations applied.');
  } finally {
    await client.end();
  }
}
