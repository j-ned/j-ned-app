import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { PLATFORM_ID } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { describe, it, expect, afterEach, vi } from 'vitest';

import { API_BASE_URL } from '../api';
import { HttpAnalyticsGateway } from './http-analytics.gateway';
import type {
  StatsOverview,
  DailyChartPoint,
  MetricEntry,
  EntityStat,
  ActiveVisitors,
} from './analytics.types';

const BASE = '/api';

function configureBrowser(): { gateway: HttpAnalyticsGateway; httpController: HttpTestingController } {
  TestBed.configureTestingModule({
    providers: [
      HttpAnalyticsGateway,
      provideHttpClient(),
      provideHttpClientTesting(),
      { provide: API_BASE_URL, useValue: BASE },
      { provide: PLATFORM_ID, useValue: 'browser' },
    ],
  });
  return {
    gateway: TestBed.inject(HttpAnalyticsGateway),
    httpController: TestBed.inject(HttpTestingController),
  };
}

function configureServer(): { gateway: HttpAnalyticsGateway; httpController: HttpTestingController } {
  TestBed.configureTestingModule({
    providers: [
      HttpAnalyticsGateway,
      provideHttpClient(),
      provideHttpClientTesting(),
      { provide: API_BASE_URL, useValue: BASE },
      { provide: PLATFORM_ID, useValue: 'server' },
    ],
  });
  return {
    gateway: TestBed.inject(HttpAnalyticsGateway),
    httpController: TestBed.inject(HttpTestingController),
  };
}

describe('HttpAnalyticsGateway', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
  });

  describe('Tracking write-side (5 tests)', () => {
    it('trackPageView émet POST /<base>/analytics/track avec { type:page_view, url, referrer }', () => {
      const { gateway, httpController } = configureBrowser();

      Object.defineProperty(document, 'referrer', { value: 'https://example.com', configurable: true });

      gateway.trackPageView('/home');

      const req = httpController.expectOne(`${BASE}/analytics/track`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        type: 'page_view',
        url: '/home',
        referrer: 'https://example.com',
      });
      req.flush(null, { status: 204, statusText: 'No Content' });
      httpController.verify();
    });

    it('trackPageDuration émet POST /<base>/analytics/track avec { type:page_duration, url, duration }', () => {
      const { gateway, httpController } = configureBrowser();

      gateway.trackPageDuration('/home', 12);

      const req = httpController.expectOne(`${BASE}/analytics/track`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ type: 'page_duration', url: '/home', duration: 12 });
      req.flush(null, { status: 204, statusText: 'No Content' });
      httpController.verify();
    });

    it('trackProjectClick émet POST /<base>/analytics/track avec { type:project_click, entityId, entityTitle }', () => {
      const { gateway, httpController } = configureBrowser();

      gateway.trackProjectClick('abc-123', 'My Project');

      const req = httpController.expectOne(`${BASE}/analytics/track`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        type: 'project_click',
        entityId: 'abc-123',
        entityTitle: 'My Project',
      });
      req.flush(null, { status: 204, statusText: 'No Content' });
      httpController.verify();
    });

    it('trackArticleView émet POST /<base>/analytics/track avec { type:article_view, entityId, entityTitle }', () => {
      const { gateway, httpController } = configureBrowser();

      gateway.trackArticleView('art-1', 'My Article');

      const req = httpController.expectOne(`${BASE}/analytics/track`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        type: 'article_view',
        entityId: 'art-1',
        entityTitle: 'My Article',
      });
      req.flush(null, { status: 204, statusText: 'No Content' });
      httpController.verify();
    });

    it('trackCvDownload émet POST /<base>/analytics/track avec { type:cv_download }', () => {
      const { gateway, httpController } = configureBrowser();

      gateway.trackCvDownload();

      const req = httpController.expectOne(`${BASE}/analytics/track`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ type: 'cv_download' });
      req.flush(null, { status: 204, statusText: 'No Content' });
      httpController.verify();
    });
  });

  describe('Beacon (2 tests)', () => {
    it('sendBeacon appelle navigator.sendBeacon avec URL /<base>/analytics/track et Blob JSON correct', () => {
      const { gateway } = configureBrowser();
      const sendBeaconSpy = vi.fn().mockReturnValue(true);
      Object.defineProperty(globalThis.navigator, 'sendBeacon', {
        value: sendBeaconSpy,
        writable: true,
        configurable: true,
      });

      gateway.sendBeacon({ type: 'page_duration', url: '/home', duration: 5 });

      expect(sendBeaconSpy).toHaveBeenCalledWith(`${BASE}/analytics/track`, expect.any(Blob));
      const blob: Blob = sendBeaconSpy.mock.calls[0][1];
      expect(blob.type).toBe('application/json');
    });

    it('sendBeacon est no-op si navigator.sendBeacon n\'existe pas', () => {
      const { gateway } = configureBrowser();
      Object.defineProperty(globalThis.navigator, 'sendBeacon', {
        value: undefined,
        writable: true,
        configurable: true,
      });

      expect(() => gateway.sendBeacon({ type: 'cv_download' })).not.toThrow();
    });
  });

  describe('Admin read-side (7 tests)', () => {
    it('getOverview émet GET /<base>/analytics/stats/overview avec params dates + withCredentials', async () => {
      const { gateway, httpController } = configureBrowser();
      const expected: StatsOverview = {
        visitors: 100,
        pageviews: 250,
        sessions: 80,
        bounces: 30,
        bounceRate: 0.375,
        avgDuration: 45,
        projectClicks: 12,
        articleViews: 5,
        cvDownloads: 3,
      };

      const promise = firstValueFrom(gateway.getOverview('2026-04-01', '2026-04-30'));

      const req = httpController.expectOne(
        (r) =>
          r.url === `${BASE}/analytics/stats/overview` &&
          r.params.get('startDate') === '2026-04-01' &&
          r.params.get('endDate') === '2026-04-30',
      );
      expect(req.request.method).toBe('GET');
      expect(req.request.withCredentials).toBe(true);
      req.flush(expected);

      const result = await promise;
      expect(result).toEqual(expected);
      httpController.verify();
    });

    it('getChart émet GET /<base>/analytics/stats/chart avec params dates + withCredentials', async () => {
      const { gateway, httpController } = configureBrowser();
      const expected: DailyChartPoint[] = [{ date: '2026-04-01', visitors: 10, pageviews: 25 }];

      const promise = firstValueFrom(gateway.getChart('2026-04-01', '2026-04-30'));

      const req = httpController.expectOne(
        (r) =>
          r.url === `${BASE}/analytics/stats/chart` &&
          r.params.get('startDate') === '2026-04-01' &&
          r.params.get('endDate') === '2026-04-30',
      );
      expect(req.request.method).toBe('GET');
      expect(req.request.withCredentials).toBe(true);
      req.flush(expected);

      const result = await promise;
      expect(result).toEqual(expected);
      httpController.verify();
    });

    it('getMetrics émet GET /<base>/analytics/stats/metrics avec params type+dates + withCredentials', async () => {
      const { gateway, httpController } = configureBrowser();
      const expected: MetricEntry[] = [{ name: '/home', count: 42 }];

      const promise = firstValueFrom(gateway.getMetrics('url', '2026-04-01', '2026-04-30'));

      const req = httpController.expectOne(
        (r) =>
          r.url === `${BASE}/analytics/stats/metrics` &&
          r.params.get('type') === 'url' &&
          r.params.get('startDate') === '2026-04-01' &&
          r.params.get('endDate') === '2026-04-30',
      );
      expect(req.request.method).toBe('GET');
      expect(req.request.withCredentials).toBe(true);
      req.flush(expected);

      const result = await promise;
      expect(result).toEqual(expected);
      httpController.verify();
    });

    it('getActiveVisitors émet GET /<base>/analytics/stats/active sans params + withCredentials', async () => {
      const { gateway, httpController } = configureBrowser();
      const expected: ActiveVisitors = { count: 7 };

      const promise = firstValueFrom(gateway.getActiveVisitors());

      const req = httpController.expectOne(`${BASE}/analytics/stats/active`);
      expect(req.request.method).toBe('GET');
      expect(req.request.withCredentials).toBe(true);
      req.flush(expected);

      const result = await promise;
      expect(result).toEqual(expected);
      httpController.verify();
    });

    it('getProjectStats émet GET /<base>/analytics/stats/projects avec params dates + withCredentials', async () => {
      const { gateway, httpController } = configureBrowser();
      const expected: EntityStat[] = [{ entityId: 'p1', entityTitle: 'Project 1', count: 9 }];

      const promise = firstValueFrom(gateway.getProjectStats('2026-04-01', '2026-04-30'));

      const req = httpController.expectOne(
        (r) =>
          r.url === `${BASE}/analytics/stats/projects` &&
          r.params.get('startDate') === '2026-04-01' &&
          r.params.get('endDate') === '2026-04-30',
      );
      expect(req.request.method).toBe('GET');
      expect(req.request.withCredentials).toBe(true);
      req.flush(expected);

      const result = await promise;
      expect(result).toEqual(expected);
      httpController.verify();
    });

    it('getArticleStats émet GET /<base>/analytics/stats/articles avec params dates + withCredentials', async () => {
      const { gateway, httpController } = configureBrowser();
      const expected: EntityStat[] = [{ entityId: 'a1', entityTitle: 'Article 1', count: 3 }];

      const promise = firstValueFrom(gateway.getArticleStats('2026-04-01', '2026-04-30'));

      const req = httpController.expectOne(
        (r) =>
          r.url === `${BASE}/analytics/stats/articles` &&
          r.params.get('startDate') === '2026-04-01' &&
          r.params.get('endDate') === '2026-04-30',
      );
      expect(req.request.method).toBe('GET');
      expect(req.request.withCredentials).toBe(true);
      req.flush(expected);

      const result = await promise;
      expect(result).toEqual(expected);
      httpController.verify();
    });

    it('getCvDownloadCount émet GET /<base>/analytics/stats/cv-downloads, extrait res.count → number', async () => {
      const { gateway, httpController } = configureBrowser();

      const promise = firstValueFrom(gateway.getCvDownloadCount('2026-04-01', '2026-04-30'));

      const req = httpController.expectOne(
        (r) =>
          r.url === `${BASE}/analytics/stats/cv-downloads` &&
          r.params.get('startDate') === '2026-04-01' &&
          r.params.get('endDate') === '2026-04-30',
      );
      expect(req.request.method).toBe('GET');
      expect(req.request.withCredentials).toBe(true);
      req.flush({ count: 42 });

      const result = await promise;
      expect(result).toBe(42);
      httpController.verify();
    });
  });

  describe('SSR safety (3 tests)', () => {
    it('trackPageView est no-op si platform !== browser', () => {
      const { gateway, httpController } = configureServer();

      gateway.trackPageView('/home');

      httpController.expectNone(`${BASE}/analytics/track`);
      httpController.verify();
    });

    it('trackProjectClick est no-op si platform !== browser', () => {
      const { gateway, httpController } = configureServer();

      gateway.trackProjectClick('abc-123', 'My Project');

      httpController.expectNone(`${BASE}/analytics/track`);
      httpController.verify();
    });

    it('sendBeacon est no-op si platform !== browser', () => {
      const { gateway } = configureServer();
      const sendBeaconSpy = vi.fn();
      Object.defineProperty(globalThis.navigator ?? {}, 'sendBeacon', {
        value: sendBeaconSpy,
        writable: true,
        configurable: true,
      });

      gateway.sendBeacon({ type: 'cv_download' });

      expect(sendBeaconSpy).not.toHaveBeenCalled();
    });
  });
});
