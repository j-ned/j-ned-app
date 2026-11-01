import { Hono } from 'hono';
import { handleError, handleNotFound } from './error-handler';
import type { AppEnv } from './http';

/**
 * Application de test : les routes d'un module montées sous leur préfixe, avec le gestionnaire
 * d'erreurs de l'API. Les requêtes passent par `app.request(...)`, sans serveur.
 */
export function testApp(prefix: string, routes: Hono<AppEnv>): Hono<AppEnv> {
  return new Hono<AppEnv>()
    .route(prefix, routes)
    .notFound(handleNotFound)
    .onError(handleError);
}
