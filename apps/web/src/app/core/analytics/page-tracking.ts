import { DestroyRef, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter, fromEvent } from 'rxjs';

import { AnalyticsGateway } from '@features/analytics/domain/gateways/analytics.gateway';
import { trackedPath } from '@features/analytics/domain/tracked-path';
import { VisibleTimeMeter } from '@features/analytics/domain/visible-time-meter';
import { isNotFoundRoute } from './not-found-route';

export function initializePageTracking(): () => void {
  return (): void => {
    if (!isPlatformBrowser(inject(PLATFORM_ID))) return;

    const router = inject(Router);
    const analytics = inject(AnalyticsGateway);
    const destroyRef = inject(DestroyRef);
    const meter = new VisibleTimeMeter();
    let currentPath: string | null = null;

    const sendVisibleTime = (): void => {
      if (currentPath === null) return;
      const seconds = Math.round(meter.drain(Date.now()) / 1_000);
      if (seconds > 0) analytics.trackPageDuration(currentPath, seconds);
    };

    router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(destroyRef),
      )
      .subscribe((event) => {
        const path = trackedPath(event.urlAfterRedirects);
        if (path === currentPath) return;

        sendVisibleTime();
        if (isNotFoundRoute(router.routerState.snapshot.root)) {
          currentPath = null;
          return;
        }

        currentPath = path;
        meter.start(Date.now(), document.visibilityState === 'visible');
        analytics.trackPageView(path);
      });

    fromEvent(document, 'visibilitychange')
      .pipe(takeUntilDestroyed(destroyRef))
      .subscribe(() => {
        if (document.visibilityState === 'hidden') {
          sendVisibleTime();
          meter.pause(Date.now());
        } else {
          meter.resume(Date.now());
        }
      });

    // `pagehide` plutôt que `beforeunload` : ce dernier exclut la page du bfcache.
    fromEvent(window, 'pagehide').pipe(takeUntilDestroyed(destroyRef)).subscribe(sendVisibleTime);
  };
}
