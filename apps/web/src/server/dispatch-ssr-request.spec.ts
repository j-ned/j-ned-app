import { describe, expect, it } from 'vitest';
import { dispatchSsrRequest, type SsrTarget } from './dispatch-ssr-request';

describe('dispatchSsrRequest', () => {
  it.each<[string, SsrTarget]>([
    ['/healthz', 'health'],
    ['/sitemap.xml', 'sitemap'],
    ['/rss.xml', 'rss'],
    ['/', 'angular'],
    ['/blog/x', 'angular'],
    ['/projects', 'angular'],
    ['/blog/rss.xml', 'angular'],
    ['/healthz/extra', 'angular'],
  ])('Given the pathname %s When it is dispatched Then it targets %s', (pathname, target) => {
    expect(dispatchSsrRequest(pathname)).toBe(target);
  });
});
