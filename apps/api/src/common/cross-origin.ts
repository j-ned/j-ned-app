import type { MiddlewareHandler } from 'hono';
import { ForbiddenException } from './http-errors';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

type CrossOriginHeaders = {
  readonly method: string;
  readonly origin: string | undefined;
  readonly fetchSite: string | undefined;
};

/**
 * Protection CSRF par les en-têtes que le navigateur pose lui-même (même algorithme que
 * `CrossOriginProtection` de Go `net/http`) : une écriture n'est acceptée que si elle vient de la même
 * origine que l'API, ou d'une origine de confiance (le site, tant qu'il appelle encore l'API sur son
 * sous-domaine). Ni jeton ni état côté serveur.
 *
 * - `Sec-Fetch-Site` présent (tout navigateur récent) : `same-origin` ou `none` (barre d'adresse,
 *   favori) passent ; `same-site` et `cross-site` exigent une origine de confiance.
 * - Sinon, `Origin` présent : il doit être de confiance.
 * - Ni l'un ni l'autre : ce n'est pas un navigateur (curl, scripts), donc pas une requête forgée.
 */
export function isCrossOriginAllowed(
  { method, origin, fetchSite }: CrossOriginHeaders,
  trustedOrigins: ReadonlySet<string>,
): boolean {
  if (SAFE_METHODS.has(method)) return true;
  if (fetchSite === 'same-origin' || fetchSite === 'none') return true;
  if (fetchSite === undefined && origin === undefined) return true;
  return origin !== undefined && trustedOrigins.has(origin);
}

export function crossOriginProtection(
  trustedOrigins: readonly string[],
): MiddlewareHandler {
  const trusted = new Set(trustedOrigins);
  return async (c, next) => {
    const allowed = isCrossOriginAllowed(
      {
        method: c.req.method,
        origin: c.req.header('origin'),
        fetchSite: c.req.header('sec-fetch-site'),
      },
      trusted,
    );
    if (!allowed) throw new ForbiddenException('Cross-origin request rejected');
    await next();
  };
}
