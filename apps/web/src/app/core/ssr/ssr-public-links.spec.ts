import { Component, REQUEST_CONTEXT, inject } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { afterEach, describe, expect, it } from 'vitest';
import { AnalyticsGateway } from '@features/analytics/domain/gateways/analytics.gateway';
import { stubAnalyticsGateway } from '@features/analytics/testing/stub-analytics-gateway';
import { CvDownload } from '@features/cv/application/cv-download';
import { CvGateway } from '@features/cv/domain/gateways/cv.gateway';
import { HttpCvGateway } from '@features/cv/infra/gateways/http-cv.gateway';
import { makeCvInfo } from '@features/cv/testing/cv-builders';
import { AboutHero } from '@features/profile/application/about-hero';
import type { SocialButton } from '@features/profile/domain/models/profile.model';
import { aProfileContent, aProfileInfo } from '@features/profile/testing/profile-builders';
import type { SsrRequestContext } from './ssr-request-context';
import { provideSsrApiBaseUrl } from './ssr-api-base-url';

const UPSTREAM_ORIGIN = 'http://portfolio-api:3000';
const SITE_ORIGIN = 'https://nedellec-julien.fr';

@Component({
  imports: [AboutHero],
  providers: [CvDownload],
  template: `<app-about-hero
    [profile]="profile"
    [biography]="biography"
    [socials]="socials"
    [cvUrl]="download.url()"
  />`,
})
class CvLinkHost {
  protected readonly download = inject(CvDownload);
  protected readonly profile = aProfileInfo();
  protected readonly biography = aProfileContent().biography;
  protected readonly socials: readonly SocialButton[] = [];
}

async function renderOnServer(): Promise<HTMLElement> {
  const context: SsrRequestContext = {
    apiBaseUrl: `${UPSTREAM_ORIGIN}/api`,
    visitorForwardedFor: null,
  };
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      provideHttpClient(),
      provideHttpClientTesting(),
      { provide: REQUEST_CONTEXT, useValue: context },
      provideSsrApiBaseUrl(),
      { provide: CvGateway, useClass: HttpCvGateway },
      { provide: AnalyticsGateway, useValue: stubAnalyticsGateway() },
    ],
  });
  const fixture = TestBed.createComponent(CvLinkHost);
  TestBed.inject(HttpTestingController).expectOne(`${UPSTREAM_ORIGIN}/api/cv`).flush(makeCvInfo());
  await fixture.whenStable();
  return fixture.nativeElement as HTMLElement;
}

describe('Public links rendered on the server', () => {
  afterEach(() => TestBed.inject(HttpTestingController).verify());

  it('Given a request rendered against the internal API upstream When the CV link is rendered Then no href points at the upstream', async () => {
    const element = await renderOnServer();

    const hrefs = [...element.querySelectorAll('a[href]')].map((a) => a.getAttribute('href') ?? '');
    const cvHref = element.querySelector('[data-testid="about-hero-cv"]')?.getAttribute('href');

    expect(cvHref).toBe('/api/cv/download');
    expect(hrefs.filter((href) => new URL(href, SITE_ORIGIN).origin === UPSTREAM_ORIGIN)).toEqual(
      [],
    );
  });
});
