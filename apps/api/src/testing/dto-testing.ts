import type * as z from 'zod';
import '../common/validation';

export type Violation = { readonly path: string; readonly message: string };

// Vide si le corps est accepté. Une clé inconnue compte sous son propre chemin (`biography.extra`),
// comme un champ en erreur.
export function violationsOf(schema: z.ZodType, body: unknown): Violation[] {
  const result = schema.safeParse(body);
  if (result.success) return [];
  return result.error.issues.flatMap((issue) => {
    const path = issue.path.map(String);
    const paths =
      issue.code === 'unrecognized_keys'
        ? issue.keys.map((key) => [...path, key])
        : [path];
    return paths.map((p) => ({ path: p.join('.'), message: issue.message }));
  });
}

// Dans l'ordre des issues, clés inconnues comprises.
export function invalidProperties(schema: z.ZodType, body: unknown): string[] {
  return [
    ...new Set(
      violationsOf(schema, body).flatMap(({ path }) =>
        path.split('.').slice(0, 1),
      ),
    ),
  ];
}

// `path` lui-même ou un de ses éléments de liste (`skills` couvre `skills.0`) ; `message` exact s'il
// est donné.
export function hasViolation(
  violations: readonly Violation[],
  path: string,
  message?: string,
): boolean {
  const items = new RegExp(`^${path.replaceAll('.', '\\.')}(\\.\\d+)+$`);
  return violations.some(
    (v) =>
      (v.path === path || items.test(v.path)) &&
      (message === undefined || v.message === message),
  );
}
