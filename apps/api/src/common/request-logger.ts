import type { MiddlewareHandler } from 'hono';
import { rootLogger } from './logger';

let lastRequestId = 0;

/**
 * Une ligne de log par requête terminée (comme pino-http) : identifiant, méthode, chemin (sans query
 * string, masqué par `serializeRequest`), statut et durée. `/api/health` est ignoré : le healthcheck
 * du conteneur l'appelle toutes les 30 s.
 */
export const requestLogger: MiddlewareHandler = async (c, next) => {
  if (c.req.path === '/api/health') return next();
  const start = performance.now();
  lastRequestId += 1;
  const req = {
    id: String(lastRequestId),
    method: c.req.method,
    url: c.req.path,
  };
  await next();
  const statusCode = c.res.status;
  const responseTime = Math.round(performance.now() - start);
  // `info` même sur un 5xx : l'erreur elle-même est déjà journalisée (et envoyée à Sentry) par
  // `handleError`, un second log `error` doublerait l'événement Sentry.
  rootLogger().info(
    { context: 'HTTP', req, res: { statusCode }, responseTime },
    'request completed',
  );
};
