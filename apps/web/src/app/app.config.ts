import {
  ApplicationConfig,
  ErrorHandler,
  LOCALE_ID,
  PLATFORM_ID,
  inject,
  isDevMode,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { isPlatformBrowser, registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import {
  NavigationEnd,
  Router,
  provideRouter,
  withComponentInputBinding,
  withInMemoryScrolling,
  withPreloading,
  withRouterConfig,
  withViewTransitions,
} from '@angular/router';
import { SelectivePreload } from '@core/strategies/selective-preload';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from '@features/auth/infra/auth-interceptor';
import { errorToastInterceptor } from '@core/interceptors/error-toast';
import { IMAGE_CONFIG } from '@angular/common';
import {
  provideClientHydration,
  withEventReplay,
  withHttpTransferCacheOptions,
  withIncrementalHydration,
} from '@angular/platform-browser';
import { filter } from 'rxjs';

import { routes } from './app.routes';
import { Seo } from '@core/seo/seo';
import { SITE_IDENTITY } from '@shared/identity/site-identity.static-data';
import { AnalyticsGateway } from '@features/analytics/domain/gateways/analytics.gateway';
import { HttpAnalyticsGateway } from '@features/analytics/infra/gateways/http-analytics.gateway';
import { CvGateway } from '@features/cv/domain/gateways/cv.gateway';
import { HttpCvGateway } from '@features/cv/infra/gateways/http-cv.gateway';
import { API_BASE_URL } from '@shared/api/api-config';
import { BlogGateway } from '@features/blog/domain/gateways/blog.gateway';
import { HttpBlogGateway } from '@features/blog/infra/http-blog.gateway';
import { ProjectsGateway } from '@features/projects/domain/gateways/projects.gateway';
import { ProfileGateway } from '@features/profile/domain/gateways/profile.gateway';
import { ContactGateway } from '@features/contact/domain/gateways/contact.gateway';
import { HomeGateway } from '@features/home/domain/gateways/home.gateway';
import { HttpProjectsGateway } from '@features/projects/infra/gateways/http-projects.gateway';
import { InMemoryProfileGateway } from '@features/profile/infra/gateways/in-memory-profile.gateway';
import { HttpContactGateway } from '@features/contact/infra/gateways/http-contact.gateway';
import { InMemoryHomeGateway } from '@features/home/infra/gateways/in-memory-home.gateway';
import { AuthGateway } from '@features/auth/domain/gateways/auth.gateway';
import { HttpAuthGateway } from '@features/auth/infra/gateways/http-auth.gateway';
import { AuthStore } from '@core/auth/auth-store';
import { initializePageTracking } from '@core/analytics/page-tracking';
import { MonitoringErrorHandler } from '@core/monitoring/monitoring';

function initializeAuth(): () => Promise<void> | void {
  return (): Promise<void> | void => {
    if (!isPlatformBrowser(inject(PLATFORM_ID))) return;
    // Le store est entièrement construit ici : la requête peut traverser `authInterceptor`.
    const auth = inject(AuthStore);
    auth.restoreSession();
    return auth.ready;
  };
}

function initializeSeo(): () => void {
  return (): void => {
    const router = inject(Router);
    const seoService = inject(Seo);

    router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => {
        let route = router.routerState.snapshot.root;
        while (route.firstChild) {
          route = route.firstChild;
        }

        const seoData = route.data['seo'];
        if (seoData) {
          const url = seoData.url ?? `${SITE_IDENTITY.siteUrl}${event.urlAfterRedirects}`;
          seoService.applySeoData({ ...seoData, url });
        }
      });
  };
}

registerLocaleData(localeFr);

const PUBLIC_READ_PATHS = ['/projects', '/blog/posts', '/config', '/cv'] as const;

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
      withViewTransitions(),
      withRouterConfig({ canceledNavigationResolution: 'computed' }),
    ),
    provideClientHydration(
      withEventReplay(),
      withIncrementalHydration(),
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
    {
      provide: IMAGE_CONFIG,
      useValue: {
        breakpoints: [640, 768, 1024, 1280, 1920],
      },
    },
    {
      provide: API_BASE_URL,
      useFactory: (): string => {
        if (!isPlatformBrowser(inject(PLATFORM_ID))) {
          return 'https://api.nedellec-julien.fr/api';
        }
        return isDevMode() ? '/api' : 'https://api.nedellec-julien.fr/api';
      },
    },
    { provide: ProjectsGateway, useClass: HttpProjectsGateway },
    { provide: BlogGateway, useClass: HttpBlogGateway },
    { provide: ProfileGateway, useClass: InMemoryProfileGateway },
    { provide: ContactGateway, useClass: HttpContactGateway },
    { provide: HomeGateway, useClass: InMemoryHomeGateway },
    { provide: AnalyticsGateway, useClass: HttpAnalyticsGateway },
    { provide: CvGateway, useClass: HttpCvGateway },
    { provide: AuthGateway, useClass: HttpAuthGateway },
    { provide: ErrorHandler, useClass: MonitoringErrorHandler },
  ],
};
