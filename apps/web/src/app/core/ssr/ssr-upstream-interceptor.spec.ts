import {
  HttpClient,
  HttpErrorResponse,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { PLATFORM_ID, REQUEST_CONTEXT, RESPONSE_INIT, type Provider } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ssrUpstreamInterceptor } from './ssr-upstream-interceptor';

const INTERNAL_API_BASE_URL = 'http://api:3000/api';
const VISITOR = '203.0.113.7';

type Platform = 'server' | 'browser';

function setUp(
  platform: Platform,
  requestContext?: unknown,
  extraProviders: Provider[] = [],
): void {
  const contextProviders: Provider[] =
    requestContext === undefined ? [] : [{ provide: REQUEST_CONTEXT, useValue: requestContext }];
  TestBed.configureTestingModule({
    providers: [
      provideHttpClient(withInterceptors([ssrUpstreamInterceptor])),
      provideHttpClientTesting(),
      { provide: PLATFORM_ID, useValue: platform },
      ...contextProviders,
      ...extraProviders,
    ],
  });
}

function forwardedForSentTo(url: string): string | null {
  TestBed.inject(HttpClient).get(url).subscribe();
  const request = TestBed.inject(HttpTestingController).expectOne(url);
  request.flush({});
  return request.request.headers.get('X-Forwarded-For');
}

describe('ssrUpstreamInterceptor', () => {
  afterEach(() => {
    TestBed.inject(HttpTestingController).verify();
    vi.useRealTimers();
  });

  it.each([VISITOR, '198.51.100.4, 203.0.113.7'])(
    'Given a server render for the visitor %s When the page reads the internal API Then the request carries the visitor address',
    (visitorForwardedFor) => {
      setUp('server', { apiBaseUrl: INTERNAL_API_BASE_URL, visitorForwardedFor });

      expect(forwardedForSentTo(`${INTERNAL_API_BASE_URL}/blog/posts`)).toBe(visitorForwardedFor);
    },
  );

  it.each([
    ['the public API', 'https://api.nedellec-julien.fr/api/blog/posts'],
    ['a third-party origin', 'https://giscus.app/api/discussions'],
    ['a relative asset', '/assets/manifest.json'],
  ])(
    'Given a server render When a request goes to %s Then only the internal API request carries the visitor address',
    (_label, outsideUrl) => {
      setUp('server', { apiBaseUrl: INTERNAL_API_BASE_URL, visitorForwardedFor: VISITOR });

      expect({
        internal: forwardedForSentTo(`${INTERNAL_API_BASE_URL}/projects`),
        outside: forwardedForSentTo(outsideUrl),
      }).toEqual({ internal: VISITOR, outside: null });
    },
  );

  it('Given a server render without a known visitor address When the page reads the internal API Then no forwarded address is sent', () => {
    setUp('server', { apiBaseUrl: INTERNAL_API_BASE_URL, visitorForwardedFor: null });

    expect(forwardedForSentTo(`${INTERNAL_API_BASE_URL}/blog/posts`)).toBeNull();
  });

  it('Given a server render without request context When the page reads the API Then no forwarded address is sent', () => {
    setUp('server');

    expect(forwardedForSentTo('https://api.nedellec-julien.fr/api/blog/posts')).toBeNull();
  });

  it('Given the browser When the page reads the API Then no forwarded address is sent', () => {
    setUp('browser');

    expect(forwardedForSentTo('https://api.nedellec-julien.fr/api/blog/posts')).toBeNull();
  });

  describe('upstream failures during a server render', () => {
    type Outcome = {
      readonly responseStatus: number | undefined;
      readonly propagatedStatus: number | null;
    };

    function renderReadingTheApi(
      upstreamStatus: number,
      method: 'GET' | 'POST' = 'GET',
      responseInit: ResponseInit | null = { status: 200, headers: new Headers() },
    ): Outcome {
      setUp(
        'server',
        { apiBaseUrl: INTERNAL_API_BASE_URL, visitorForwardedFor: VISITOR },
        responseInit ? [{ provide: RESPONSE_INIT, useValue: responseInit }] : [],
      );
      const url = `${INTERNAL_API_BASE_URL}/blog/posts`;
      let propagated: unknown = null;
      TestBed.inject(HttpClient)
        .request(method, url)
        .subscribe({ error: (error: unknown) => (propagated = error) });
      const request = TestBed.inject(HttpTestingController).expectOne(url);
      if (upstreamStatus === 0) request.error(new ProgressEvent('error'));
      else if (upstreamStatus >= 400)
        request.flush(null, { status: upstreamStatus, statusText: 'Upstream' });
      else request.flush([]);
      return {
        responseStatus: responseInit?.status,
        propagatedStatus: propagated instanceof HttpErrorResponse ? propagated.status : null,
      };
    }

    it.each([0, 400, 401, 403, 429, 500, 503])(
      'Given the API answers %s to a GET When the page renders Then the page answers 503 and the error still reaches the page',
      (upstreamStatus) => {
        expect(renderReadingTheApi(upstreamStatus)).toEqual({
          responseStatus: 503,
          propagatedStatus: upstreamStatus,
        });
      },
    );

    it.each([
      [200, null],
      [404, 404],
    ])(
      'Given the API answers %s to a GET When the page renders Then the page status is left as it is',
      (upstreamStatus, propagatedStatus) => {
        expect(renderReadingTheApi(upstreamStatus)).toEqual({
          responseStatus: 200,
          propagatedStatus,
        });
      },
    );

    it('Given a write that fails upstream When the page renders Then the page status is left as it is', () => {
      expect(renderReadingTheApi(500, 'POST')).toEqual({
        responseStatus: 200,
        propagatedStatus: 500,
      });
    });

    it('Given the API never answers a GET When three seconds pass Then the read is abandoned and the page answers 503', async () => {
      vi.useFakeTimers();
      const responseInit: ResponseInit = { status: 200, headers: new Headers() };
      setUp('server', { apiBaseUrl: INTERNAL_API_BASE_URL, visitorForwardedFor: VISITOR }, [
        { provide: RESPONSE_INIT, useValue: responseInit },
      ]);
      const url = `${INTERNAL_API_BASE_URL}/blog/posts`;
      let propagated: unknown = null;
      TestBed.inject(HttpClient)
        .get(url)
        .subscribe({ error: (error: unknown) => (propagated = error) });
      TestBed.inject(HttpTestingController).expectOne(url);

      await vi.advanceTimersByTimeAsync(2_999);
      const before = { status: responseInit.status, propagated };
      await vi.advanceTimersByTimeAsync(1);

      expect({
        before,
        after: { status: responseInit.status, error: (propagated as Error | null)?.name },
      }).toEqual({
        before: { status: 200, propagated: null },
        after: { status: 503, error: 'TimeoutError' },
      });
    });

    it('Given no response to shape When the API fails Then the error still reaches the page', () => {
      expect(renderReadingTheApi(503, 'GET', null)).toEqual({
        responseStatus: undefined,
        propagatedStatus: 503,
      });
    });
  });
});
