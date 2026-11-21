import {
  ApplicationConfig,
  ErrorHandler,
  LOCALE_ID,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import {
  provideRouter,
  withComponentInputBinding,
  withInMemoryScrolling,
  withNavigationErrorHandler,
  withPreloading,
  withRouterConfig,
  withViewTransitions,
} from '@angular/router';
import { reloadOnStaleChunk } from '@core/navigation/stale-chunk-reload';
import { SelectivePreload } from '@core/strategies/selective-preload';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from '@features/auth/infra/auth-interceptor';
import { errorToastInterceptor } from '@core/interceptors/error-toast';
import {
  provideClientHydration,
  withEventReplay,
  withHttpTransferCacheOptions,
} from '@angular/platform-browser';

import { routes } from './app.routes';
import { initializeSeo } from '@core/seo/seo-initializer';
import { AnalyticsGateway } from '@features/analytics/domain/gateways/analytics.gateway';
import { HttpAnalyticsGateway } from '@features/analytics/infra/gateways/http-analytics.gateway';
import { CvGateway } from '@features/cv/domain/gateways/cv.gateway';
import { HttpCvGateway } from '@features/cv/infra/gateways/http-cv.gateway';
import { API_BASE_URL, API_LINK_BASE_URL } from '@shared/api/api-config';
import { provideStorageImages } from '@shared/images/storage-image-loader';
import { BlogGateway } from '@features/blog/domain/gateways/blog.gateway';
import { HttpBlogGateway } from '@features/blog/infra/http-blog.gateway';
import { ProjectsGateway } from '@features/projects/domain/gateways/projects.gateway';
import { ProfileGateway } from '@features/profile/domain/gateways/profile.gateway';
import { ContactGateway } from '@features/contact/domain/gateways/contact.gateway';
import { HomeGateway } from '@features/home/domain/gateways/home.gateway';
import { HttpProjectsGateway } from '@features/projects/infra/gateways/http-projects.gateway';
import { HttpProfileGateway } from '@features/profile/infra/gateways/http-profile.gateway';
import { HttpContactGateway } from '@features/contact/infra/gateways/http-contact.gateway';
import { InMemoryHomeGateway } from '@features/home/infra/gateways/in-memory-home.gateway';
import { AuthGateway } from '@features/auth/domain/gateways/auth.gateway';
import { HttpAuthGateway } from '@features/auth/infra/gateways/http-auth.gateway';
import { initializeAuth } from '@core/auth/auth-initializer';
import { initializePageTracking } from '@core/analytics/page-tracking';
import { initializeOutboundClickTracking } from '@core/analytics/outbound-click-tracking';
import { MonitoringErrorHandler } from '@core/monitoring/monitoring';

registerLocaleData(localeFr);

const PUBLIC_READ_PATHS = ['/projects', '/blog/posts', '/config', '/cv', '/profile'] as const;

const isPublicReadUrl = (url: string): boolean =>
  PUBLIC_READ_PATHS.some((path) => url.includes(`/api${path}`));

export const appConfig: ApplicationConfig = {
  providers: [
    { provide: LOCALE_ID, useValue: 'fr-FR' },
    provideBrowserGlobalErrorListeners(),
    provideRouter(
      routes,
      withComponentInputBinding(),
      withInMemoryScrolling({
        scrollPositionRestoration: 'enabled',
        anchorScrolling: 'enabled',
      }),
      withPreloading(SelectivePreload),
      // La première navigation retrouve le DOM déjà rendu par le serveur : rien à faire transiter.
      withViewTransitions({ skipInitialTransition: true }),
      withRouterConfig({ canceledNavigationResolution: 'computed' }),
      withNavigationErrorHandler(reloadOnStaleChunk),
    ),
    provideClientHydration(
      withEventReplay(),
      // L'intercepteur auth pose `withCredentials` partout, et le transfer cache ignore ces requêtes
      // par défaut : sans `includeRequestsWithCredentials`, le client referait chaque appel après
      // hydratation. Seules les lectures publiques sont sérialisées, la session reste hors HTML.
      withHttpTransferCacheOptions({
        includeRequestsWithCredentials: true,
        filter: (req) => req.method === 'GET' && isPublicReadUrl(req.url),
      }),
    ),
    provideHttpClient(withInterceptors([authInterceptor, errorToastInterceptor])),
    provideAppInitializer(initializeAuth()),
    provideAppInitializer(initializeSeo()),
    provideAppInitializer(initializePageTracking()),
    provideAppInitializer(initializeOutboundClickTracking()),
    provideStorageImages(),
    { provide: API_BASE_URL, useExisting: API_LINK_BASE_URL },
    { provide: ProjectsGateway, useClass: HttpProjectsGateway },
    { provide: BlogGateway, useClass: HttpBlogGateway },
    { provide: ProfileGateway, useClass: HttpProfileGateway },
    { provide: ContactGateway, useClass: HttpContactGateway },
    { provide: HomeGateway, useClass: InMemoryHomeGateway },
    { provide: AnalyticsGateway, useClass: HttpAnalyticsGateway },
    { provide: CvGateway, useClass: HttpCvGateway },
    { provide: AuthGateway, useClass: HttpAuthGateway },
    { provide: ErrorHandler, useClass: MonitoringErrorHandler },
  ],
};
