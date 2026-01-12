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
import { SeoService } from './core/seo/seo';
import { PROJECTS_GATEWAY } from './core/projects/gateways';
import { PROFILE_GATEWAY } from './core/profile/gateways';
import { CONTACT_GATEWAY } from './core/contact/gateways';
import { HOME_GATEWAY } from './core/home/gateways';
import { InMemoryProjectsGateway } from './infrastructure/projects/in-memory/in-memory-projects.gateway';
import { InMemoryProfileGateway } from './infrastructure/profile/in-memory/in-memory-profile.gateway';
import { InMemoryContactGateway } from './infrastructure/contact/in-memory/in-memory-contact.gateway';
import { InMemoryHomeGateway } from './infrastructure/home/in-memory/in-memory-home.gateway';

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
    { provide: PROJECTS_GATEWAY, useClass: InMemoryProjectsGateway },
    { provide: PROFILE_GATEWAY, useClass: InMemoryProfileGateway },
    { provide: CONTACT_GATEWAY, useClass: InMemoryContactGateway },
    { provide: HOME_GATEWAY, useClass: InMemoryHomeGateway },
  ],
};
