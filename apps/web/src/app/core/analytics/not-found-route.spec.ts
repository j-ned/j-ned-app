import type { ActivatedRouteSnapshot } from '@angular/router';
import { describe, it, expect } from 'vitest';
import { isNotFoundRoute } from './not-found-route';

function snapshot(path: string | undefined, child?: ActivatedRouteSnapshot): ActivatedRouteSnapshot {
  return {
    routeConfig: path === undefined ? null : { path },
    firstChild: child ?? null,
  } as unknown as ActivatedRouteSnapshot;
}

describe('isNotFoundRoute', () => {
  it.each<[string, ActivatedRouteSnapshot, boolean]>([
    ['root → blog', snapshot(undefined, snapshot('blog')), false],
    ['root → admin → analytics', snapshot(undefined, snapshot('admin', snapshot('analytics'))), false],
    ['root → **', snapshot(undefined, snapshot('**')), true],
    ['root alone', snapshot(undefined), false],
  ])('%s', (_label, root, expected) => {
    expect(isNotFoundRoute(root)).toBe(expected);
  });
});
