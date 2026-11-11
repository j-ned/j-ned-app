import type { MiddlewareHandler } from 'hono';
import { Logger } from './logger';

/**
 * Tag Vercel de tout ce qui dépend du contenu éditable : réponses publiques de l'API et pages rendues
 * par le site (`apps/web/src/server.ts`). Un seul tag : une écriture admin est rare, et vider tout le
 * contenu d'un coup ne laisse aucune page de liste ou de détail en retard.
 */
export const CONTENT_CACHE_TAG = 'content';

/**
 * Cache du CDN Vercel (ignoré par le navigateur, qui revalide) : un jour de fraîcheur, puis la copie sert
 * pendant le nouveau rendu, et pendant 7 jours si l'API échoue. La fraîcheur réelle vient de la purge
 * du tag à chaque écriture ; la durée ne borne que ce qu'aucune écriture ne change.
 */
export const CDN_CACHE_CONTROL =
  'max-age=86400, stale-while-revalidate=604800, stale-if-error=604800';

/** Lecture publique mise en cache par le CDN sous le tag du contenu (200 et 404 seulement). */
export const cdnCache: MiddlewareHandler = async (c, next) => {
  await next();
  if (c.res.status === 200 || c.res.status === 404) {
    c.res.headers.set('CDN-Cache-Control', CDN_CACHE_CONTROL);
    c.res.headers.set('Vercel-Cache-Tag', CONTENT_CACHE_TAG);
  }
};

const logger = new Logger('CdnCache');

/**
 * Après une écriture réussie (hors GET/HEAD), vide le cache du contenu avant de répondre : le
 * rechargement suivant de l'admin lit déjà la nouvelle version. Un échec de purge est journalisé sans
 * faire échouer l'écriture, déjà faite. Les chemins de `publicWrites` sont laissés de côté.
 */
export function purgeContentCacheOnWrite(
  purge: () => Promise<void>,
  publicWrites?: RegExp,
): MiddlewareHandler {
  return async (c, next) => {
    await next();
    if (c.req.method === 'GET' || c.req.method === 'HEAD') return;
    if (publicWrites?.test(c.req.path)) return;
    if (c.res.status >= 400) return;
    try {
      await purge();
    } catch (error: unknown) {
      logger.warn({ err: error }, 'content cache purge failed');
    }
  };
}
