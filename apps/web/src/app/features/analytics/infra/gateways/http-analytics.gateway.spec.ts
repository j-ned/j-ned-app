import { TestBed } from '@angular/core/testing';
import {
  HttpClient,
  HttpErrorResponse,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { PLATFORM_ID, signal } from '@angular/core';
import { firstValueFrom, type Observable } from 'rxjs';
import { describe, it, expect, afterEach, vi, type Mock } from 'vitest';

import { API_BASE_URL } from '@shared/api/api-config';
import { AnalyticsDeviceExclusion } from '@core/analytics/analytics-device-exclusion';
import { AuthStore } from '@core/auth/auth-store';
import { SKIP_ERROR_TOAST } from '@core/interceptors/skip-error-toast';
import { errorToastInterceptor } from '@core/interceptors/error-toast';
import { ToastStore } from '@core/notifications/toast-store';
import { HttpAnalyticsGateway } from './http-analytics.gateway';
import type {
  StatsOverview,
  DailyChartPoint,
  MetricEntry,
  EntityStat,
  ActiveVisitors,
  EventCount,
} from '../../domain/models/analytics.types';
import { makeEventCount, makeStatsOverview } from '../../testing/analytics-builders';

const API = 'https://api.test/api';
const TRACK_URL = '/api/analytics/track';

type VisitorContext = { loggedIn?: boolean; deviceExcluded?: boolean };
type BeaconSpy = Mock<(url: string, data: Blob) => boolean>;

function visitorProviders(ctx: VisitorContext = {}): unknown[] {
  return [
    { provide: AuthStore, useValue: { isLoggedIn: signal(ctx.loggedIn ?? false) } },
    {
      provide: AnalyticsDeviceExclusion,
      useValue: { excluded: signal(ctx.deviceExcluded ?? false) },
    },
  ];
}

function configureBrowser(ctx: VisitorContext = {}): {
  gateway: HttpAnalyticsGateway;
  httpController: HttpTestingController;
} {
  TestBed.configureTestingModule({
    providers: [
      HttpAnalyticsGateway,
      provideHttpClient(),
      provideHttpClientTesting(),
      { provide: API_BASE_URL, useValue: API },
      { provide: PLATFORM_ID, useValue: 'browser' },
      ...visitorProviders(ctx),
    ],
  });
  return {
    gateway: TestBed.inject(HttpAnalyticsGateway),
    httpController: TestBed.inject(HttpTestingController),
  };
}

function configureServer(): {
  gateway: HttpAnalyticsGateway;
  httpController: HttpTestingController;
} {
  TestBed.configureTestingModule({
    providers: [
      HttpAnalyticsGateway,
      provideHttpClient(),
      provideHttpClientTesting(),
      { provide: API_BASE_URL, useValue: API },
      { provide: PLATFORM_ID, useValue: 'server' },
      ...visitorProviders(),
    ],
  });
  return {
    gateway: TestBed.inject(HttpAnalyticsGateway),
    httpController: TestBed.inject(HttpTestingController),
  };
}

function installBeacon(value: BeaconSpy | undefined): void {
  Object.defineProperty(globalThis.navigator, 'sendBeacon', {
    value,
    writable: true,
    configurable: true,
  });
}

function beaconSpy(): BeaconSpy {
  const spy: BeaconSpy = vi.fn<(url: string, data: Blob) => boolean>().mockReturnValue(true);
  installBeacon(spy);
  return spy;
}

describe('HttpAnalyticsGateway', () => {
  afterEach(() => {
    Reflect.deleteProperty(globalThis.navigator, 'sendBeacon');
    TestBed.resetTestingModule();
  });

  describe('Tracking write-side, same origin', () => {
    it('trackPageView émet POST /api/analytics/track sur l’origine du site avec { type:page_view, url, referrer }', () => {
      const { gateway, httpController } = configureBrowser();

      Object.defineProperty(document, 'referrer', {
        value: 'https://example.com',
        configurable: true,
      });

      gateway.trackPageView('/home');

      const req = httpController.expectOne(TRACK_URL);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        type: 'page_view',
        url: '/home',
        referrer: 'https://example.com',
      });
      req.flush(null, { status: 204, statusText: 'No Content' });
      httpController.verify();
    });

    it('trackProjectClick émet POST /api/analytics/track avec { type:project_click, entityId, entityTitle }', () => {
      const { gateway, httpController } = configureBrowser();

      gateway.trackProjectClick('abc-123', 'My Project');

      const req = httpController.expectOne(TRACK_URL);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        type: 'project_click',
        entityId: 'abc-123',
        entityTitle: 'My Project',
      });
      req.flush(null, { status: 204, statusText: 'No Content' });
      httpController.verify();
    });

    it('trackArticleView émet POST /api/analytics/track avec { type:article_view, entityId, entityTitle }', () => {
      const { gateway, httpController } = configureBrowser();

      gateway.trackArticleView('art-1', 'My Article');

      const req = httpController.expectOne(TRACK_URL);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        type: 'article_view',
        entityId: 'art-1',
        entityTitle: 'My Article',
      });
      req.flush(null, { status: 204, statusText: 'No Content' });
      httpController.verify();
    });

    it('trackArticleRead émet POST /api/analytics/track avec { type:article_read, entityId, entityTitle }', () => {
      const { gateway, httpController } = configureBrowser();

      gateway.trackArticleRead('art-1', 'My Article');

      const req = httpController.expectOne(TRACK_URL);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        type: 'article_read',
        entityId: 'art-1',
        entityTitle: 'My Article',
      });
      req.flush(null, { status: 204, statusText: 'No Content' });
      httpController.verify();
    });

    it('marque les POST de tracking comme silencieux pour l’intercepteur de toast', () => {
      const { gateway, httpController } = configureBrowser();

      gateway.trackCtaClick('home_hero_projects', 'Voir les projets');

      const req = httpController.expectOne(TRACK_URL);
      expect(req.request.context.get(SKIP_ERROR_TOAST)).toBe(true);
      req.flush(null, { status: 204, statusText: 'No Content' });
      httpController.verify();
    });

    it('trackCtaClick émet POST /api/analytics/track avec { type:cta_click, entityId, entityTitle }', () => {
      const { gateway, httpController } = configureBrowser();

      gateway.trackCtaClick('home_hero_projects', 'Voir les projets');

      const req = httpController.expectOne(TRACK_URL);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        type: 'cta_click',
        entityId: 'home_hero_projects',
        entityTitle: 'Voir les projets',
      });
      req.flush(null, { status: 204, statusText: 'No Content' });
      httpController.verify();
    });

    it('trackCvDownload émet POST /api/analytics/track avec { type:cv_download }', () => {
      const { gateway, httpController } = configureBrowser();

      gateway.trackCvDownload();

      const req = httpController.expectOne(TRACK_URL);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ type: 'cv_download' });
      req.flush(null, { status: 204, statusText: 'No Content' });
      httpController.verify();
    });
  });

  describe('provenance une fois par visite', () => {
    const flushBodies = (httpController: HttpTestingController): unknown[] =>
      httpController.match(TRACK_URL).map((req) => {
        req.flush(null, { status: 204, statusText: 'No Content' });
        return req.request.body;
      });

    it('Given a visit arriving from Google When three pages are viewed Then only the first page view carries the referrer', () => {
      const { gateway, httpController } = configureBrowser();
      Object.defineProperty(document, 'referrer', {
        value: 'https://www.google.com/',
        configurable: true,
      });

      gateway.trackPageView('/');
      gateway.trackPageView('/blog');
      gateway.trackPageView('/about');

      expect(flushBodies(httpController)).toEqual([
        { type: 'page_view', url: '/', referrer: 'https://www.google.com/' },
        { type: 'page_view', url: '/blog' },
        { type: 'page_view', url: '/about' },
      ]);
      httpController.verify();
    });

    it('Given a visit landing on an excluded page When the next page is viewed Then that first measured page view carries the referrer', () => {
      const { gateway, httpController } = configureBrowser();
      Object.defineProperty(document, 'referrer', {
        value: 'https://www.google.com/',
        configurable: true,
      });

      gateway.trackPageView('/login');
      gateway.trackPageView('/');
      gateway.trackPageView('/blog');

      expect(flushBodies(httpController)).toEqual([
        { type: 'page_view', url: '/', referrer: 'https://www.google.com/' },
        { type: 'page_view', url: '/blog' },
      ]);
      httpController.verify();
    });
  });

  describe('exclusion des pages de connexion et d’administration', () => {
    afterEach(() => history.replaceState(null, '', '/'));

    it.each([['/login'], ['/admin'], ['/admin/messages']])(
      'Given a visitor on %s When an outbound link is clicked or the home form comes into view Then neither beacon nor POST leaves',
      (path) => {
        const { gateway, httpController } = configureBrowser();
        const beacon = beaconSpy();

        gateway.trackOutboundClick('email', path);
        gateway.trackSectionView('home_contact', path);

        expect({
          beacons: beacon.mock.calls.length,
          posts: httpController.match(TRACK_URL).length,
        }).toEqual({ beacons: 0, posts: 0 });
        httpController.verify();
      },
    );

    it.each([['/login'], ['/admin/messages']])(
      'Given a visitor on %s When a call to action is clicked Then no POST leaves',
      (path) => {
        const { gateway, httpController } = configureBrowser();
        history.replaceState(null, '', path);

        gateway.trackCtaClick('footer_contact', 'Décrire mon projet');

        expect(httpController.match(TRACK_URL)).toHaveLength(0);
        httpController.verify();
      },
    );
  });

  describe('conversions', () => {
    it.each([['home'], ['offer_site-vitrine']] as const)(
      'Given a visitor When the form sent from %s succeeds Then POST /api/analytics/track carries only the placement',
      (placement) => {
        const { gateway, httpController } = configureBrowser();

        gateway.trackContactSubmit(placement);

        const req = httpController.expectOne(TRACK_URL);
        expect({
          method: req.request.method,
          body: req.request.body,
          silent: req.request.context.get(SKIP_ERROR_TOAST),
        }).toEqual({
          method: 'POST',
          body: { type: 'contact_submit', entityId: placement },
          silent: true,
        });
        req.flush(null, { status: 204, statusText: 'No Content' });
        httpController.verify();
      },
    );

    it('Given a visitor When the home form comes into view Then POST /api/analytics/track carries the section and the page', () => {
      const { gateway, httpController } = configureBrowser();

      gateway.trackSectionView('home_contact', '/');

      const req = httpController.expectOne(TRACK_URL);
      expect({ method: req.request.method, body: req.request.body }).toEqual({
        method: 'POST',
        body: { type: 'section_view', entityId: 'home_contact', entityTitle: '/' },
      });
      req.flush(null, { status: 204, statusText: 'No Content' });
      httpController.verify();
    });

    it('Given a visitor When an outbound link is clicked Then a JSON beacon carries the channel and the page, and no HttpClient request is made', async () => {
      const { gateway, httpController } = configureBrowser();
      const beacon = beaconSpy();

      gateway.trackOutboundClick('linkedin', '/about');

      expect(beacon).toHaveBeenCalledTimes(1);
      const [url, blob] = beacon.mock.calls[0];
      expect({ url, type: blob.type, body: JSON.parse(await blob.text()) }).toEqual({
        url: TRACK_URL,
        type: 'application/json',
        body: { type: 'outbound_click', entityId: 'linkedin', entityTitle: '/about' },
      });
      httpController.verify();
    });

    it('Given a browser without navigator.sendBeacon When an outbound link is clicked Then nothing throws and no HttpClient request is made', () => {
      const { gateway, httpController } = configureBrowser();
      installBeacon(undefined);

      expect(() => gateway.trackOutboundClick('email', '/')).not.toThrow();
      httpController.verify();
    });

    it.each<[string, number, VisitorContext]>([
      ['visiteur', 1, {}],
      ['admin connecté', 0, { loggedIn: true }],
      ['appareil exclu', 0, { deviceExcluded: true }],
    ])(
      'Given a %s When an outbound link is clicked Then %i beacon leaves',
      (_label, beacons, ctx) => {
        const { gateway } = configureBrowser(ctx);
        const beacon = beaconSpy();

        gateway.trackOutboundClick('phone', '/offres/site-vitrine');

        expect(beacon).toHaveBeenCalledTimes(beacons);
      },
    );

    it.each<[string, number, VisitorContext]>([
      ['visiteur', 2, {}],
      ['admin connecté', 0, { loggedIn: true }],
      ['appareil exclu', 0, { deviceExcluded: true }],
    ])(
      'Given a %s When a form is sent and the home form comes into view Then %i POST leave',
      (_label, posts, ctx) => {
        const { gateway, httpController } = configureBrowser(ctx);

        gateway.trackContactSubmit('home');
        gateway.trackSectionView('home_contact', '/');

        const requests = httpController.match(TRACK_URL);
        expect(requests).toHaveLength(posts);
        requests.forEach((req) => req.flush(null, { status: 204, statusText: 'No Content' }));
        httpController.verify();
      },
    );

    it('Given the server platform When conversions are reported Then neither POST nor beacon leaves', () => {
      const { gateway, httpController } = configureServer();
      const beacon = beaconSpy();

      gateway.trackContactSubmit('home');
      gateway.trackSectionView('home_contact', '/');
      gateway.trackOutboundClick('email', '/');

      expect(beacon).not.toHaveBeenCalled();
      httpController.verify();
    });
  });

  describe('page_duration par beacon', () => {
    it('Given a visitor When trackPageDuration is called Then a JSON beacon leaves for /api/analytics/track and no HttpClient request is made', async () => {
      const { gateway, httpController } = configureBrowser();
      const beacon = beaconSpy();

      gateway.trackPageDuration('/home', 12);

      expect(beacon).toHaveBeenCalledTimes(1);
      const [url, blob] = beacon.mock.calls[0];
      expect({ url, type: blob.type, body: JSON.parse(await blob.text()) }).toEqual({
        url: TRACK_URL,
        type: 'application/json',
        body: { type: 'page_duration', url: '/home', duration: 12 },
      });
      httpController.verify();
    });

    it('Given a browser without navigator.sendBeacon When trackPageDuration is called Then nothing throws and no HttpClient request is made', () => {
      const { gateway, httpController } = configureBrowser();
      installBeacon(undefined);

      expect(() => gateway.trackPageDuration('/home', 12)).not.toThrow();
      httpController.verify();
    });
  });

  describe('Admin read-side (7 tests)', () => {
    it('getOverview émet GET /<base>/analytics/stats/overview avec params dates + withCredentials', async () => {
      const { gateway, httpController } = configureBrowser();
      const expected: StatsOverview = makeStatsOverview({
        visitors: 100,
        pageviews: 250,
        sessions: 80,
        bounces: 30,
        bounceRate: 0.375,
        avgDuration: 45,
        projectClicks: 12,
        articleViews: 5,
        cvDownloads: 3,
        ctaClicks: 7,
      });

      const promise = firstValueFrom(gateway.getOverview('2026-04-01', '2026-04-30'));

      const req = httpController.expectOne(
        (r) =>
          r.url === `${API}/analytics/stats/overview` &&
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
          r.url === `${API}/analytics/stats/chart` &&
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
          r.url === `${API}/analytics/stats/metrics` &&
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

      const req = httpController.expectOne(`${API}/analytics/stats/active`);
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
          r.url === `${API}/analytics/stats/projects` &&
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
          r.url === `${API}/analytics/stats/articles` &&
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

    it('getArticleReadStats émet GET /<base>/analytics/stats/articles-read avec params dates + withCredentials', async () => {
      const { gateway, httpController } = configureBrowser();
      const expected: EntityStat[] = [{ entityId: 'a1', entityTitle: 'Article 1', count: 2 }];

      const promise = firstValueFrom(gateway.getArticleReadStats('2026-04-01', '2026-04-30'));

      const req = httpController.expectOne(
        (r) =>
          r.url === `${API}/analytics/stats/articles-read` &&
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

    it('getCtaStats émet GET /<base>/analytics/stats/cta avec params dates + withCredentials', async () => {
      const { gateway, httpController } = configureBrowser();
      const rows: EntityStat[] = [
        { entityId: 'home_hero_projects', entityTitle: 'Voir les projets', count: 42 },
      ];

      const promise = firstValueFrom(gateway.getCtaStats('2026-01-01', '2026-01-31'));

      const req = httpController.expectOne(
        `${API}/analytics/stats/cta?startDate=2026-01-01&endDate=2026-01-31`,
      );
      expect(req.request.method).toBe('GET');
      expect(req.request.withCredentials).toBe(true);
      req.flush(rows);
      await expect(promise).resolves.toEqual(rows);
      httpController.verify();
    });

    it('getCvDownloadCount émet GET /<base>/analytics/stats/cv-downloads, extrait res.count → number', async () => {
      const { gateway, httpController } = configureBrowser();

      const promise = firstValueFrom(gateway.getCvDownloadCount('2026-04-01', '2026-04-30'));

      const req = httpController.expectOne(
        (r) =>
          r.url === `${API}/analytics/stats/cv-downloads` &&
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

  describe('détail des conversions', () => {
    it.each(['contact_submit', 'outbound_click'] as const)(
      'getEventCounts(%s) émet GET /<base>/analytics/stats/events avec type + dates + withCredentials',
      async (type) => {
        const { gateway, httpController } = configureBrowser();
        const expected: EventCount[] = [
          makeEventCount({ entityId: 'home', count: 3 }),
          makeEventCount({ entityId: 'email', count: 1 }),
        ];

        const promise = firstValueFrom(gateway.getEventCounts(type, '2026-09-07', '2026-10-07'));

        const req = httpController.expectOne(
          (r) =>
            r.url === `${API}/analytics/stats/events` &&
            r.params.get('type') === type &&
            r.params.get('startDate') === '2026-09-07' &&
            r.params.get('endDate') === '2026-10-07',
        );
        expect({ method: req.request.method, credentials: req.request.withCredentials }).toEqual({
          method: 'GET',
          credentials: true,
        });
        req.flush(expected);

        await expect(promise).resolves.toEqual(expected);
        httpController.verify();
      },
    );
  });

  describe('URL filter (login + admin)', () => {
    it.each([['/login'], ['/admin'], ['/admin/'], ['/admin/users'], ['/admin/foo/bar']])(
      'trackPageView est no-op pour url=%s',
      (url) => {
        const { gateway, httpController } = configureBrowser();
        gateway.trackPageView(url);
        httpController.expectNone(TRACK_URL);
        httpController.verify();
      },
    );

    it.each([['/login'], ['/admin'], ['/admin/dashboard']])(
      'trackPageDuration est no-op pour url=%s',
      (url) => {
        const { gateway, httpController } = configureBrowser();
        const beacon = beaconSpy();
        gateway.trackPageDuration(url, 30);
        expect(beacon).not.toHaveBeenCalled();
        httpController.verify();
      },
    );

    it.each([['/logins'], ['/admin-public'], ['/login/something'], ['/home']])(
      'trackPageView est OK pour url=%s (pas filtré)',
      (url) => {
        const { gateway, httpController } = configureBrowser();
        gateway.trackPageView(url);
        const req = httpController.expectOne(TRACK_URL);
        expect(req.request.body).toEqual(expect.objectContaining({ url }));
        req.flush(null, { status: 204, statusText: 'No Content' });
        httpController.verify();
      },
    );
  });

  describe('visiteurs exclus', () => {
    it.each<[string, VisitorContext]>([
      ['admin connecté', { loggedIn: true }],
      ['appareil exclu', { deviceExcluded: true }],
    ])('%s : aucun POST /track ni beacon, quel que soit le type', (_label, ctx) => {
      const { gateway, httpController } = configureBrowser(ctx);
      const beacon = beaconSpy();

      gateway.trackPageView('/blog');
      gateway.trackPageDuration('/blog', 12);
      gateway.trackProjectClick('p1', 'Projet');
      gateway.trackArticleView('a1', 'Article');
      gateway.trackArticleRead('a1', 'Article');
      gateway.trackCvDownload();
      gateway.trackCtaClick('home_hero_projects', 'Voir les projets');

      expect(beacon).not.toHaveBeenCalled();
      httpController.verify();
    });

    it.each<[string, number, VisitorContext]>([
      ['visiteur', 1, {}],
      ['admin connecté', 0, { loggedIn: true }],
      ['appareil exclu', 0, { deviceExcluded: true }],
    ])(
      'Given a %s When a visible duration is reported Then %i beacon leaves',
      (_label, beacons, ctx) => {
        const { gateway } = configureBrowser(ctx);
        const beacon = beaconSpy();

        gateway.trackPageDuration('/offres/site-vitrine', 40);

        expect(beacon).toHaveBeenCalledTimes(beacons);
      },
    );
  });

  describe('SSR safety', () => {
    it('trackPageView est no-op si platform !== browser', () => {
      const { gateway, httpController } = configureServer();

      gateway.trackPageView('/home');

      httpController.expectNone(TRACK_URL);
      httpController.verify();
    });

    it('trackProjectClick est no-op si platform !== browser', () => {
      const { gateway, httpController } = configureServer();

      gateway.trackProjectClick('abc-123', 'My Project');

      httpController.expectNone(TRACK_URL);
      httpController.verify();
    });

    it('trackArticleRead est no-op si platform !== browser', () => {
      const { gateway, httpController } = configureServer();

      gateway.trackArticleRead('art-1', 'My Article');

      httpController.expectNone(TRACK_URL);
      httpController.verify();
    });

    it('trackCtaClick est no-op si platform !== browser', () => {
      const { gateway, httpController } = configureServer();

      gateway.trackCtaClick('home_hero_projects', 'Voir les projets');

      httpController.expectNone(TRACK_URL);
      httpController.verify();
    });

    it('trackPageDuration est no-op si platform !== browser', () => {
      const { gateway, httpController } = configureServer();
      const beacon = beaconSpy();

      gateway.trackPageDuration('/home', 12);

      expect(beacon).not.toHaveBeenCalled();
      httpController.verify();
    });
  });
});

describe('HttpAnalyticsGateway: lectures de l’admin derrière l’intercepteur de toasts', () => {
  const add = vi.fn();

  function configureWithToasts(): {
    gateway: HttpAnalyticsGateway;
    http: HttpClient;
    httpController: HttpTestingController;
  } {
    add.mockClear();
    TestBed.configureTestingModule({
      providers: [
        HttpAnalyticsGateway,
        provideHttpClient(withInterceptors([errorToastInterceptor])),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: API },
        { provide: PLATFORM_ID, useValue: 'browser' },
        { provide: ToastStore, useValue: { add } },
        ...visitorProviders(),
      ],
    });
    return {
      gateway: TestBed.inject(HttpAnalyticsGateway),
      http: TestBed.inject(HttpClient),
      httpController: TestBed.inject(HttpTestingController),
    };
  }

  async function failingStatus(
    request: Observable<unknown>,
    httpController: HttpTestingController,
    path: string,
  ): Promise<number | null> {
    const outcome = firstValueFrom(request).then(
      () => null,
      (error: unknown) => (error instanceof HttpErrorResponse ? error.status : -1),
    );
    httpController
      .expectOne((r) => r.url === path)
      .flush(null, { status: 500, statusText: 'Server Error' });
    return outcome;
  }

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it.each<{
    read: string;
    path: string;
    call: (gateway: HttpAnalyticsGateway) => Observable<unknown>;
  }>([
    {
      read: 'getOverview',
      path: 'overview',
      call: (g): Observable<unknown> => g.getOverview('2026-09-07', '2026-10-07'),
    },
    {
      read: 'getChart',
      path: 'chart',
      call: (g): Observable<unknown> => g.getChart('2026-09-07', '2026-10-07'),
    },
    {
      read: 'getMetrics',
      path: 'metrics',
      call: (g): Observable<unknown> => g.getMetrics('url', '2026-09-07', '2026-10-07'),
    },
    {
      read: 'getActiveVisitors',
      path: 'active',
      call: (g): Observable<unknown> => g.getActiveVisitors(),
    },
    {
      read: 'getProjectStats',
      path: 'projects',
      call: (g): Observable<unknown> => g.getProjectStats('2026-09-07', '2026-10-07'),
    },
    {
      read: 'getArticleStats',
      path: 'articles',
      call: (g): Observable<unknown> => g.getArticleStats('2026-09-07', '2026-10-07'),
    },
    {
      read: 'getArticleReadStats',
      path: 'articles-read',
      call: (g): Observable<unknown> => g.getArticleReadStats('2026-09-07', '2026-10-07'),
    },
    {
      read: 'getCtaStats',
      path: 'cta',
      call: (g): Observable<unknown> => g.getCtaStats('2026-09-07', '2026-10-07'),
    },
    {
      read: 'getCvDownloadCount',
      path: 'cv-downloads',
      call: (g): Observable<unknown> => g.getCvDownloadCount('2026-09-07', '2026-10-07'),
    },
    {
      read: 'getEventCounts',
      path: 'events',
      call: (g): Observable<unknown> =>
        g.getEventCounts('contact_submit', '2026-09-07', '2026-10-07'),
    },
  ])(
    'Given the API answers 500 When $read is read Then no toast is shown and the caller still receives the error',
    async ({ path, call }) => {
      const { gateway, httpController } = configureWithToasts();

      const status = await failingStatus(
        call(gateway),
        httpController,
        `${API}/analytics/stats/${path}`,
      );

      expect({ status, toasts: add.mock.calls.length }).toEqual({ status: 500, toasts: 0 });
      httpController.verify();
    },
  );

  it('Given the same interceptor When another GET answers 500 Then it still shows its toast', async () => {
    const { http, httpController } = configureWithToasts();

    const status = await failingStatus(
      http.get(`${API}/projects`),
      httpController,
      `${API}/projects`,
    );

    expect({ status, toasts: add.mock.calls.length }).toEqual({ status: 500, toasts: 1 });
    httpController.verify();
  });
});
