import type {
  ConversionsOverview,
  DailyChartPoint,
  EngagementOverview,
  EntityStat,
  EventCount,
  MetricEntry,
  StatsOverview,
} from '../domain/models/analytics.types';

const FIRST_MEASURED_DAY = '2026-04-26';

export function makeEngagement(overrides: Partial<EngagementOverview> = {}): EngagementOverview {
  return {
    measuredSince: FIRST_MEASURED_DAY,
    measuredSessions: 42,
    engagedSessions: 25,
    realBounces: 17,
    realBounceRate: 40.48,
    engagementRate: 59.52,
    thresholdSeconds: 30,
    ...overrides,
  };
}

export function makeConversions(overrides: Partial<ConversionsOverview> = {}): ConversionsOverview {
  return {
    measuredSince: FIRST_MEASURED_DAY,
    contactSubmits: 0,
    contactClicks: 0,
    profileClicks: 0,
    demoClicks: 0,
    contactSectionViews: 0,
    ...overrides,
  };
}

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
    durationCoverage: 62.5,
    detailSince: FIRST_MEASURED_DAY,
    engagement: makeEngagement(),
    conversions: makeConversions(),
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

export function makeEventCount(overrides: Partial<EventCount> = {}): EventCount {
  return { entityId: 'home', count: 1, ...overrides };
}
