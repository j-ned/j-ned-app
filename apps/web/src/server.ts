import { AngularAppEngine, createRequestHandler } from '@angular/ssr';

const angularAppEngine = new AngularAppEngine();

// Nom d'export `reqHandler` requis par Angular (pas `default`).
export const reqHandler = createRequestHandler(async (request: Request) => {
  const response = await angularAppEngine.handle(request);
  return response ?? new Response('Not found', { status: 404 });
});
