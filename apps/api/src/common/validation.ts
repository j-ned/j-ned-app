import { z } from 'zod';
import { BadRequestException } from './http-errors';

// Messages de zod en français, pour toute l'application (corps, query strings, variables d'env).
z.config(z.locales.fr());

/** Message d'un corps JSON qui n'est pas un objet (liste, valeur seule). */
export const NOT_AN_OBJECT_MESSAGE =
  'Le corps de la requête doit être un objet JSON';

/**
 * Corps (ou query string) validé par le schéma zod du DTO. Les clés `__proto__` sont retirées avant
 * validation ; un corps qui n'est pas un objet est refusé (validé comme `{}` pour lister aussi les
 * champs manquants). Échec → 400, `message` = une ligne par issue zod (`formatIssues`).
 */
export function validateDto<T>(schema: z.ZodType<T>, value: unknown): T {
  const plain = isPlainObject(value) ? stripProtoKeys(value) : {};
  const result = schema.safeParse(plain);
  const messages = result.success ? [] : formatIssues(result.error.issues);
  if (!isPlainObject(value) && value !== undefined && value !== null) {
    throw new BadRequestException([NOT_AN_OBJECT_MESSAGE, ...messages]);
  }
  if (!result.success) throw new BadRequestException(messages);
  return result.data;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function stripProtoKeys<T>(value: T): T {
  if (Array.isArray(value)) value.forEach(stripProtoKeys);
  else if (typeof value === 'object' && value !== null) {
    const record = value as Record<string, unknown>;
    delete record['__proto__'];
    for (const key of Object.keys(record)) stripProtoKeys(record[key]);
  }
  return value;
}

/**
 * Une ligne par issue, dans l'ordre de zod : `<chemin.pointé>: <message>` (`biography.title: …`,
 * `highlights.0.id: …`), le message seul pour une issue à la racine (clé inconnue du corps).
 */
export function formatIssues(
  issues: readonly Pick<z.core.$ZodIssue, 'path' | 'message'>[],
): string[] {
  return issues.map(({ path, message }) =>
    path.length > 0 ? `${path.map(String).join('.')}: ${message}` : message,
  );
}
