import { HttpClient } from '@angular/common/http';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { catchError, EMPTY, map, Observable } from 'rxjs';

import { API_BASE_URL } from '@shared/api/api-config';
import { AnalyticsDeviceExclusion } from '@core/analytics/analytics-device-exclusion';
import { AuthStore } from '@core/auth/auth-store';
import { silentErrors } from '@core/interceptors/skip-error-toast';
import { AnalyticsGateway } from '../../domain/gateways/analytics.gateway';
import type {
  ActiveVisitors,
  DailyChartPoint,
  EntityStat,
  MetricEntry,
  StatsOverview,
  TrackPayload,
} from '../../domain/models/analytics.types';

// Même origine : nginx relaie à l'API, un beacon n'y déclenche ni CORS ni pré-vol.
const ANALYTICS_TRACK_URL = '/api/analytics/track';

// Mirrors backend filter: don't burn HTTP calls on routes the server drops.
function isExcludedUrl(url: string): boolean {
  return url === '/login' || url === '/admin' || url.startsWith('/admin/');
}

@Injectable()
export class HttpAnalyticsGateway extends AnalyticsGateway {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${inject(API_BASE_URL)}/analytics`;
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly auth = inject(AuthStore);
  private readonly deviceExclusion = inject(AnalyticsDeviceExclusion);

  trackPageView(url: string): void {
    if (!this.canTrack() || isExcludedUrl(url)) return;
    this.fireAndForget({
      type: 'page_view',
      url,
      referrer: document.referrer || undefined,
    });
  }

  trackPageDuration(url: string, duration: number): void {
    if (!this.canTrack() || isExcludedUrl(url) || !navigator.sendBeacon) return;
    const payload: TrackPayload = { type: 'page_duration', url, duration };
    const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
    navigator.sendBeacon(ANALYTICS_TRACK_URL, blob);
  }

  trackProjectClick(projectId: string, title: string): void {
    if (!this.canTrack()) return;
    this.fireAndForget({
      type: 'project_click',
      entityId: projectId,
      entityTitle: title,
    });
  }

  trackArticleView(articleId: string, title: string): void {
    if (!this.canTrack()) return;
    this.fireAndForget({
      type: 'article_view',
      entityId: articleId,
      entityTitle: title,
    });
  }

  trackArticleRead(articleId: string, title: string): void {
    if (!this.canTrack()) return;
    this.fireAndForget({
      type: 'article_read',
      entityId: articleId,
      entityTitle: title,
    });
  }

  trackCvDownload(): void {
    if (!this.canTrack()) return;
    this.fireAndForget({ type: 'cv_download' });
  }

  // `ctaId` porte l'emplacement (`home_hero_contact`) : c'est lui qui rend le
  // taux de clic lisible par emplacement dans les stats d'entités existantes.
  trackCtaClick(ctaId: string, label: string): void {
    if (!this.canTrack()) return;
    this.fireAndForget({
      type: 'cta_click',
      entityId: ctaId,
      entityTitle: label,
    });
  }

  getOverview(startDate?: string, endDate?: string): Observable<StatsOverview> {
    return this.getStats<StatsOverview>('overview', this.buildDateParams(startDate, endDate));
  }

  getChart(startDate?: string, endDate?: string): Observable<DailyChartPoint[]> {
    return this.getStats<DailyChartPoint[]>('chart', this.buildDateParams(startDate, endDate));
  }

  getMetrics(type: string, startDate?: string, endDate?: string): Observable<MetricEntry[]> {
    return this.getStats<MetricEntry[]>('metrics', {
      type,
      ...this.buildDateParams(startDate, endDate),
    });
  }

  getActiveVisitors(): Observable<ActiveVisitors> {
    return this.getStats<ActiveVisitors>('active', {});
  }

  getProjectStats(startDate?: string, endDate?: string): Observable<EntityStat[]> {
    return this.getStats<EntityStat[]>('projects', this.buildDateParams(startDate, endDate));
  }

  getArticleStats(startDate?: string, endDate?: string): Observable<EntityStat[]> {
    return this.getStats<EntityStat[]>('articles', this.buildDateParams(startDate, endDate));
  }

  getArticleReadStats(startDate?: string, endDate?: string): Observable<EntityStat[]> {
    return this.getStats<EntityStat[]>('articles-read', this.buildDateParams(startDate, endDate));
  }

  getCtaStats(startDate?: string, endDate?: string): Observable<EntityStat[]> {
    return this.getStats<EntityStat[]>('cta', this.buildDateParams(startDate, endDate));
  }

  getCvDownloadCount(startDate?: string, endDate?: string): Observable<number> {
    return this.getStats<{ count: number }>(
      'cv-downloads',
      this.buildDateParams(startDate, endDate),
    ).pipe(map((res) => res.count));
  }

  // L'admin connecté et les appareils exclus ne sont pas des visiteurs : le relais retire le cookie
  // de session de /track, le filtre vit donc ici.
  private canTrack(): boolean {
    return this.isBrowser && !this.auth.isLoggedIn() && !this.deviceExclusion.excluded();
  }

  // Le tracking ne parle jamais au visiteur : un 400 (type inconnu de l'API) ou
  // un 429 (rafale) est un problème d'exploitation, pas un toast sur une page publique.
  private fireAndForget(payload: TrackPayload): void {
    this.http
      .post(ANALYTICS_TRACK_URL, payload, {
        context: silentErrors(),
      })
      .pipe(catchError(() => EMPTY))
      .subscribe();
  }

  // Chaque écran qui lit ces statistiques affiche son propre état d'erreur : pas de toast par requête en plus.
  private getStats<T>(path: string, params: Record<string, string>): Observable<T> {
    return this.http.get<T>(`${this.baseUrl}/stats/${path}`, {
      params,
      withCredentials: true,
      context: silentErrors(),
    });
  }

  private buildDateParams(startDate?: string, endDate?: string): Record<string, string> {
    const params: Record<string, string> = {};
    if (startDate) params['startDate'] = startDate;
    if (endDate) params['endDate'] = endDate;
    return params;
  }
}
