import { sql } from 'drizzle-orm';
import type { PgTable } from 'drizzle-orm/pg-core';
import { db } from '../db/client.js';

export type PaginationParams = {
  page: number;
  limit: number;
};

export type PaginatedResult<T> = {
  data: T[];
  total: number;
  page: number;
  limit: number;
};

export function parsePagination(query: Record<string, string | undefined>): PaginationParams {
  const page = Math.max(1, Number(query['page']) || 1);
  const limit = Math.min(100, Math.max(1, Number(query['limit']) || 10));
  return { page, limit };
}

export async function countRows(table: PgTable): Promise<number> {
  const result = await db.select({ count: sql<number>`count(*)::int` }).from(table);
  return result[0]?.count ?? 0;
}
