import { HttpErrorResponse, type HttpInterceptorFn } from '@angular/common/http';
import { RESPONSE_INIT, inject } from '@angular/core';
import { TimeoutError, catchError, throwError, timeout } from 'rxjs';
import { injectSsrRequestContext } from './ssr-request-context';

// Au-delà, le rendu abandonne la lecture : nginx sert sa copie au lieu de faire attendre le visiteur
// (la gateway projets réessaie une fois : 6 s au plus).
const API_READ_TIMEOUT_MS = 3_000;

// Toute lecture en échec sauf 404 (qui est une réponse) : la page répond 503 pour que nginx serve
// sa dernière copie au lieu de mettre en cache une page sans contenu.
const isUpstreamFailure = (error: unknown): boolean =>
  error instanceof TimeoutError || (error instanceof HttpErrorResponse && error.status !== 404);

// Sans l'adresse du visiteur, l'API compterait tous les rendus sur l'IP du conteneur front et
// répondrait 429 en rafale (quota par IP des lectures publiques).
export const ssrUpstreamInterceptor: HttpInterceptorFn = (req, next) => {
  const context = injectSsrRequestContext();
  if (!context || !req.url.startsWith(`${context.apiBaseUrl}/`)) return next(req);

  const visitor = context.visitorForwardedFor;
  const upstream = next(visitor ? req.clone({ setHeaders: { 'X-Forwarded-For': visitor } }) : req);
  if (req.method !== 'GET') return upstream;

  const responseInit = inject(RESPONSE_INIT, { optional: true });
  return upstream.pipe(
    timeout(API_READ_TIMEOUT_MS),
    catchError((error: unknown) => {
      if (responseInit && isUpstreamFailure(error)) responseInit.status = 503;
      return throwError(() => error);
    }),
  );
};
