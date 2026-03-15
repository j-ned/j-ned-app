import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, EMPTY, firstValueFrom } from 'rxjs';
import { API_BASE_URL } from '../api';

export type StatsOverview = {
  visitors: number;
  pageviews: number;
  sessions: number;
  bounces: number;
  bounceRate: number;
  avgDuration: number;
  projectClicks: number;
  articleViews: number;
  cvDownloads: number;
};

export type MetricEntry = {
  name: string;
  count: number;
};

export type DailyChartPoint = {
  date: string;
  visitors: number;
  pageviews: number;
};

export type EntityStat = {
  entityId: string;
  entityTitle: string;
  count: number;
};

export type ActiveVisitors = {
  count: number;
};

type TrackPayload = {
  type: 'page_view' | 'project_click' | 'article_view' | 'cv_download' | 'page_duration';
  url?: string;
  referrer?: string;
  entityId?: string;
  entityTitle?: string;
  duration?: number;
};

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${inject(API_BASE_URL)}/analytics`;

  // --- Tracking methods (fire-and-forget, no credentials) ---

  trackPageView(url: string): void {
    this.fireAndForget({
      type: 'page_view',
      url,
      referrer: document.referrer || undefined,
    });
  }

  trackPageDuration(url: string, duration: number): void {
    this.fireAndForget({ type: 'page_duration', url, duration });
  }

  trackProjectClick(projectId: string, title: string): void {
    this.fireAndForget({
      type: 'project_click',
      entityId: projectId,
      entityTitle: title,
    });
  }

  trackArticleView(articleId: string, title: string): void {
    this.fireAndForget({
      type: 'article_view',
      entityId: articleId,
      entityTitle: title,
    });
  }

  trackCvDownload(): void {
    this.fireAndForget({ type: 'cv_download' });
  }

  sendBeacon(payload: TrackPayload): void {
    const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
    navigator.sendBeacon(`${this.baseUrl}/track`, blob);
  }

  // --- Admin methods (with credentials) ---

  async getOverview(startDate?: string, endDate?: string): Promise<StatsOverview> {
    return firstValueFrom(
      this.http.get<StatsOverview>(`${this.baseUrl}/stats/overview`, {
        params: this.buildDateParams(startDate, endDate),
        withCredentials: true,
      }),
    );
  }

  async getChart(startDate?: string, endDate?: string): Promise<DailyChartPoint[]> {
    return firstValueFrom(
      this.http.get<DailyChartPoint[]>(`${this.baseUrl}/stats/chart`, {
        params: this.buildDateParams(startDate, endDate),
        withCredentials: true,
      }),
    );
  }

  async getMetrics(
    type: string,
    startDate?: string,
    endDate?: string,
  ): Promise<MetricEntry[]> {
    return firstValueFrom(
      this.http.get<MetricEntry[]>(`${this.baseUrl}/stats/metrics`, {
        params: { type, ...this.buildDateParams(startDate, endDate) },
        withCredentials: true,
      }),
    );
  }

  async getActiveVisitors(): Promise<ActiveVisitors> {
    return firstValueFrom(
      this.http.get<ActiveVisitors>(`${this.baseUrl}/stats/active`, {
        withCredentials: true,
      }),
    );
  }

  async getProjectStats(startDate?: string, endDate?: string): Promise<EntityStat[]> {
    return firstValueFrom(
      this.http.get<EntityStat[]>(`${this.baseUrl}/stats/projects`, {
        params: this.buildDateParams(startDate, endDate),
        withCredentials: true,
      }),
    );
  }

  async getArticleStats(startDate?: string, endDate?: string): Promise<EntityStat[]> {
    return firstValueFrom(
      this.http.get<EntityStat[]>(`${this.baseUrl}/stats/articles`, {
        params: this.buildDateParams(startDate, endDate),
        withCredentials: true,
      }),
    );
  }

  async getCvDownloadCount(startDate?: string, endDate?: string): Promise<number> {
    const res = await firstValueFrom(
      this.http.get<{ count: number }>(`${this.baseUrl}/stats/cv-downloads`, {
        params: this.buildDateParams(startDate, endDate),
        withCredentials: true,
      }),
    );
    return res.count;
  }

  private fireAndForget(payload: TrackPayload): void {
    this.http.post(`${this.baseUrl}/track`, payload).pipe(catchError(() => EMPTY)).subscribe();
  }

  private buildDateParams(
    startDate?: string,
    endDate?: string,
  ): Record<string, string> {
    const params: Record<string, string> = {};
    if (startDate) params['startDate'] = startDate;
    if (endDate) params['endDate'] = endDate;
    return params;
  }
}
