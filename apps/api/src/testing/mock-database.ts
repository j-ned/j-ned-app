import { drizzle } from 'drizzle-orm/postgres-js';
import type { Database } from '../database/drizzle.types';
import { schema } from '../database/schema';
import { createMockDb } from './test-utils';

export type MockDatabase = Database & ReturnType<typeof createMockDb>;

// `createMockDb()` typé `Database` sans transtypage : une instance Drizzle sans connexion
// (`drizzle.mock`) dont le builder chaînable remplace les méthodes de requête. Une méthode que le
// builder ne remplace pas reste celle de Drizzle et échoue faute de client.
export function createMockDatabase(): MockDatabase {
  return Object.assign(drizzle.mock({ schema }), createMockDb());
}
