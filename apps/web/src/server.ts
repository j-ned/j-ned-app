import { AngularAppEngine, createRequestHandler } from '@angular/ssr';

const angularAppEngine = new AngularAppEngine();

/**
 * Request handler utilisé lors du prerender et par le serveur Node si l'app
 * est déployée en SSR dynamique. Pour cette app, tout est prerendered ou CSR,
 * donc ce handler ne sera appelé qu'en mode prerender.
 *
 * Angular 21 attend un export nommé `reqHandler` (auparavant `default`).
 */
export const reqHandler = createRequestHandler(async (request: Request) => {
  const response = await angularAppEngine.handle(request);
  return response ?? new Response('Not found', { status: 404 });
});
