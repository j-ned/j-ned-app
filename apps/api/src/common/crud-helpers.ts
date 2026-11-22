import { NotFoundException } from './http-errors';
import { eq, type Column, type Table } from 'drizzle-orm';
import type { Database } from '../database/drizzle.types';

// Tables à clé simple seulement : celles à clé composée gardent leur propre `findOne`.
export async function findByIdOrFail<TRow>(
  db: Database,
  table: Table & { id: Column },
  id: string,
  label: string,
): Promise<TRow> {
  const [row] = (await db
    .select()
    .from(table)
    .where(eq(table.id, id))
    .limit(1)) as TRow[];
  if (row === undefined) {
    throw new NotFoundException(`${label} ${id} not found`);
  }
  return row;
}
