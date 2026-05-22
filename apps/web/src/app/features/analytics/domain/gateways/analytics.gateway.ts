import type { Observable } from 'rxjs';
import type {
  ActiveVisitors,
  DailyChartPoint,
  EntityStat,
  MetricEntry,
  StatsOverview,
  TrackPayload,
} from '../models/analytics.types';

export abstract class AnalyticsGateway {
  abstract trackPageView(url: string): void;
  abstract trackPageDuration(url: string, duration: number): void;
  abstract trackProjectClick(projectId: string, title: string): void;
  abstract trackArticleView(articleId: string, title: string): void;
  abstract trackCvDownload(): void;

  abstract sendBeacon(payload: TrackPayload): void;

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
  abstract getCvDownloadCount(startDate?: string, endDate?: string): Observable<number>;
}
