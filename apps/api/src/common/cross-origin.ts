import type { MiddlewareHandler } from 'hono';
import { ForbiddenException } from './http-errors';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

type CrossOriginHeaders = {
  readonly method: string;
  readonly origin: string | undefined;
  readonly fetchSite: string | undefined;
};

// CSRF sans jeton ni état (comme `CrossOriginProtection` de Go) : `same-origin`/`none` passent, sinon
// l'origine doit être de confiance ; sans `Sec-Fetch-Site` ni `Origin`, ce n'est pas un navigateur.
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
