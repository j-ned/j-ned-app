import { Hono } from 'hono';
import type { RequireAuth } from '../auth/require-auth';
import {
  clientIp,
  jsonBody,
  queryParams,
  reply,
  type AppEnv,
  visitorCountry,
} from '../common/http';
import { TRACK_THROTTLE, throttle, throttleSession } from '../common/throttle';
import type { AnalyticsStatsService } from './analytics-stats.service';
import type { AnalyticsTrackerService } from './analytics-tracker.service';
import {
  dateRangeQuerySchema,
  eventsQuerySchema,
  metricsQuerySchema,
} from './dto/date-range-query.dto';
import { trackEventSchema } from './dto/track-event.dto';

// Collecte publique comptée par IP ; statistiques de l'admin comptées par compte, chaque agrégation
// étant une requête coûteuse.
export function analyticsRoutes(
  tracker: AnalyticsTrackerService,
  stats: AnalyticsStatsService,
  requireAuth: RequireAuth,
) {
  return (
    new Hono<AppEnv>()
      // Page vue ou événement, envoyé en fire-and-forget : 204 même si le hit est écarté (bot…).
      .post('/track', throttle(TRACK_THROTTLE), async (c) => {
        const dto = await jsonBody(c, trackEventSchema);
        await tracker.track(
          dto,
          clientIp(c),
          c.req.header('user-agent') ?? '',
          visitorCountry(c),
        );
        return c.body(null, 204);
      })

      .get('/stats/overview', throttleSession(requireAuth), async (c) =>
        reply(c, await stats.overview(queryParams(c, dateRangeQuerySchema))),
      )

      .get('/stats/chart', throttleSession(requireAuth), async (c) =>
        reply(c, await stats.chart(queryParams(c, dateRangeQuerySchema))),
      )

      // Top N par url | referrer | browser | country | os.
      .get('/stats/metrics', throttleSession(requireAuth), async (c) =>
        reply(c, await stats.metrics(queryParams(c, metricsQuerySchema))),
      )

      // Visites actives sur les 5 dernières minutes.
      .get('/stats/active', throttleSession(requireAuth), async (c) =>
        reply(c, await stats.active()),
      )

      .get('/stats/projects', throttleSession(requireAuth), async (c) =>
        reply(c, await stats.projects(queryParams(c, dateRangeQuerySchema))),
      )

      .get('/stats/articles', throttleSession(requireAuth), async (c) =>
        reply(c, await stats.articles(queryParams(c, dateRangeQuerySchema))),
      )

      .get('/stats/articles-read', throttleSession(requireAuth), async (c) =>
        reply(
          c,
          await stats.articlesRead(queryParams(c, dateRangeQuerySchema)),
        ),
      )

      .get('/stats/cta', throttleSession(requireAuth), async (c) =>
        reply(c, await stats.cta(queryParams(c, dateRangeQuerySchema))),
      )

      // Comptes par entityId : placement (contact_submit) ou canal (outbound_click).
      .get('/stats/events', throttleSession(requireAuth), async (c) =>
        reply(c, await stats.events(queryParams(c, eventsQuerySchema))),
      )

      .get('/stats/cv-downloads', throttleSession(requireAuth), async (c) =>
        reply(c, await stats.cvDownloads(queryParams(c, dateRangeQuerySchema))),
      )
  );
}
