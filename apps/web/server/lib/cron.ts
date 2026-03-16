import cron from 'node-cron';
import { db } from '../db/client.js';
import { pageView, analyticsEvent, dailyStat } from '../db/schema';
import { sql, gte, lt, and, count, countDistinct } from 'drizzle-orm';

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

      // Run all independent aggregation queries in parallel
      const [pvCount, visitors, totalDur, bounceResult, eventCounts] = await Promise.all([
        db.select({ count: count() }).from(pageView).where(dateFilter).then(r => r[0]),
        db.select({ count: countDistinct(pageView.sessionHash) }).from(pageView).where(dateFilter).then(r => r[0]),
        db.select({ sum: sql<number>`coalesce(sum(${pageView.duration}), 0)::int` }).from(pageView).where(dateFilter).then(r => r[0]),
        db.execute(sql`
          SELECT count(*)::int as bounces FROM (
            SELECT "session_hash" FROM "page_view"
            WHERE "created_at" >= ${startOfDay} AND "created_at" < ${endOfDay}
            GROUP BY "session_hash"
            HAVING count(*) = 1
          ) as bounce_sessions
        `),
        db.select({
          eventType: analyticsEvent.eventType,
          count: sql<number>`count(*)::int`,
        }).from(analyticsEvent).where(eventDateFilter).groupBy(analyticsEvent.eventType),
      ]);

      const bounces = Number((bounceResult as Record<string, unknown>[])[0]?.['bounces'] ?? 0);
      const projectClicks = eventCounts.find(e => e.eventType === 'project_click')?.count ?? 0;
      const articleViews = eventCounts.find(e => e.eventType === 'article_view')?.count ?? 0;
      const cvDownloads = eventCounts.find(e => e.eventType === 'cv_download')?.count ?? 0;

      const statValues = {
        visitors: visitors?.count ?? 0,
        pageviews: pvCount?.count ?? 0,
        sessions: visitors?.count ?? 0,
        bounces,
        totalDuration: totalDur?.sum ?? 0,
        projectClicks,
        articleViews,
        cvDownloads,
      };

      // UPSERT: insert or update on conflict (date is unique)
      await db.insert(dailyStat)
        .values({ date: dateStr, ...statValues })
        .onConflictDoUpdate({
          target: dailyStat.date,
          set: { ...statValues, updatedAt: new Date() },
        });

      console.log(`Daily stats aggregated for ${dateStr}`);
    } catch (error) {
      console.error('Error aggregating daily stats:', error);
    }
  });

  console.log('Cron jobs started');
}
