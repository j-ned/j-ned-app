import { DestroyRef, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { filter, fromEvent, merge } from 'rxjs';

import { AnalyticsGateway } from '@features/analytics/domain/gateways/analytics.gateway';
import { outboundChannel } from '@features/analytics/domain/outbound-channel';
import { trackedPath } from '@features/analytics/domain/tracked-path';
import { SITE_IDENTITY } from '@shared/identity/site-identity.static-data';

const MIDDLE_BUTTON = 1;

export function initializeOutboundClickTracking(): () => void {
  return (): void => {
    if (!isPlatformBrowser(inject(PLATFORM_ID))) return;

    const router = inject(Router);
    const analytics = inject(AnalyticsGateway);

    merge(
      fromEvent<MouseEvent>(document, 'click'),
      fromEvent<MouseEvent>(document, 'auxclick').pipe(
        filter((event) => event.button === MIDDLE_BUTTON),
      ),
    )
      .pipe(takeUntilDestroyed(inject(DestroyRef)))
      .subscribe((event) => {
        const anchor =
          event.target instanceof Element
            ? event.target.closest<HTMLAnchorElement>('a[href]')
            : null;
        if (!anchor) return;
        const channel = outboundChannel(anchor.href, SITE_IDENTITY.siteUrl);
        if (channel) analytics.trackOutboundClick(channel, trackedPath(router.url));
      });
  };
}
