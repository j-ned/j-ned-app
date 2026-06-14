import {
  ApplicationConfig,
  ErrorHandler,
  PLATFORM_ID,
  inject,
  isDevMode,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { createErrorHandler, TraceService } from '@sentry/angular';
import { isPlatformBrowser } from '@angular/common';
import {
  NavigationEnd,
  Router,
  provideRouter,
  withComponentInputBinding,
  withInMemoryScrolling,
  withPreloading,
  withViewTransitions,
} from '@angular/router';
import { SelectivePreload } from '@core/strategies/selective-preload';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
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
import { Seo } from '@shared/seo/seo';
import { SITE_IDENTITY } from '@shared/identity/site-identity.static-data';
import { AnalyticsGateway } from '@features/analytics/domain/gateways/analytics.gateway';
import { HttpAnalyticsGateway } from '@features/analytics/infra/gateways/http-analytics.gateway';
import { CvGateway } from '@features/cv/domain/gateways/cv.gateway';
import { HttpCvGateway } from '@features/cv/infra/gateways/http-cv.gateway';
import { API_BASE_URL } from '@shared/api/api-config';
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

function initializeAuth(): () => Promise<void> | void {
  return (): Promise<void> | void => {
    if (!isPlatformBrowser(inject(PLATFORM_ID))) return;
    const auth = inject(AuthStore);
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

function initializeTracking(): () => void {
  return (): void => {
    if (!isPlatformBrowser(inject(PLATFORM_ID))) return;

    const router = inject(Router);
    const analytics = inject(AnalyticsGateway);

    let currentUrl: string | null = null;
    let pageEnteredAt = Date.now();

    router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => {
        if (currentUrl) {
          const duration = Math.round((Date.now() - pageEnteredAt) / 1000);
          if (duration > 0) {
            analytics.trackPageDuration(currentUrl, duration);
          }
        }

        currentUrl = event.urlAfterRedirects;
        pageEnteredAt = Date.now();
        analytics.trackPageView(currentUrl);
      });

    window.addEventListener('beforeunload', () => {
      if (currentUrl) {
        const duration = Math.round((Date.now() - pageEnteredAt) / 1000);
        if (duration > 0) {
          analytics.sendBeacon({ type: 'page_duration', url: currentUrl, duration });
        }
      }
    });
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
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
    ),
    provideClientHydration(
      withEventReplay(),
      withIncrementalHydration(),
      withHttpTransferCacheOptions({
        filter: (req) => !req.url.includes('/home-bundle'),
      }),
    ),
    provideHttpClient(withFetch(), withInterceptors([authInterceptor, errorToastInterceptor])),
    provideAppInitializer(initializeAuth()),
    provideAppInitializer(initializeSeo()),
    provideAppInitializer(initializeTracking()),
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
    { provide: ProfileGateway, useClass: InMemoryProfileGateway },
    { provide: ContactGateway, useClass: HttpContactGateway },
    { provide: HomeGateway, useClass: InMemoryHomeGateway },
    { provide: AnalyticsGateway, useClass: HttpAnalyticsGateway },
    { provide: CvGateway, useClass: HttpCvGateway },
    { provide: AuthGateway, useClass: HttpAuthGateway },
    {
      provide: ErrorHandler,
      useValue: createErrorHandler({ showDialog: false }),
    },
    {
      provide: TraceService,
      deps: [Router],
    },
    provideAppInitializer(() => {
      inject(TraceService);
    }),
  ],
};
