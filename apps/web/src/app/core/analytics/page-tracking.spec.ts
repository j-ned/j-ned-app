import { Component, PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter, type Routes } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest';

import { AnalyticsGateway } from '@features/analytics/domain/gateways/analytics.gateway';
import { stubAnalyticsGateway } from '@features/analytics/testing/stub-analytics-gateway';
import { initializePageTracking } from './page-tracking';

@Component({ template: '' })
class Blank {}

const ROUTES: Routes = [
  { path: '', component: Blank },
  { path: 'offres/:slug', component: Blank },
  { path: '**', component: Blank },
];

type Tracking = {
  router: Router;
  trackPageView: Mock<(url: string) => void>;
  trackPageDuration: Mock<(url: string, duration: number) => void>;
};

let visibility: DocumentVisibilityState = 'visible';

function startTracking(platform: 'browser' | 'server' = 'browser'): Tracking {
  const trackPageView = vi.fn<(url: string) => void>();
  const trackPageDuration = vi.fn<(url: string, duration: number) => void>();
  TestBed.configureTestingModule({
    providers: [
      provideRouter(ROUTES),
      { provide: PLATFORM_ID, useValue: platform },
      {
        provide: AnalyticsGateway,
        useValue: stubAnalyticsGateway({ trackPageView, trackPageDuration }),
      },
    ],
  });
  TestBed.runInInjectionContext(initializePageTracking());
  return { router: TestBed.inject(Router), trackPageView, trackPageDuration };
}

function elapse(seconds: number): void {
  vi.advanceTimersByTime(seconds * 1_000);
}

function becomeHidden(): void {
  visibility = 'hidden';
  document.dispatchEvent(new Event('visibilitychange'));
}

function becomeVisible(): void {
  visibility = 'visible';
  document.dispatchEvent(new Event('visibilitychange'));
}

function leavePage(): void {
  window.dispatchEvent(new Event('pagehide'));
}

describe('initializePageTracking', () => {
  beforeEach(() => {
    vi.useFakeTimers({ now: new Date('2026-10-10T08:00:00Z') });
    visibility = 'visible';
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => visibility,
    });
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    Reflect.deleteProperty(document, 'visibilityState');
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('pages vues', () => {
    it('Given a page When only its fragment changes Then a single page view is sent, without the fragment', async () => {
      const { router, trackPageView } = startTracking();

      await router.navigateByUrl('/offres/site-vitrine');
      await router.navigateByUrl('/offres/site-vitrine#demande');

      expect(trackPageView.mock.calls).toEqual([['/offres/site-vitrine']]);
    });

    it('Given a page reached with a fragment When it is tracked Then the page view carries the path without the fragment', async () => {
      const { router, trackPageView } = startTracking();

      await router.navigateByUrl('/#contact');

      expect(trackPageView.mock.calls).toEqual([['/']]);
    });

    it('Given a page When the visitor goes to the 404 route Then the 404 is neither viewed nor timed', async () => {
      const { router, trackPageView, trackPageDuration } = startTracking();

      await router.navigateByUrl('/');
      elapse(12);
      await router.navigateByUrl('/page-inconnue');
      elapse(30);
      becomeHidden();

      expect({ views: trackPageView.mock.calls, durations: trackPageDuration.mock.calls }).toEqual({
        views: [['/']],
        durations: [['/', 12]],
      });
    });

    it.each<['browser' | 'server', number]>([
      ['browser', 1],
      ['server', 0],
    ])(
      'Given the %s platform When a page is reached Then %i page view is sent',
      async (platform, views) => {
        const { router, trackPageView } = startTracking(platform);

        await router.navigateByUrl('/offres/site-vitrine');

        expect(trackPageView).toHaveBeenCalledTimes(views);
      },
    );
  });

  describe('durée en temps visible, par incréments', () => {
    it('Given 40 s of visible reading When the tab goes to the background Then 40 s are sent for the page', async () => {
      const { router, trackPageDuration } = startTracking();

      await router.navigateByUrl('/offres/site-vitrine');
      elapse(40);
      becomeHidden();

      expect(trackPageDuration.mock.calls).toEqual([['/offres/site-vitrine', 40]]);
    });

    it('Given a hidden tab back to visible for 10 s When the visitor navigates elsewhere Then only the 10 visible seconds are sent for the previous page', async () => {
      const { router, trackPageView, trackPageDuration } = startTracking();

      await router.navigateByUrl('/offres/site-vitrine');
      elapse(40);
      becomeHidden();
      elapse(300);
      becomeVisible();
      elapse(10);
      await router.navigateByUrl('/');

      expect({ views: trackPageView.mock.calls, durations: trackPageDuration.mock.calls }).toEqual({
        views: [['/offres/site-vitrine'], ['/']],
        durations: [
          ['/offres/site-vitrine', 40],
          ['/offres/site-vitrine', 10],
        ],
      });
    });

    it('Given a fragment navigation within the page When the tab goes to the background Then the time is not split and not reset', async () => {
      const { router, trackPageDuration } = startTracking();

      await router.navigateByUrl('/offres/site-vitrine');
      elapse(20);
      await router.navigateByUrl('/offres/site-vitrine#demande');
      elapse(10);
      becomeHidden();

      expect(trackPageDuration.mock.calls).toEqual([['/offres/site-vitrine', 30]]);
    });

    it('Given 25 s of visible reading When the page is hidden by pagehide Then 25 s are sent', async () => {
      const { router, trackPageDuration } = startTracking();

      await router.navigateByUrl('/');
      elapse(25);
      leavePage();

      expect(trackPageDuration.mock.calls).toEqual([['/', 25]]);
    });

    it('Given the duration already sent on visibilitychange When pagehide follows Then no second, empty duration is sent', async () => {
      const { router, trackPageDuration } = startTracking();

      await router.navigateByUrl('/');
      elapse(25);
      becomeHidden();
      elapse(5);
      leavePage();

      expect(trackPageDuration.mock.calls).toEqual([['/', 25]]);
    });

    it('Given a page opened in a background tab When it is shown 5 s then hidden Then only the 5 visible seconds are sent', async () => {
      visibility = 'hidden';
      const { router, trackPageDuration } = startTracking();

      await router.navigateByUrl('/offres/site-vitrine');
      elapse(30);
      becomeVisible();
      elapse(5);
      becomeHidden();

      expect(trackPageDuration.mock.calls).toEqual([['/offres/site-vitrine', 5]]);
    });

    it('Given a page left immediately When the next page is reached Then no zero duration is sent', async () => {
      const { router, trackPageView, trackPageDuration } = startTracking();

      await router.navigateByUrl('/');
      await router.navigateByUrl('/offres/site-vitrine');

      expect({
        views: trackPageView.mock.calls.length,
        durations: trackPageDuration.mock.calls,
      }).toEqual({ views: 2, durations: [] });
    });

    it('Given 12.6 s of visible reading When the tab goes to the background Then the duration is rounded to the nearest second', async () => {
      const { router, trackPageDuration } = startTracking();

      await router.navigateByUrl('/');
      vi.advanceTimersByTime(12_600);
      becomeHidden();

      expect(trackPageDuration.mock.calls).toEqual([['/', 13]]);
    });
  });

  describe('cycle de vie', () => {
    it('Given tracking is started Then it listens to pagehide and never to beforeunload, which would evict the page from the bfcache', async () => {
      const addListener = vi.spyOn(window, 'addEventListener');
      const { router } = startTracking();

      await router.navigateByUrl('/');
      const listened = addListener.mock.calls.map(([type]) => type);

      expect({
        pagehide: listened.includes('pagehide'),
        beforeunload: listened.includes('beforeunload'),
      }).toEqual({ pagehide: true, beforeunload: false });
    });

    it('Given the application is destroyed When the tab is hidden again Then nothing more is sent', async () => {
      const { router, trackPageDuration } = startTracking();

      await router.navigateByUrl('/');
      elapse(8);
      becomeHidden();
      TestBed.resetTestingModule();
      becomeVisible();
      elapse(20);
      becomeHidden();
      leavePage();

      expect(trackPageDuration.mock.calls).toEqual([['/', 8]]);
    });
  });
});
