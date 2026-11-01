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
import { TRACK_THROTTLE, throttle } from '../common/throttle';
import type { AnalyticsStatsService } from './analytics-stats.service';
import type { AnalyticsTrackerService } from './analytics-tracker.service';
import {
  DateRangeQueryDto,
  EventsQueryDto,
  MetricsQueryDto,
} from './dto/date-range-query.dto';
import { TrackEventDto } from './dto/track-event.dto';

/**
 * `/api/analytics` : collecte publique (seule route limitée en débit) et statistiques de l'admin,
 * exemptées du quota global.
 */
export function analyticsRoutes(
  tracker: AnalyticsTrackerService,
  stats: AnalyticsStatsService,
  requireAuth: RequireAuth,
) {
  return (
    new Hono<AppEnv>()
      // Page vue ou événement, envoyé en fire-and-forget : 204 même si le hit est écarté (bot…).
      .post('/track', throttle(TRACK_THROTTLE), async (c) => {
        const dto = await jsonBody(c, TrackEventDto);
        await tracker.track(
          dto,
          clientIp(c),
          c.req.header('user-agent') ?? '',
          visitorCountry(c),
        );
        return c.body(null, 204);
      })

      .get('/stats/overview', requireAuth, async (c) =>
        reply(c, await stats.overview(await queryParams(c, DateRangeQueryDto))),
      )

      .get('/stats/chart', requireAuth, async (c) =>
        reply(c, await stats.chart(await queryParams(c, DateRangeQueryDto))),
      )

      // Top N par url | referrer | browser | country | os.
      .get('/stats/metrics', requireAuth, async (c) =>
        reply(c, await stats.metrics(await queryParams(c, MetricsQueryDto))),
      )

      // Visites actives sur les 5 dernières minutes.
      .get('/stats/active', requireAuth, async (c) =>
        reply(c, await stats.active()),
      )

      .get('/stats/projects', requireAuth, async (c) =>
        reply(c, await stats.projects(await queryParams(c, DateRangeQueryDto))),
      )

      .get('/stats/articles', requireAuth, async (c) =>
        reply(c, await stats.articles(await queryParams(c, DateRangeQueryDto))),
      )

      .get('/stats/articles-read', requireAuth, async (c) =>
        reply(
          c,
          await stats.articlesRead(await queryParams(c, DateRangeQueryDto)),
        ),
      )

      .get('/stats/cta', requireAuth, async (c) =>
        reply(c, await stats.cta(await queryParams(c, DateRangeQueryDto))),
      )

      // Comptes par entityId : placement (contact_submit) ou canal (outbound_click).
      .get('/stats/events', requireAuth, async (c) =>
        reply(c, await stats.events(await queryParams(c, EventsQueryDto))),
      )

      .get('/stats/cv-downloads', requireAuth, async (c) =>
        reply(
          c,
          await stats.cvDownloads(await queryParams(c, DateRangeQueryDto)),
        ),
      )
  );
}
