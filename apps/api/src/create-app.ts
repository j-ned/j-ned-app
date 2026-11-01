import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { secureHeaders } from 'hono/secure-headers';
import { analyticsRoutes } from './analytics/analytics.routes';
import { authRoutes } from './auth/auth.routes';
import { requireAuth } from './auth/require-auth';
import { blogRoutes } from './blog/blog.routes';
import { crossOriginProtection } from './common/cross-origin';
import { handleError, handleNotFound } from './common/error-handler';
import type { AppEnv } from './common/http';
import { requestLogger } from './common/request-logger';
import type { AppConfigService } from './config/app-config.service';
import { contactRoutes } from './contact/contact.routes';
import { cvRoutes } from './cv/cv.routes';
import type { Database } from './database/drizzle.types';
import { healthRoutes } from './health/health.routes';
import { profileRoutes } from './profile/profile.routes';
import { projectsRoutes } from './projects/projects.routes';
import { runtimeConfigRoutes } from './runtime-config/runtime-config.routes';
import type { Services } from './services';
import { storageRoutes } from './storage/storage.routes';
import { workshopGuideRoutes } from './workshop-guide/workshop-guide.routes';

/**
 * Application HTTP : en-têtes de sécurité, CORS (transition, ADR-0034), contrôle d'origine sur les
 * écritures, puis les routes de chaque module sous `/api`. Toute erreur et toute route inconnue
 * répondent au même format JSON.
 */
export function createApp(
  config: AppConfigService,
  db: Database,
  services: Services,
): Hono<AppEnv> {
  const session = requireAuth(services.jwt, services.users);

  return (
    // `strict: false` : `/api/cv/` vaut `/api/cv`, comme le routage d'Express.
    new Hono<AppEnv>({ strict: false })
      .use(requestLogger)
      // CSP inutile (l'API ne sert que du JSON et des images) ; CORP `cross-origin` : les images de
      // /api/storage sont chargées depuis le site.
      .use(secureHeaders({ crossOriginResourcePolicy: 'cross-origin' }))
      .use(cors({ origin: config.corsOrigins, credentials: true }))
      .use(crossOriginProtection(config.corsOrigins))
      .route('/api/health', healthRoutes(db))
      .route('/api/config', runtimeConfigRoutes(config))
      .route(
        '/api/auth',
        authRoutes({ auth: services.auth, config, requireAuth: session }),
      )
      .route(
        '/api/storage',
        storageRoutes(services.storage, services.shareCards),
      )
      .route('/api/contact', contactRoutes(services.contact, session))
      .route(
        '/api/projects',
        projectsRoutes(services.projects, services.projectImages, session),
      )
      .route(
        '/api/blog',
        blogRoutes(services.blog, services.blogContentImages, session),
      )
      .route(
        '/api/profile',
        profileRoutes(services.profile, services.profilePortrait, session),
      )
      .route(
        '/api/workshop-guide',
        workshopGuideRoutes(services.workshopGuide, session),
      )
      .route('/api/cv', cvRoutes(services.cv, session))
      .route(
        '/api/analytics',
        analyticsRoutes(
          services.analyticsTracker,
          services.analyticsStats,
          session,
        ),
      )
      .notFound(handleNotFound)
      .onError(handleError)
  );
}
