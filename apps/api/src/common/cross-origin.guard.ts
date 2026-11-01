import {
  ForbiddenException,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common';
import type { Request } from 'express';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

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
export class CrossOriginGuard implements CanActivate {
  private readonly trustedOrigins: ReadonlySet<string>;

  constructor(trustedOrigins: readonly string[]) {
    this.trustedOrigins = new Set(trustedOrigins);
  }

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    if (SAFE_METHODS.has(req.method)) return true;

    const origin = req.get('origin');
    const fetchSite = req.get('sec-fetch-site');
    if (fetchSite === 'same-origin' || fetchSite === 'none') return true;
    if (fetchSite === undefined && origin === undefined) return true;
    if (origin !== undefined && this.trustedOrigins.has(origin)) return true;

    throw new ForbiddenException('Cross-origin request rejected');
  }
}
