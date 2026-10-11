import type { Breadcrumb, ErrorEvent } from '@sentry/angular';
import { describe, it, expect } from 'vitest';
import { scrubBreadcrumb, scrubEvent } from './scrub-event';

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
