import type { Observable } from 'rxjs';
import type {
  ActiveVisitors,
  ContactPlacement,
  DailyChartPoint,
  EntityStat,
  EventCount,
  EventCountType,
  MetricEntry,
  OutboundChannel,
  SectionId,
  StatsOverview,
} from '../models/analytics.types';

export abstract class AnalyticsGateway {
  abstract trackPageView(url: string): void;
  abstract trackPageDuration(url: string, duration: number): void;
  abstract trackProjectClick(projectId: string, title: string): void;
  abstract trackArticleView(articleId: string, title: string): void;
  abstract trackArticleRead(articleId: string, title: string): void;
  abstract trackCvDownload(): void;
  abstract trackCtaClick(ctaId: string, label: string): void;
  abstract trackContactSubmit(placement: ContactPlacement): void;
  abstract trackOutboundClick(channel: OutboundChannel, path: string): void;
  abstract trackSectionView(section: SectionId, path: string): void;

  abstract getOverview(startDate?: string, endDate?: string): Observable<StatsOverview>;
  abstract getChart(startDate?: string, endDate?: string): Observable<DailyChartPoint[]>;
  abstract getMetrics(
    type: string,
    startDate?: string,
    endDate?: string,
  ): Observable<MetricEntry[]>;
  abstract getActiveVisitors(): Observable<ActiveVisitors>;
  abstract getProjectStats(startDate?: string, endDate?: string): Observable<EntityStat[]>;
  abstract getArticleStats(startDate?: string, endDate?: string): Observable<EntityStat[]>;
  abstract getArticleReadStats(startDate?: string, endDate?: string): Observable<EntityStat[]>;
  abstract getCtaStats(startDate?: string, endDate?: string): Observable<EntityStat[]>;
  abstract getCvDownloadCount(startDate?: string, endDate?: string): Observable<number>;
  abstract getEventCounts(
    type: EventCountType,
    startDate?: string,
    endDate?: string,
  ): Observable<EventCount[]>;
}
