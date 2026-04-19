import { AngularAppEngine, createRequestHandler } from '@angular/ssr';

const angularAppEngine = new AngularAppEngine();

/**
 * Request handler utilisé lors du prerender et par le serveur Node si l'app
 * est déployée en SSR dynamique. Pour cette app, tout est prerendered ou CSR,
 * donc ce handler ne sera appelé qu'en mode prerender.
 */
const handler = createRequestHandler(async (request: Request) => {
  const response = await angularAppEngine.handle(request);
  return response ?? new Response('Not found', { status: 404 });
});

export default handler;
