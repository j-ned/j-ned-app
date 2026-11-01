import type { RequireAuth } from '../auth/require-auth';
import { UnauthorizedException } from '../common/http-errors';
import { TRACK_THROTTLE } from '../common/throttle';
import { testApp } from '../common/test-app';
import type { AnalyticsStatsService } from './analytics-stats.service';
import type { AnalyticsTrackerService } from './analytics-tracker.service';
import { analyticsRoutes } from './analytics.routes';

/** Routes montées sous leur préfixe avec le gestionnaire d'erreurs de l'API ; services et JWT remplacés. */
describe('analytics routes', () => {
  const stats = {
    events: jest.fn(),
    overview: jest.fn(),
    active: jest.fn(),
  };
  const tracker = { track: jest.fn() };
  const passThrough: RequireAuth = async (_c, next) => {
    await next();
  };
  const denyAll: RequireAuth = () => {
    throw new UnauthorizedException();
  };
  const build = (requireAuth: RequireAuth) =>
    testApp(
      '/api/analytics',
      analyticsRoutes(
        tracker as unknown as AnalyticsTrackerService,
        stats as unknown as AnalyticsStatsService,
        requireAuth,
      ),
    );
  const app = build(passThrough);

  beforeEach(() => jest.clearAllMocks());

  const getEvents = (query: Record<string, string>, target = app) =>
    target.request(
      `/api/analytics/stats/events?${new URLSearchParams(query).toString()}`,
    );

  const track = (body: unknown, ip = '203.0.113.10', target = app) =>
    target.request('/api/analytics/track', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-forwarded-for': ip,
        'user-agent': 'Mozilla/5.0 test',
      },
      body: JSON.stringify(body),
    });

  describe('GET stats/events', () => {
    it('Given no admin session, When requested, Then 401 without calling the service', async () => {
      const res = await getEvents({ type: 'contact_submit' }, build(denyAll));

      expect(res.status).toBe(401);
      expect(stats.events).not.toHaveBeenCalled();
    });

    it.each(['contact_submit', 'outbound_click'])(
      'Given type=%s, When requested, Then 200 with the counts',
      async (type) => {
        const rows = [{ entityId: 'email', count: 2 }];
        stats.events.mockResolvedValueOnce(rows);

        const res = await getEvents({
          type,
          startDate: '2026-10-01',
          limit: '5',
        });

        expect(res.status).toBe(200);
        expect(await res.json()).toEqual(rows);
        expect(stats.events).toHaveBeenCalledWith(
          expect.objectContaining({ type, startDate: '2026-10-01', limit: 5 }),
        );
      },
    );

    it.each([['page_view'], ['cta_click'], ['']])(
      'Given type=%s (hors liste), When requested, Then 400 without calling the service',
      async (type) => {
        const res = await getEvents({ type });

        expect(res.status).toBe(400);
        expect(stats.events).not.toHaveBeenCalled();
      },
    );
  });

  describe('admin stats', () => {
    it.each([
      'overview',
      'chart',
      'metrics?type=url',
      'active',
      'projects',
      'articles',
      'articles-read',
      'cta',
      'events?type=contact_submit',
      'cv-downloads',
    ])('Given no admin session, When GET stats/%s, Then 401', async (path) => {
      const res = await build(denyAll).request(`/api/analytics/stats/${path}`);

      expect(res.status).toBe(401);
    });

    it('Given an admin, When the overview is requested many times, Then it is never throttled', async () => {
      stats.overview.mockResolvedValue({ visits: 1 });

      const statuses: number[] = [];
      for (let i = 0; i < 15; i += 1)
        statuses.push(
          (await app.request('/api/analytics/stats/overview')).status,
        );

      expect(statuses.every((s) => s === 200)).toBe(true);
    });

    it('Given an admin, When active sessions are requested, Then 200 with the service value', async () => {
      stats.active.mockResolvedValueOnce({ count: 3 });

      const res = await app.request('/api/analytics/stats/active');

      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ count: 3 });
    });
  });

  describe('POST track (allow-list)', () => {
    it('Given an outbound_click on a known channel, When posted, Then 204 without body and tracked with the visitor IP and user agent', async () => {
      const res = await track({
        type: 'outbound_click',
        entityId: 'linkedin',
        entityTitle: '/',
      });

      expect(res.status).toBe(204);
      expect(await res.text()).toBe('');
      expect(tracker.track).toHaveBeenCalledTimes(1);
      expect(tracker.track).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'outbound_click',
          entityId: 'linkedin',
        }),
        '203.0.113.10',
        'Mozilla/5.0 test',
      );
    });

    it.each([
      [{ type: 'outbound_click', entityId: 'twitter' }],
      [{ type: 'contact_submit', entityId: 'Home' }],
      [{ type: 'section_view', entityId: 'footer' }],
      [{ type: 'form_content', entityId: 'x' }],
    ])('Given %o, When posted, Then 400 and nothing tracked', async (body) => {
      const res = await track(body);

      expect(res.status).toBe(400);
      expect(tracker.track).not.toHaveBeenCalled();
    });
  });

  describe('POST track (throttle)', () => {
    it('Given the track quota, Then it is 10 hits per second', () => {
      expect(TRACK_THROTTLE).toEqual({ limit: 10, ttlMs: 1_000 });
    });

    it('Given a visitor, When it posts an 11th hit within the second, Then it gets 429', async () => {
      const statuses: number[] = [];
      for (let i = 0; i < 11; i += 1)
        statuses.push(
          (await track({ type: 'page_view', url: '/' }, '203.0.113.99')).status,
        );

      expect(statuses.slice(0, 10).every((s) => s === 204)).toBe(true);
      expect(statuses[10]).toBe(429);
    });
  });
});
