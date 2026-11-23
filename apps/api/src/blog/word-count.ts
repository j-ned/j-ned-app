import { sql, type SQL } from 'drizzle-orm';
import type { AnyPgColumn } from 'drizzle-orm/pg-core';

// Même découpage que `apps/web/src/app/features/blog/domain/reading-time.ts` : le site en tire le
// temps de lecture des listes, qui ne joignent pas le corps.
export function countWords(markdown: string): number {
  return markdown.split(/\s+/).filter(Boolean).length;
}

// Les espaces de `\s` en JavaScript, écrits avec des échappements que lisent aussi les expressions
// régulières de Postgres : `\s` n'y désigne pas le même ensemble.
export const WHITESPACE_CLASS = String.raw`\t\n\v\f\r \u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000\ufeff`;

// `countWords` calculé par Postgres : la liste n'a pas à lire les corps pour leur nombre de mots.
export function sqlWordCount(markdown: AnyPgColumn): SQL<number> {
  return sql<number>`regexp_count(${markdown}, ${`[^${WHITESPACE_CLASS}]+`})::int`;
}
