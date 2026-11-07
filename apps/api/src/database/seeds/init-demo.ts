import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import { schema } from '../schema';
import {
  DEMO_ADMIN_EMAIL,
  demoSeedSettings,
  initDemoDatabase,
} from './demo.seed';

// `.env` local facultatif, lu par Node sans dépendance.
if (existsSync('.env')) process.loadEnvFile();

async function main() {
  const { databaseUrl, password } = demoSeedSettings(process.env);
  const client = postgres(databaseUrl, { max: 1, onnotice: () => {} });
  const db = drizzle(client, { schema, casing: 'snake_case' });
  try {
    await initDemoDatabase(db, {
      password,
      migrate: () =>
        migrate(db, {
          migrationsFolder: resolve(__dirname, '../../../drizzle'),
        }),
    });
    console.log(`Demo database ready: admin "${DEMO_ADMIN_EMAIL}".`);
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
