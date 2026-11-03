import * as z from 'zod';

/** `?page=&limit=` : entiers lus dans la query string. */
export const paginationSchema = z.strictObject({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export type PaginationParams = {
  page: number;
  limit: number;
  offset: number;
};

export type PaginatedResult<T> = {
  data: T[];
  total: number;
  page: number;
  limit: number;
};

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

export function parsePagination(input: {
  page?: number;
  limit?: number;
}): PaginationParams {
  const page = Math.max(1, input.page ?? DEFAULT_PAGE);
  const limit = Math.min(MAX_LIMIT, Math.max(1, input.limit ?? DEFAULT_LIMIT));
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}
