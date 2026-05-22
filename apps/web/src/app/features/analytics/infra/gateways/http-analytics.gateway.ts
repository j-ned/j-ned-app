import { HttpClient } from '@angular/common/http';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { catchError, EMPTY, map, Observable } from 'rxjs';

import { API_BASE_URL } from '@shared/api';
import {
  AnalyticsGateway,
  type ActiveVisitors,
  type DailyChartPoint,
  type EntityStat,
  type MetricEntry,
  type StatsOverview,
  type TrackPayload,
} from '../../domain';

// Mirrors backend filter: don't burn HTTP calls on routes the server drops.
function isExcludedUrl(url: string): boolean {
  return url === '/login' || url === '/admin' || url.startsWith('/admin/');
}

@Injectable()
export class HttpAnalyticsGateway extends AnalyticsGateway {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${inject(API_BASE_URL)}/analytics`;
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  // --- Tracking write-side ---

  trackPageView(url: string): void {
    if (!this.isBrowser || isExcludedUrl(url)) return;
    this.fireAndForget({
      type: 'page_view',
      url,
      referrer: document.referrer || undefined,
    });
  }

  trackPageDuration(url: string, duration: number): void {
    if (!this.isBrowser || isExcludedUrl(url)) return;
    this.fireAndForget({ type: 'page_duration', url, duration });
  }

  trackProjectClick(projectId: string, title: string): void {
    if (!this.isBrowser) return;
    this.fireAndForget({
      type: 'project_click',
      entityId: projectId,
      entityTitle: title,
    });
  }

  trackArticleView(articleId: string, title: string): void {
    if (!this.isBrowser) return;
    this.fireAndForget({
      type: 'article_view',
      entityId: articleId,
      entityTitle: title,
    });
  }

  trackCvDownload(): void {
    if (!this.isBrowser) return;
    this.fireAndForget({ type: 'cv_download' });
  }

  // --- Beacon write-side ---

  sendBeacon(payload: TrackPayload): void {
    if (!this.isBrowser || typeof navigator === 'undefined' || !navigator.sendBeacon) return;
    if (payload.url && isExcludedUrl(payload.url)) return;
    const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
    navigator.sendBeacon(`${this.baseUrl}/track`, blob);
  }

  // --- Admin read-side ---

  getOverview(startDate?: string, endDate?: string): Observable<StatsOverview> {
    return this.http.get<StatsOverview>(`${this.baseUrl}/stats/overview`, {
      params: this.buildDateParams(startDate, endDate),
      withCredentials: true,
    });
  }

  getChart(startDate?: string, endDate?: string): Observable<DailyChartPoint[]> {
    return this.http.get<DailyChartPoint[]>(`${this.baseUrl}/stats/chart`, {
      params: this.buildDateParams(startDate, endDate),
      withCredentials: true,
    });
  }

  getMetrics(type: string, startDate?: string, endDate?: string): Observable<MetricEntry[]> {
    return this.http.get<MetricEntry[]>(`${this.baseUrl}/stats/metrics`, {
      params: { type, ...this.buildDateParams(startDate, endDate) },
      withCredentials: true,
    });
  }

  getActiveVisitors(): Observable<ActiveVisitors> {
    return this.http.get<ActiveVisitors>(`${this.baseUrl}/stats/active`, {
      withCredentials: true,
    });
  }

  getProjectStats(startDate?: string, endDate?: string): Observable<EntityStat[]> {
    return this.http.get<EntityStat[]>(`${this.baseUrl}/stats/projects`, {
      params: this.buildDateParams(startDate, endDate),
      withCredentials: true,
    });
  }

  getArticleStats(startDate?: string, endDate?: string): Observable<EntityStat[]> {
    return this.http.get<EntityStat[]>(`${this.baseUrl}/stats/articles`, {
      params: this.buildDateParams(startDate, endDate),
      withCredentials: true,
    });
  }

  getCvDownloadCount(startDate?: string, endDate?: string): Observable<number> {
    return this.http
      .get<{ count: number }>(`${this.baseUrl}/stats/cv-downloads`, {
        params: this.buildDateParams(startDate, endDate),
        withCredentials: true,
      })
      .pipe(map((res) => res.count));
  }

  // --- Helpers ---

  private fireAndForget(payload: TrackPayload): void {
    this.http
      .post(`${this.baseUrl}/track`, payload)
      .pipe(catchError(() => EMPTY))
      .subscribe();
  }

  private buildDateParams(startDate?: string, endDate?: string): Record<string, string> {
    const params: Record<string, string> = {};
    if (startDate) params['startDate'] = startDate;
    if (endDate) params['endDate'] = endDate;
    return params;
  }
}
