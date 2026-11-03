import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { secureHeaders } from 'hono/secure-headers';
import { analyticsRoutes } from './analytics/analytics.routes';
import { authRoutes } from './auth/auth.routes';
import { requireAuth } from './auth/require-auth';
import { blogRoutes } from './blog/blog.routes';
import { purgeContentCacheOnWrite } from './common/cdn-cache';
import { crossOriginProtection } from './common/cross-origin';
import { cronRoutes } from './cron/cron.routes';
import { handleError, handleNotFound } from './common/error-handler';
import { forwardedVisitorIp, type AppEnv } from './common/http';
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
export type AppOptions = {
  /** Purge des compteurs de quotas en base (Vercel), lancée par le cron quotidien. */
  readonly purgeRateLimits?: () => Promise<void>;
  /** Vidage du cache CDN du contenu (Vercel), après chaque écriture qui le change. */
  readonly purgeContentCache?: () => Promise<void>;
};

/** Modules dont une écriture change une page publique (le like compris) : leur cache CDN est vidé. */
const CONTENT_PATHS = [
  '/api/blog',
  '/api/projects',
  '/api/profile',
  '/api/workshop-guide',
  '/api/cv',
];

export function createApp(
  config: AppConfigService,
  db: Database,
  services: Services,
  { purgeRateLimits, purgeContentCache }: AppOptions = {},
): Hono<AppEnv> {
  const session = requireAuth(services.jwt, services.users);
  // `strict: false` : `/api/cv/` vaut `/api/cv`, comme le routage d'Express.
  const app = new Hono<AppEnv>({ strict: false });
  if (purgeContentCache) {
    const purge = purgeContentCacheOnWrite(purgeContentCache);
    // `/api/cv/*` couvre aussi `/api/cv`.
    for (const path of CONTENT_PATHS) app.use(`${path}/*`, purge);
  }

  return (
    app
      .use(forwardedVisitorIp(config.ssrForwardSecret))
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
        storageRoutes(
          services.storage,
          services.shareCards,
          services.resizedImages,
        ),
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
      .route(
        '/api/cron',
        cronRoutes({
          secret: config.cronSecret,
          aggregator: services.analyticsAggregator,
          purgeRateLimits,
        }),
      )
      .notFound(handleNotFound)
      .onError(handleError)
  );
}
