import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, type ActivatedRouteSnapshot } from '@angular/router';
import { describe, it, expect } from 'vitest';
import { BlankPage } from '@shared/testing/blank-page';
import { isNotFoundRoute } from './not-found-route';

function setupRouter(): Router {
  TestBed.configureTestingModule({
    providers: [
      provideRouter([
        { path: 'blog', component: BlankPage },
        { path: 'admin', children: [{ path: 'analytics', component: BlankPage }] },
        { path: '**', component: BlankPage },
      ]),
    ],
  });
  return TestBed.inject(Router);
}

async function rootSnapshotAfter(url: string): Promise<ActivatedRouteSnapshot> {
  const router = setupRouter();
  await router.navigateByUrl(url);
  return router.routerState.snapshot.root;
}

describe('isNotFoundRoute', () => {
  it.each<[string, string, boolean]>([
    ['root → blog', '/blog', false],
    ['root → admin → analytics', '/admin/analytics', false],
    ['root → **', '/wp-login.php', true],
  ])('%s', async (_label, url, expected) => {
    expect(isNotFoundRoute(await rootSnapshotAfter(url))).toBe(expected);
  });

  it('root alone', () => {
    expect(isNotFoundRoute(setupRouter().routerState.snapshot.root)).toBe(false);
  });
});
