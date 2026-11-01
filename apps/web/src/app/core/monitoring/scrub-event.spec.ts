import type { BrowserOptions, Breadcrumb, ErrorEvent } from '@sentry/angular';
import { describe, it, expect } from 'vitest';
import { scrubBreadcrumb, scrubEvent, scrubSpan } from './scrub-event';

type StreamedSpan = Parameters<NonNullable<BrowserOptions['beforeSendSpan']>>[0];

const anEvent = (request?: ErrorEvent['request']): ErrorEvent => ({ type: undefined, request });

describe('scrubEvent', () => {
  it.each([
    {
      label: 'a query string',
      url: 'https://nedellec-julien.fr/blog?email=a@b.c&token=x',
      expected: 'https://nedellec-julien.fr/blog',
    },
    {
      label: 'a fragment',
      url: 'https://nedellec-julien.fr/blog#y',
      expected: 'https://nedellec-julien.fr/blog',
    },
    {
      label: 'a query string and a fragment',
      url: 'https://nedellec-julien.fr/blog?email=a@b.c&token=x#y',
      expected: 'https://nedellec-julien.fr/blog',
    },
    {
      label: 'no query string',
      url: 'https://nedellec-julien.fr/projects/angular-portfolio',
      expected: 'https://nedellec-julien.fr/projects/angular-portfolio',
    },
  ])(
    'given a page URL with $label, when scrubbed, then it becomes $expected',
    ({ url, expected }) => {
      const scrubbed = scrubEvent(anEvent({ url, headers: { Authorization: 'Bearer t' } }));

      expect(scrubbed.request?.url).toBe(expected);
    },
  );

  it('given an invalid URL, when scrubbed, then everything from the first ? or # is dropped', () => {
    const scrubbed = scrubEvent(
      anEvent({ url: 'not a url?token=x#y', headers: { Authorization: 'Bearer t' } }),
    );

    expect(scrubbed.request?.url).toBe('not a url');
  });

  it('given a request without URL, when scrubbed, then the Authorization header is still removed', () => {
    const scrubbed = scrubEvent(
      anEvent({ headers: { Authorization: 'Bearer t', 'User-Agent': 'ua' } }),
    );

    expect(scrubbed.request).toEqual({ headers: { 'User-Agent': 'ua' } });
  });

  it.each(['Authorization', 'authorization'])(
    'given the %s header and a cookie header, when scrubbed, then both are removed and other headers are kept',
    (header) => {
      const scrubbed = scrubEvent(
        anEvent({
          url: 'https://nedellec-julien.fr/',
          headers: { [header]: 'Bearer t', cookie: 'session=s', 'User-Agent': 'ua' },
        }),
      );

      expect(scrubbed.request?.headers).toEqual({ 'User-Agent': 'ua' });
    },
  );

  it('given filtered body fields and cookies, when scrubbed, then they are masked and cookies dropped', () => {
    const scrubbed = scrubEvent(
      anEvent({
        url: 'https://nedellec-julien.fr/contact',
        cookies: { session: 's' },
        data: { email: 'a@b.c', password: 'p', message: 'hello' },
      }),
    );

    expect(scrubbed.request).toEqual({
      url: 'https://nedellec-julien.fr/contact',
      data: { email: '[Filtered]', password: '[Filtered]', message: 'hello' },
    });
  });

  it('given an event without request, when scrubbed, then it is returned without throwing', () => {
    const event = anEvent();

    expect(scrubEvent(event)).toEqual({ type: undefined, request: undefined });
  });
});

describe('scrubEvent stack frames', () => {
  const TOKEN_URL =
    'https://nedellec-julien.fr/rendez-vous/annulation#AbCdEfGhIjKlMnOpQrStUvWxYz0123456789_-abcde';
  const PAGE_URL = 'https://nedellec-julien.fr/rendez-vous/annulation';

  it('given a global error whose frame filename is the page URL with the cancel token, when scrubbed, then filename and abs_path lose the fragment', () => {
    const event: ErrorEvent = {
      type: undefined,
      exception: {
        values: [
          {
            type: 'Error',
            value: 'Script error',
            stacktrace: {
              frames: [
                { filename: TOKEN_URL, abs_path: TOKEN_URL, lineno: 1 },
                { filename: 'https://nedellec-julien.fr/main-ABCDEFGH.js', lineno: 2 },
              ],
            },
          },
        ],
      },
    };

    const frames = scrubEvent(event).exception?.values?.[0]?.stacktrace?.frames;

    expect(frames).toEqual([
      { filename: PAGE_URL, abs_path: PAGE_URL, lineno: 1 },
      { filename: 'https://nedellec-julien.fr/main-ABCDEFGH.js', lineno: 2 },
    ]);
    expect(JSON.stringify(scrubEvent(event))).not.toContain('AbCdEf');
  });

  it('given an exception without stack trace, when scrubbed, then it is kept as is', () => {
    const event: ErrorEvent = {
      type: undefined,
      exception: { values: [{ type: 'Error', value: 'boom' }] },
    };

    expect(scrubEvent(event)).toEqual(event);
  });
});

describe('scrubBreadcrumb', () => {
  it.each([
    { category: 'fetch', url: '/api/fail?email=x@y.z', expected: '/api/fail' },
    { category: 'xhr', url: '/api/fail#token=x', expected: '/api/fail' },
    {
      category: 'fetch',
      url: 'https://api.nedellec-julien.fr/api/x?email=a@b.c#y',
      expected: 'https://api.nedellec-julien.fr/api/x',
    },
    { category: 'xhr', url: '/api/projects', expected: '/api/projects' },
  ])(
    'given a $category breadcrumb to $url, when scrubbed, then its url becomes $expected and other data is kept',
    ({ category, url, expected }) => {
      const breadcrumb: Breadcrumb = {
        category,
        type: 'http',
        data: { method: 'GET', url, status_code: 500 },
      };

      expect(scrubBreadcrumb(breadcrumb)).toEqual({
        category,
        type: 'http',
        data: { method: 'GET', url: expected, status_code: 500 },
      });
    },
  );

  it.each([
    {
      from: '/login?returnUrl=%2Fadmin',
      to: '/admin#top',
      expected: { from: '/login', to: '/admin' },
    },
    { from: '/', to: '/blog?tag=angular', expected: { from: '/', to: '/blog' } },
  ])(
    'given a navigation breadcrumb from $from to $to, when scrubbed, then both URLs lose their query and fragment',
    ({ from, to, expected }) => {
      const scrubbed = scrubBreadcrumb({ category: 'navigation', data: { from, to } });

      expect(scrubbed).toEqual({ category: 'navigation', data: expected });
    },
  );

  it.each<Breadcrumb>([
    { category: 'ui.click', message: 'button', data: { url: '/x?email=a@b.c' } },
    { category: 'console', message: 'log', data: { from: '/a?b=c' } },
    { category: 'sentry.event', message: 'Error: boom' },
  ])('given a $category breadcrumb, when scrubbed, then it passes unchanged', (breadcrumb) => {
    const copy = structuredClone(breadcrumb);

    expect(scrubBreadcrumb(breadcrumb)).toEqual(copy);
  });

  it.each(['fetch', 'xhr', 'navigation'])(
    'given a %s breadcrumb without data, when scrubbed, then it is returned without throwing',
    (category) => {
      expect(scrubBreadcrumb({ category })).toEqual({ category });
    },
  );
});

const CANCELLATION_TOKEN = 'aB3_dE6-gH9iJ2kL5mN8oP1qR4sT7uV0wX3yZ6aB9cD';
const CANCELLATION_URL = `https://nedellec-julien.fr/rendez-vous/annulation#${CANCELLATION_TOKEN}`;

const aSpan = (attributes: StreamedSpan['attributes'], isSegment = true): StreamedSpan => ({
  trace_id: 't'.repeat(32),
  span_id: 's'.repeat(16),
  name: '/rendez-vous/annulation',
  start_timestamp: 1,
  status: 'ok',
  is_segment: isSegment,
  attributes,
});

describe('scrubSpan', () => {
  it.each(['url.full', 'http.url'])(
    'given a page span whose %s carries the cancellation token in its fragment, when scrubbed, then the token is gone and other attributes are kept',
    (key) => {
      const span = aSpan({ [key]: CANCELLATION_URL, 'url.path': '/rendez-vous/annulation' });

      const scrubbed = scrubSpan(span);

      expect(scrubbed.attributes).toEqual({
        [key]: 'https://nedellec-julien.fr/rendez-vous/annulation',
        'url.path': '/rendez-vous/annulation',
      });
      expect(JSON.stringify(scrubbed)).not.toContain(CANCELLATION_TOKEN);
    },
  );

  it('given a request span with a query string, when scrubbed, then url.full loses it and url.query / url.fragment are dropped', () => {
    const scrubbed = scrubSpan(
      aSpan(
        {
          'url.full': 'https://api.nedellec-julien.fr/api/x?email=a@b.c#y',
          'url.query': '?email=a@b.c',
          'url.fragment': 'y',
          'http.request.method': 'GET',
        },
        false,
      ),
    );

    expect(scrubbed.attributes).toEqual({
      'url.full': 'https://api.nedellec-julien.fr/api/x',
      'http.request.method': 'GET',
    });
  });

  it.each([
    {
      label: 'an URL without query nor fragment',
      attributes: { 'url.full': 'https://nedellec-julien.fr/rendez-vous' },
    },
    { label: 'no URL attribute', attributes: { 'sentry.op': 'ui.click' } },
  ])('given a span with $label, when scrubbed, then it is equal to the input', ({ attributes }) => {
    const span = aSpan(attributes);
    const copy = structuredClone(span);

    expect(scrubSpan(span)).toEqual(copy);
  });

  it('given a span carrying the token, when scrubbed, then the input span is not modified in place', () => {
    const span = aSpan({ 'url.full': CANCELLATION_URL });

    scrubSpan(span);

    expect(span.attributes['url.full']).toBe(CANCELLATION_URL);
  });

  it('given several spans of the same trace, when each is scrubbed, then none carries the token', () => {
    const spans = [
      aSpan({ 'url.full': CANCELLATION_URL }),
      aSpan({ 'http.url': CANCELLATION_URL }, false),
      aSpan({ 'url.full': 'https://api.nedellec-julien.fr/api/booking/cancel/preview' }, false),
    ];

    const scrubbed = spans.map(scrubSpan);

    expect(JSON.stringify(scrubbed)).not.toContain(CANCELLATION_TOKEN);
    expect(scrubbed[2].attributes['url.full']).toBe(
      'https://api.nedellec-julien.fr/api/booking/cancel/preview',
    );
  });
});
