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
  withViewTransitions,
} from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { IMAGE_CONFIG } from '@angular/common';
import { filter } from 'rxjs';

import { routes } from './app.routes';
import { SeoService } from './shared/seo/seo';
import { PROJECTS_GATEWAY } from './features/projects/domain';
import { PROFILE_GATEWAY } from './features/profile/domain';
import { CONTACT_GATEWAY } from './features/contact/domain';
import { HOME_GATEWAY } from './features/home/domain';
import { HttpProjectsGateway } from './features/projects/infrastructure';
import { HttpProfileGateway } from './features/profile/infrastructure';
import { HttpContactGateway } from './features/contact/infrastructure';
import { HttpHomeGateway } from './features/home/infrastructure';
import { BLOG_GATEWAY } from './features/blog/domain';
import { HttpBlogGateway } from './features/blog/infrastructure';
import { BOOKING_GATEWAY } from './features/booking/domain';
import { HttpBookingGateway } from './features/booking/infrastructure';

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
      withViewTransitions(),
    ),
    provideHttpClient(withFetch()),
    provideAppInitializer(initializeSeo()),
    {
      provide: IMAGE_CONFIG,
      useValue: {
        breakpoints: [640, 768, 1024, 1280, 1920],
      },
    },
    { provide: PROJECTS_GATEWAY, useClass: HttpProjectsGateway },
    { provide: PROFILE_GATEWAY, useClass: HttpProfileGateway },
    { provide: CONTACT_GATEWAY, useClass: HttpContactGateway },
    { provide: HOME_GATEWAY, useClass: HttpHomeGateway },
    { provide: BLOG_GATEWAY, useClass: HttpBlogGateway },
    { provide: BOOKING_GATEWAY, useClass: HttpBookingGateway },
  ],
};
