import { Hono } from 'hono';
import { handleError, handleNotFound } from '../common/error-handler';
import type { AppEnv } from '../common/http';

// Les routes montées sous leur préfixe avec le gestionnaire d'erreurs de l'API, appelées par
// `app.request(...)`, sans serveur.
export function testApp(prefix: string, routes: Hono<AppEnv>): Hono<AppEnv> {
  return new Hono<AppEnv>()
    .route(prefix, routes)
    .notFound(handleNotFound)
    .onError(handleError);
}
