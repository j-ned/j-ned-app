import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
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
import { errorToastInterceptor } from '@shared/toast';
import { IMAGE_CONFIG } from '@angular/common';
import { filter } from 'rxjs';

import { routes } from './app.routes';
import { SeoService } from '@shared/seo/seo';
import { AnalyticsService } from '@shared/analytics';
import { API_BASE_URL } from '@shared/api';
import { PROJECTS_GATEWAY } from '@features/projects/application';
import { PROFILE_GATEWAY } from '@features/profile/application';
import { CONTACT_GATEWAY } from '@features/contact/application';
import { HOME_GATEWAY } from '@features/home/application';
import { HttpProjectsGateway } from '@features/projects/infrastructure';
import { HttpProfileGateway } from '@features/profile/infrastructure';
import { HttpContactGateway } from '@features/contact/infrastructure';
import { HttpHomeGateway } from '@features/home/infrastructure';
import { BLOG_GATEWAY } from '@features/blog/application';
import { HttpBlogGateway } from '@features/blog/infrastructure';
import { BOOKING_GATEWAY } from '@features/booking/application';
import { HttpBookingGateway } from '@features/booking/infrastructure';

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
    const router = inject(Router);
    const analytics = inject(AnalyticsService);

    let currentUrl: string | null = null;
    let pageEnteredAt = Date.now();

    router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => {
        // Send duration for the previous page
        if (currentUrl) {
          const duration = Math.round((Date.now() - pageEnteredAt) / 1000);
          if (duration > 0) {
            analytics.trackPageDuration(currentUrl, duration);
          }
        }

        // Track new page view
        currentUrl = event.urlAfterRedirects;
        pageEnteredAt = Date.now();
        analytics.trackPageView(currentUrl);
      });

    // Send duration on page unload via sendBeacon
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
    provideHttpClient(withFetch(), withInterceptors([authInterceptor, errorToastInterceptor])),
    provideAppInitializer(initializeSeo()),
    provideAppInitializer(initializeTracking()),
    {
      provide: IMAGE_CONFIG,
      useValue: {
        breakpoints: [640, 768, 1024, 1280, 1920],
      },
    },
    { provide: API_BASE_URL, useValue: '/api' },
    { provide: PROJECTS_GATEWAY, useClass: HttpProjectsGateway },
    { provide: PROFILE_GATEWAY, useClass: HttpProfileGateway },
    { provide: CONTACT_GATEWAY, useClass: HttpContactGateway },
    { provide: HOME_GATEWAY, useClass: HttpHomeGateway },
    { provide: BLOG_GATEWAY, useClass: HttpBlogGateway },
    { provide: BOOKING_GATEWAY, useClass: HttpBookingGateway },
  ],
};
