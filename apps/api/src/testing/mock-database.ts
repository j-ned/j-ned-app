import { drizzle } from 'drizzle-orm/postgres-js';
import type { Database } from '../database/drizzle.types';
import { schema } from '../database/schema';
import type { createMockDb } from './test-utils';

// Le builder de `createMockDb()` vu comme `Database`, sans transtypage : une instance Drizzle sans
// connexion (`drizzle.mock`) dont les méthodes de requête sont remplacées par celles du builder, qui
// reste la poignée des assertions. Une méthode que le builder ne remplace pas échoue faute de client.
export function asDatabase(mock: ReturnType<typeof createMockDb>): Database {
  return Object.assign(drizzle.mock({ schema }), mock);
}
