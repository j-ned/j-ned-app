import cron from 'node-cron';
import { db } from '../db/client.js';
import { pageView, analyticsEvent, dailyStat } from '../db/schema';
import { sql, eq, gte, lt, and, count, countDistinct } from 'drizzle-orm';

export function startCronJobs(): void {
  // Aggregate daily stats every day at midnight
  cron.schedule('0 0 * * *', async () => {
    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const dateStr = yesterday.toISOString().split('T')[0]!;

      const startOfDay = new Date(`${dateStr}T00:00:00Z`);
      const endOfDay = new Date(`${dateStr}T23:59:59.999Z`);
      const dateFilter = and(gte(pageView.createdAt, startOfDay), lt(pageView.createdAt, endOfDay));
      const eventDateFilter = and(gte(analyticsEvent.createdAt, startOfDay), lt(analyticsEvent.createdAt, endOfDay));

      const [pvCount] = await db.select({ count: count() }).from(pageView).where(dateFilter);
      const [visitors] = await db.select({ count: countDistinct(pageView.sessionHash) }).from(pageView).where(dateFilter);
      const [sessions] = await db.select({ count: countDistinct(pageView.sessionHash) }).from(pageView).where(dateFilter);
      const [totalDur] = await db.select({ sum: sql<number>`coalesce(sum(${pageView.duration}), 0)::int` }).from(pageView).where(dateFilter);

      // Count bounces (sessions with only 1 page view)
      const bounceResult = await db.execute(sql`
        SELECT count(*) as bounces FROM (
          SELECT "sessionHash" FROM "PageView"
          WHERE "createdAt" >= ${startOfDay} AND "createdAt" < ${endOfDay}
          GROUP BY "sessionHash"
          HAVING count(*) = 1
        ) as bounce_sessions
      `);
      const bounces = Number((bounceResult as Record<string, unknown>[])[0]?.['bounces'] ?? 0);

      // Event counts
      const eventCounts = await db.select({
        eventType: analyticsEvent.eventType,
        count: sql<number>`count(*)::int`,
      }).from(analyticsEvent).where(eventDateFilter).groupBy(analyticsEvent.eventType);

      const projectClicks = eventCounts.find(e => e.eventType === 'project_click')?.count ?? 0;
      const articleViews = eventCounts.find(e => e.eventType === 'article_view')?.count ?? 0;
      const cvDownloads = eventCounts.find(e => e.eventType === 'cv_download')?.count ?? 0;

      // Upsert daily stat
      const existing = await db.select().from(dailyStat).where(eq(dailyStat.date, dateStr)).limit(1);

      if (existing.length > 0) {
        await db.update(dailyStat).set({
          visitors: visitors?.count ?? 0,
          pageviews: pvCount?.count ?? 0,
          sessions: sessions?.count ?? 0,
          bounces,
          totalDuration: totalDur?.sum ?? 0,
          projectClicks,
          articleViews,
          cvDownloads,
          updatedAt: new Date(),
        }).where(eq(dailyStat.date, dateStr));
      } else {
        await db.insert(dailyStat).values({
          date: dateStr,
          visitors: visitors?.count ?? 0,
          pageviews: pvCount?.count ?? 0,
          sessions: sessions?.count ?? 0,
          bounces,
          totalDuration: totalDur?.sum ?? 0,
          projectClicks,
          articleViews,
          cvDownloads,
        });
      }

      console.log(`Daily stats aggregated for ${dateStr}`);
    } catch (error) {
      console.error('Error aggregating daily stats:', error);
    }
  });

  console.log('Cron jobs started');
}
