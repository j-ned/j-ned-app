import { Hono } from 'hono';
import type { AppConfigService } from '../config/app-config.service';
import type { AppEnv } from '../common/http';
import { PUBLIC_READ_THROTTLE, throttle } from '../common/throttle';

export type RuntimeConfigResponse = {
  sentry: { dsn: string; environment: string; release: string };
};

/**
 * `/api/config` : configuration publique lue par le navigateur au démarrage (Sentry du front : DSN
 * d'un projet distinct, public par nature). Cache navigateur de 5 min ; le cache CDN repart à
 * chaque déploiement, seul moment où cette configuration change.
 */
export function runtimeConfigRoutes(config: AppConfigService) {
  return new Hono<AppEnv>().get('/', throttle(PUBLIC_READ_THROTTLE), (c) => {
    c.header('Cache-Control', 'public, max-age=300');
    const body: RuntimeConfigResponse = {
      sentry: {
        dsn: config.sentryFrontendDsn ?? '',
        environment: config.nodeEnv,
        release: config.sentryRelease ?? '',
      },
    };
    return c.json(body);
  });
}
