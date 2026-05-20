import {
  ApplicationConfig,
  PLATFORM_ID,
  inject,
  isDevMode,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
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
import { authInterceptor } from '@features/auth/infrastructure/auth.interceptor';
import { errorToastInterceptor } from '@core/interceptors';
import { IMAGE_CONFIG } from '@angular/common';
import {
  provideClientHydration,
  withEventReplay,
  withHttpTransferCacheOptions,
  withIncrementalHydration,
} from '@angular/platform-browser';
import { filter } from 'rxjs';

import { routes } from './app.routes';
import { SeoService } from '@shared/seo/seo';
import { ANALYTICS_GATEWAY, HttpAnalyticsGateway } from '@shared/analytics';
import { CV_GATEWAY, HttpCvGateway } from '@shared/cv';
import { API_BASE_URL } from '@shared/api';
import { PROJECTS_GATEWAY } from '@features/projects/application';
import { PROFILE_GATEWAY } from '@features/profile/application';
import { CONTACT_GATEWAY } from '@features/contact/application';
import { HOME_GATEWAY } from '@features/home/application';
import { HttpProjectsGateway } from '@features/projects/infrastructure';
import { HttpProfileGateway } from '@features/profile/infrastructure';
import { HttpContactGateway } from '@features/contact/infrastructure';
import { HttpHomeGateway } from '@features/home/infrastructure';
import { AUTH_GATEWAY } from '@features/auth/domain';
import { HttpAuthGateway, AuthService } from '@features/auth/infrastructure';

function prefetchHomeBundle(): () => void {
  return (): void => {
    if (!isPlatformBrowser(inject(PLATFORM_ID))) return;
    const gateway = inject(HOME_GATEWAY);
    gateway.getHomeBundle().subscribe();
  };
}

function initializeAuth(): () => Promise<void> | void {
  return (): Promise<void> | void => {
    if (!isPlatformBrowser(inject(PLATFORM_ID))) return;
    const auth = inject(AuthService);
    return auth.ready;
  };
}

function initializeSeo(): () => void {
  return (): void => {
    const router = inject(Router);
    const seoService = inject(SeoService);

    router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(() => {
        let route = router.routerState.snapshot.root;
        while (route.firstChild) {
          route = route.firstChild;
        }

        const seoData = route.data['seo'];
        if (seoData) {
          seoService.applySeoData(seoData);
        }
      });
  };
}

function initializeTracking(): () => void {
  return (): void => {
    if (!isPlatformBrowser(inject(PLATFORM_ID))) return;

    const router = inject(Router);
    const analytics = inject(ANALYTICS_GATEWAY);

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
    provideAppInitializer(prefetchHomeBundle()),
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
          return 'https://api.j-ned.dev/api';
        }
        return isDevMode() ? '/api' : 'https://api.j-ned.dev/api';
      },
    },
    { provide: PROJECTS_GATEWAY, useClass: HttpProjectsGateway },
    { provide: PROFILE_GATEWAY, useClass: HttpProfileGateway },
    { provide: CONTACT_GATEWAY, useClass: HttpContactGateway },
    { provide: HOME_GATEWAY, useClass: HttpHomeGateway },
    { provide: ANALYTICS_GATEWAY, useClass: HttpAnalyticsGateway },
    { provide: CV_GATEWAY, useClass: HttpCvGateway },
    { provide: AUTH_GATEWAY, useClass: HttpAuthGateway },
  ],
};
