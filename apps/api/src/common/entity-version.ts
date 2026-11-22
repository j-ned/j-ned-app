import { and, eq, sql, type SQL } from 'drizzle-orm';
import type { PgColumn, PgTable } from 'drizzle-orm/pg-core';
import type { Context } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import * as z from 'zod';
import type { Database } from '../database/drizzle.types';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from './http-errors';

const MALFORMED_IF_MATCH =
  'En-tête If-Match invalide : une seule version attendue, entre guillemets (par exemple "3").';
// Borne de la colonne `integer` de Postgres : au-delà, la comparaison lèverait une erreur SQL (500).
const MAX_VERSION = 2_147_483_647;

// ETag fort et unique : ni `*`, ni liste, ni `W/` (If-Match compare en fort, RFC 9110 § 13.1.1).
const ifMatchSchema = z
  .string()
  .regex(/^"[1-9][0-9]{0,9}"$/)
  .transform((tag) => Number(tag.slice(1, -1)))
  .pipe(z.number().max(MAX_VERSION));

type Versioned = { readonly version: number };
type VersionedTable = PgTable & {
  readonly id: PgColumn;
  readonly version: PgColumn;
};

export function entityTag(version: number): string {
  return `"${version}"`;
}

// `undefined` sans en-tête : l'écriture reste inconditionnelle, comme pour un client qui l'ignore.
export function ifMatchVersion(c: Context): number | undefined {
  const header = c.req.header('if-match');
  if (header === undefined) return undefined;
  const parsed = ifMatchSchema.safeParse(header.trim());
  if (!parsed.success) throw new BadRequestException(MALFORMED_IF_MATCH);
  return parsed.data;
}

export function replyVersioned<T extends Versioned>(
  c: Context,
  entity: T,
  status: ContentfulStatusCode = 200,
): Response {
  c.header('ETag', entityTag(entity.version));
  return c.json(entity, status);
}

// Raccourci avant tout travail coûteux (envoi S3) ; l'écriture reste conditionnelle ensuite.
export function assertVersion(
  current: Versioned,
  expected: number | undefined,
  staleMessage: string,
): void {
  if (expected !== undefined && current.version !== expected) {
    throw new ConflictException(staleMessage);
  }
}

export function nextVersion(table: VersionedTable): SQL {
  return sql`${table.version} + 1`;
}

export function versionedRow(
  table: VersionedTable,
  id: string,
  expected: number | undefined,
): SQL | undefined {
  return and(
    eq(table.id, id),
    expected === undefined ? undefined : eq(table.version, expected),
  );
}

// L'`UPDATE` conditionnel n'a touché aucune ligne : la ligne encore présente a changé de version
// (409), sinon elle a été supprimée (404). Les deux constats sont vrais à l'instant de la réponse.
export async function missedWrite(
  db: Database,
  table: VersionedTable,
  id: string,
  expected: number | undefined,
  messages: { readonly notFound: string; readonly stale: string },
): Promise<never> {
  if (expected !== undefined) {
    const [row] = await db
      .select({ id: table.id })
      .from(table)
      .where(eq(table.id, id))
      .limit(1);
    if (row !== undefined) throw new ConflictException(messages.stale);
  }
  throw new NotFoundException(messages.notFound);
}
