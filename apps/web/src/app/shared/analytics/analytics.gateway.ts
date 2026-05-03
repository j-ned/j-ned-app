import { InjectionToken } from '@angular/core';
import type { Observable } from 'rxjs';
import type {
  ActiveVisitors,
  DailyChartPoint,
  EntityStat,
  MetricEntry,
  StatsOverview,
  TrackPayload,
} from './analytics.types';

export abstract class AnalyticsGateway {
  // --- Tracking write-side (5 méthodes — fire-and-forget, void) ---
  abstract trackPageView(url: string): void;
  abstract trackPageDuration(url: string, duration: number): void;
  abstract trackProjectClick(projectId: string, title: string): void;
  abstract trackArticleView(articleId: string, title: string): void;
  abstract trackCvDownload(): void;

  // --- Beacon write-side (1 méthode — sync, navigator.sendBeacon, pas HTTP) ---
  abstract sendBeacon(payload: TrackPayload): void;

  // --- Admin read-side (7 méthodes — Observable<T>, EAK convention) ---
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

export const ANALYTICS_GATEWAY = new InjectionToken<AnalyticsGateway>('ANALYTICS_GATEWAY', {
  providedIn: 'root',
  factory: (): never => {
    throw new Error('ANALYTICS_GATEWAY must be provided in app.config.ts');
  },
});
