import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import type { SQL } from 'drizzle-orm';
import { eq, gte, lte, and, sql, desc, count, countDistinct } from 'drizzle-orm';
import { db } from '../db/client.js';
import { pageView, analyticsEvent, dailyStat } from '../db/schema';
import { authMiddleware } from '../middleware/auth.js';
import { rateLimiter } from '../middleware/rate-limit.js';
import { trackEventSchema } from '../schemas/analytics.js';
import { generateSessionHash, parseUserAgent, getCountry, getClientIp } from '../services/analytics-tracker.js';

const analytics = new Hono();

function dateFilters(query: Record<string, string | undefined>): SQL | undefined {
  const conditions = [];
  if (query['startDate']) {
    conditions.push(gte(pageView.createdAt, new Date(query['startDate'])));
  }
  if (query['endDate']) {
    conditions.push(lte(pageView.createdAt, new Date(query['endDate'])));
  }
  return conditions.length > 0 ? and(...conditions) : undefined;
}

function dailyStatDateFilters(query: Record<string, string | undefined>): SQL | undefined {
  const conditions = [];
  if (query['startDate']) {
    conditions.push(gte(dailyStat.date, query['startDate']));
  }
  if (query['endDate']) {
    conditions.push(lte(dailyStat.date, query['endDate']));
  }
  return conditions.length > 0 ? and(...conditions) : undefined;
}

// POST /analytics/track
analytics.post('/track',
  rateLimiter({ windowMs: 1_000, max: 10 }),
  zValidator('json', trackEventSchema),
  async (c) => {
    const data = c.req.valid('json');
    const ip = getClientIp(c.req.raw.headers);
    const userAgent = c.req.header('user-agent') ?? '';
    const today = new Date().toISOString().split('T')[0]!;
    const sessionHash = generateSessionHash(ip, userAgent, today);
    const { browser, os } = parseUserAgent(userAgent);
    const country = getCountry(ip);

    if (data.type === 'page_view') {
      await db.insert(pageView).values({
        sessionHash,
        url: data.url ?? '',
        referrer: data.referrer,
        browser,
        os,
        country,
        duration: 0,
      });
    } else if (data.type === 'page_duration' && data.duration) {
      await db.update(pageView)
        .set({ duration: data.duration })
        .where(and(
          eq(pageView.sessionHash, sessionHash),
          eq(pageView.url, data.url ?? ''),
        ));
    } else {
      await db.insert(analyticsEvent).values({
        sessionHash,
        eventType: data.type,
        entityId: data.entityId,
        entityTitle: data.entityTitle,
      });
    }

    return c.body(null, 204);
  },
);

// GET /analytics/stats/overview
analytics.get('/stats/overview', authMiddleware, async (c) => {
  const query = c.req.query();
  const where = dateFilters(query);

  const eventConditions = [];
  if (query['startDate']) eventConditions.push(gte(analyticsEvent.createdAt, new Date(query['startDate'])));
  if (query['endDate']) eventConditions.push(lte(analyticsEvent.createdAt, new Date(query['endDate'])));
  const eventWhere = eventConditions.length > 0 ? and(...eventConditions) : undefined;

  const [pvCount, visitors, avgDur, bounceResult, eventCounts] = await Promise.all([
    db.select({ count: count() }).from(pageView).where(where).then(r => r[0]),
    db.select({ count: countDistinct(pageView.sessionHash) }).from(pageView).where(where).then(r => r[0]),
    db.select({ avg: sql<number>`coalesce(avg(${pageView.duration}), 0)::int` }).from(pageView).where(where).then(r => r[0]),
    db.execute(
      where
        ? sql`SELECT count(*)::int as bounces FROM (SELECT "session_hash" FROM "page_view" WHERE ${where} GROUP BY "session_hash" HAVING count(*) = 1) as bounce_sessions`
        : sql`SELECT count(*)::int as bounces FROM (SELECT "session_hash" FROM "page_view" GROUP BY "session_hash" HAVING count(*) = 1) as bounce_sessions`
    ),
    db.select({
      eventType: analyticsEvent.eventType,
      count: sql<number>`count(*)::int`,
    }).from(analyticsEvent).where(eventWhere).groupBy(analyticsEvent.eventType),
  ]);

  const totalPageviews = pvCount?.count ?? 0;
  const totalVisitors = visitors?.count ?? 0;
  const bounces = Number((bounceResult as Record<string, unknown>[])[0]?.['bounces'] ?? 0);
  const bounceRate = totalVisitors > 0 ? (bounces / totalVisitors) * 100 : 0;
  const projectClicks = eventCounts.find(e => e.eventType === 'project_click')?.count ?? 0;
  const articleViews = eventCounts.find(e => e.eventType === 'article_view')?.count ?? 0;
  const cvDownloads = eventCounts.find(e => e.eventType === 'cv_download')?.count ?? 0;

  return c.json({
    visitors: totalVisitors,
    pageviews: totalPageviews,
    sessions: totalVisitors,
    bounces,
    bounceRate,
    avgDuration: avgDur?.avg ?? 0,
    projectClicks,
    articleViews,
    cvDownloads,
  });
});

// GET /analytics/stats/chart
analytics.get('/stats/chart', authMiddleware, async (c) => {
  const query = c.req.query();
  const where = dailyStatDateFilters(query);

  const data = await db.select({
    date: dailyStat.date,
    visitors: dailyStat.visitors,
    pageviews: dailyStat.pageviews,
  }).from(dailyStat).where(where).orderBy(dailyStat.date);

  return c.json(data);
});

// GET /analytics/stats/metrics
analytics.get('/stats/metrics', authMiddleware, async (c) => {
  const query = c.req.query();
  const type = query['type'];

  if (!type || !['url', 'referrer', 'browser', 'country', 'os'].includes(type)) {
    return c.json({ error: 'type parameter required (url, referrer, browser, country, os)' }, 400);
  }

  const where = dateFilters(query);
  const column = pageView[type as keyof typeof pageView._.columns] as typeof pageView.url;

  const data = await db.select({
    name: column,
    count: sql<number>`count(*)::int`,
  }).from(pageView)
    .where(where)
    .groupBy(column)
    .orderBy(desc(sql`count(*)`))
    .limit(20);

  return c.json(data);
});

// GET /analytics/stats/active
analytics.get('/stats/active', authMiddleware, async (c) => {
  const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);

  const [result] = await db.select({
    count: countDistinct(pageView.sessionHash),
  }).from(pageView)
    .where(gte(pageView.createdAt, fiveMinAgo));

  return c.json({ count: result?.count ?? 0 });
});

// GET /analytics/stats/projects
analytics.get('/stats/projects', authMiddleware, async (c) => {
  const query = c.req.query();
  const conditions = [eq(analyticsEvent.eventType, 'project_click')];
  if (query['startDate']) conditions.push(gte(analyticsEvent.createdAt, new Date(query['startDate'])));
  if (query['endDate']) conditions.push(lte(analyticsEvent.createdAt, new Date(query['endDate'])));

  const data = await db.select({
    entityId: analyticsEvent.entityId,
    entityTitle: analyticsEvent.entityTitle,
    count: sql<number>`count(*)::int`,
  }).from(analyticsEvent)
    .where(and(...conditions))
    .groupBy(analyticsEvent.entityId, analyticsEvent.entityTitle)
    .orderBy(desc(sql`count(*)`));

  return c.json(data);
});

// GET /analytics/stats/articles
analytics.get('/stats/articles', authMiddleware, async (c) => {
  const query = c.req.query();
  const conditions = [eq(analyticsEvent.eventType, 'article_view')];
  if (query['startDate']) conditions.push(gte(analyticsEvent.createdAt, new Date(query['startDate'])));
  if (query['endDate']) conditions.push(lte(analyticsEvent.createdAt, new Date(query['endDate'])));

  const data = await db.select({
    entityId: analyticsEvent.entityId,
    entityTitle: analyticsEvent.entityTitle,
    count: sql<number>`count(*)::int`,
  }).from(analyticsEvent)
    .where(and(...conditions))
    .groupBy(analyticsEvent.entityId, analyticsEvent.entityTitle)
    .orderBy(desc(sql`count(*)`));

  return c.json(data);
});

// GET /analytics/stats/cv-downloads
analytics.get('/stats/cv-downloads', authMiddleware, async (c) => {
  const query = c.req.query();
  const conditions = [eq(analyticsEvent.eventType, 'cv_download')];
  if (query['startDate']) conditions.push(gte(analyticsEvent.createdAt, new Date(query['startDate'])));
  if (query['endDate']) conditions.push(lte(analyticsEvent.createdAt, new Date(query['endDate'])));

  const [result] = await db.select({
    count: sql<number>`count(*)::int`,
  }).from(analyticsEvent)
    .where(and(...conditions));

  return c.json({ count: result?.count ?? 0 });
});

export default analytics;
