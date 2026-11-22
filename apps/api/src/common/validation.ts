import * as z from 'zod';
import fr from 'zod/v4/locales/fr.js';
import { BadRequestException } from './http-errors';

// Messages de zod en français, pour toute l'application (corps, query strings, variables d'env).
// Fichier de la seule locale : `zod/locales` (comme `import { z }`, dont l'objet expose `z.locales`)
// chargerait les 64 langues au démarrage.
z.config(fr());

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

// Parcours par pile explicite : un corps de 100 ko peut imbriquer 50 000 niveaux, la récursion
// déborderait la pile d'appels (500) bien avant.
function stripProtoKeys<T>(value: T): T {
  const pending: unknown[] = [value];
  while (pending.length > 0) {
    const node = pending.pop();
    if (typeof node !== 'object' || node === null) continue;
    if (!Array.isArray(node)) Reflect.deleteProperty(node, '__proto__');
    for (const child of Object.values(node)) pending.push(child);
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
