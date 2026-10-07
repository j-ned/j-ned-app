import type {
  DailyChartPoint,
  EntityStat,
  MetricEntry,
  StatsOverview,
} from '../domain/models/analytics.types';

export function makeStatsOverview(overrides: Partial<StatsOverview> = {}): StatsOverview {
  return {
    visitors: 42,
    pageviews: 56,
    sessions: 42,
    bounces: 37,
    bounceRate: 88.1,
    avgDuration: 22,
    projectClicks: 0,
    articleViews: 0,
    cvDownloads: 0,
    ctaClicks: 0,
    ...overrides,
  };
}

export function makeChartPoint(overrides: Partial<DailyChartPoint> = {}): DailyChartPoint {
  return { date: '2026-09-07', visitors: 0, pageviews: 0, ...overrides };
}

export function makeMetricEntry(overrides: Partial<MetricEntry> = {}): MetricEntry {
  return { name: 'google.com', count: 18, ...overrides };
}

export function makeEntityStat(overrides: Partial<EntityStat> = {}): EntityStat {
  return { entityId: 'portfolio', entityTitle: 'Portfolio', count: 7, ...overrides };
}
