export type SsrTarget = 'health' | 'sitemap' | 'rss' | 'angular';

const FIXED_TARGETS: ReadonlyMap<string, SsrTarget> = new Map([
  ['/healthz', 'health'],
  ['/sitemap.xml', 'sitemap'],
  ['/rss.xml', 'rss'],
]);

export function dispatchSsrRequest(pathname: string): SsrTarget {
  return FIXED_TARGETS.get(pathname) ?? 'angular';
}
