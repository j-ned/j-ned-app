import { pgTable, text, integer, timestamp, json, index, date } from 'drizzle-orm/pg-core';

export const pageView = pgTable('page_view', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  sessionHash: text('session_hash').notNull(),
  url: text('url').notNull(),
  referrer: text('referrer'),
  browser: text('browser'),
  os: text('os'),
  country: text('country'),
  duration: integer('duration').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => [
  index('idx_page_view_created_at').on(table.createdAt),
  index('idx_page_view_session_created').on(table.sessionHash, table.createdAt),
  index('idx_page_view_url_created').on(table.url, table.createdAt),
]);

export const analyticsEvent = pgTable('analytics_event', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  sessionHash: text('session_hash').notNull(),
  eventType: text('event_type').notNull(),
  entityId: text('entity_id'),
  entityTitle: text('entity_title'),
  metadata: json('metadata'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => [
  index('idx_analytics_event_type_created').on(table.eventType, table.createdAt),
  index('idx_analytics_event_type_entity').on(table.eventType, table.entityId),
]);

export const dailyStat = pgTable('daily_stat', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  date: date('date').notNull().unique(),
  visitors: integer('visitors').notNull().default(0),
  pageviews: integer('pageviews').notNull().default(0),
  sessions: integer('sessions').notNull().default(0),
  bounces: integer('bounces').notNull().default(0),
  totalDuration: integer('total_duration').notNull().default(0),
  projectClicks: integer('project_clicks').notNull().default(0),
  articleViews: integer('article_views').notNull().default(0),
  cvDownloads: integer('cv_downloads').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => [
  index('idx_daily_stat_date').on(table.date),
]);
