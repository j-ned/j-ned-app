import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import {
  provideRouter,
  withComponentInputBinding,
  withInMemoryScrolling,
  withViewTransitions,
} from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { IMAGE_CONFIG } from '@angular/common';

import { routes } from './app.routes';

// Gateway tokens
import { PROJECTS_GATEWAY } from './core/projects/gateways';
import { PROFILE_GATEWAY } from './core/profile/gateways';
import { CONTACT_GATEWAY } from './core/contact/gateways';
import { SEO_GATEWAY } from './core/seo/gateways';
import { HOME_GATEWAY } from './core/home/gateways';

// InMemory implementations
import { InMemoryProjectsGateway } from './infrastructure/projects/in-memory/in-memory-projects.gateway';
import { InMemoryProfileGateway } from './infrastructure/profile/in-memory/in-memory-profile.gateway';
import { InMemoryContactGateway } from './infrastructure/contact/in-memory/in-memory-contact.gateway';
import { InMemorySeoGateway } from './infrastructure/seo/in-memory/in-memory-seo.gateway';
import { InMemoryHomeGateway } from './infrastructure/home/in-memory/in-memory-home.gateway';

// HTTP implementations (ready for backend)
// import { HttpProjectsGateway } from './infrastructure/projects/http/http-projects.gateway';
// import { HttpProfileGateway } from './infrastructure/profile/http/http-profile.gateway';
// import { HttpContactGateway } from './infrastructure/contact/http/http-contact.gateway';
// import { HttpSeoGateway } from './infrastructure/seo/http/http-seo.gateway';
// import { HttpHomeGateway } from './infrastructure/home/http/http-home.gateway';

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
    {
      provide: IMAGE_CONFIG,
      useValue: {
        breakpoints: [640, 768, 1024, 1280, 1920]
      }
    },

    // ========================================
    // GATEWAY PROVIDERS - ONE LINE TO CHANGE!
    // ========================================

    // Projects
    { provide: PROJECTS_GATEWAY, useClass: InMemoryProjectsGateway },
    // { provide: PROJECTS_GATEWAY, useClass: HttpProjectsGateway },

    // Profile
    { provide: PROFILE_GATEWAY, useClass: InMemoryProfileGateway },
    // { provide: PROFILE_GATEWAY, useClass: HttpProfileGateway },

    // Contact
    { provide: CONTACT_GATEWAY, useClass: InMemoryContactGateway },
    // { provide: CONTACT_GATEWAY, useClass: HttpContactGateway },

    // SEO
    { provide: SEO_GATEWAY, useClass: InMemorySeoGateway },
    // { provide: SEO_GATEWAY, useClass: HttpSeoGateway },

    // Home
    { provide: HOME_GATEWAY, useClass: InMemoryHomeGateway },
    // { provide: HOME_GATEWAY, useClass: HttpHomeGateway },
  ],
};
