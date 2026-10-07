import { of } from 'rxjs';
import type { AnalyticsGateway } from '../domain/gateways/analytics.gateway';
import { makeStatsOverview } from './analytics-builders';

export function stubAnalyticsGateway(overrides: Partial<AnalyticsGateway> = {}): AnalyticsGateway {
  return {
    trackPageView: () => undefined,
    trackPageDuration: () => undefined,
    trackProjectClick: () => undefined,
    trackArticleView: () => undefined,
    trackArticleRead: () => undefined,
    trackCvDownload: () => undefined,
    trackCtaClick: () => undefined,
    sendBeacon: () => undefined,
    getOverview: () => of(makeStatsOverview()),
    getChart: () => of([]),
    getMetrics: () => of([]),
    getActiveVisitors: () => of({ count: 0 }),
    getProjectStats: () => of([]),
    getArticleStats: () => of([]),
    getArticleReadStats: () => of([]),
    getCtaStats: () => of([]),
    getCvDownloadCount: () => of(0),
    ...overrides,
  };
}
