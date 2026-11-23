import { ErrorHandler, mergeApplicationConfig, type ApplicationConfig } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideServerRendering, withRoutes } from '@angular/ssr';
import { ServerErrorHandler } from '@core/monitoring/server-error-handler';
import { provideSsrApiBaseUrl } from '@core/ssr/ssr-api-base-url';
import { ssrUpstreamInterceptor } from '@core/ssr/ssr-upstream-interceptor';
import { appConfig } from './app.config';
import { serverRoutes } from './app.routes.server';

const serverOnlyConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(withRoutes(serverRoutes)),
    provideSsrApiBaseUrl(),
    // Les intercepteurs fonctionnels sont multi : ce second appel ajoute celui-ci à ceux d'app.config.ts.
    provideHttpClient(withInterceptors([ssrUpstreamInterceptor])),
    // Remplace celui d'app.config.ts côté serveur seulement : le navigateur garde le sien.
    { provide: ErrorHandler, useClass: ServerErrorHandler },
  ],
};

export const serverConfig = mergeApplicationConfig(appConfig, serverOnlyConfig);
