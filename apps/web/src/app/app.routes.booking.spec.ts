import { TestBed } from '@angular/core/testing';
import { type ActivatedRouteSnapshot, type Route, Router, provideRouter } from '@angular/router';
import { BOOKING_ROUTES } from '@features/booking/booking.routes';
import { Booking } from '@features/booking/pages/booking/booking';
import { BookingCancellation } from '@features/booking/pages/booking-cancellation/booking-cancellation';
import { SITE_IDENTITY } from '@shared/identity/site-identity.static-data';
import { describe, expect, it } from 'vitest';
import { routes } from './app.routes';

const BOOKING_URL = `${SITE_IDENTITY.siteUrl}/rendez-vous`;
const CANCELLATION_URL = `${SITE_IDENTITY.siteUrl}/rendez-vous/annulation`;
const TOKEN = 'k3Jd9_x-Qm2LpZ7vR4tYw8NcB1sHf6Ga0UeOiXyTq5n';

const leafOf = (snapshot: ActivatedRouteSnapshot): ActivatedRouteSnapshot =>
  snapshot.firstChild ? leafOf(snapshot.firstChild) : snapshot;

async function landOn(url: string): Promise<{ url: string; leaf: ActivatedRouteSnapshot }> {
  TestBed.configureTestingModule({ providers: [provideRouter(routes)] });
  const router = TestBed.inject(Router);
  await router.navigateByUrl(url);
  return { url: router.url, leaf: leafOf(router.routerState.snapshot.root) };
}

const bookingRoute = (): Route | undefined => routes.find((route) => route.path === 'rendez-vous');

describe('booking route', () => {
  it('lazy loads the booking routes under /rendez-vous', async () => {
    const route = bookingRoute();

    expect({
      component: route?.component,
      children: route?.children,
      loaded: (await route?.loadChildren?.()) === BOOKING_ROUTES,
    }).toEqual({ component: undefined, children: undefined, loaded: true });
  });

  it('serves the booking page at /rendez-vous', async () => {
    const { url, leaf } = await landOn('/rendez-vous');

    expect({ url, page: leaf.component === Booking }).toEqual({ url: '/rendez-vous', page: true });
  });

  it('titles the page the same way in the tab and in the SEO data, under the site name', async () => {
    const { leaf } = await landOn('/rendez-vous');
    const title = leaf.routeConfig?.title;
    const seo = leaf.data['seo'] as Readonly<Record<string, unknown>> | undefined;

    expect({
      suffixed: typeof title === 'string' && title.endsWith(' | Julien Nédellec'),
      seoTitle: seo?.['title'] === title,
      url: seo?.['url'],
      type: seo?.['type'],
    }).toEqual({ suffixed: true, seoTitle: true, url: BOOKING_URL, type: 'website' });
  });

  it('gives the page a search snippet of at most 160 characters', async () => {
    const { leaf } = await landOn('/rendez-vous');
    const description = String(
      (leaf.data['seo'] as Readonly<Record<string, unknown>> | undefined)?.['description'] ?? '',
    );

    expect({ filled: description.length >= 70, short: description.length <= 160 }).toEqual({
      filled: true,
      short: true,
    });
  });

  it('places the booking page under the home page in the breadcrumb', async () => {
    const { leaf } = await landOn('/rendez-vous');
    const seo = leaf.data['seo'] as Readonly<Record<string, unknown>> | undefined;

    expect(seo?.['structuredData']).toEqual({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Accueil', item: SITE_IDENTITY.siteUrl },
        { '@type': 'ListItem', position: 2, name: 'Prendre rendez-vous', item: BOOKING_URL },
      ],
    });
  });
});

describe('booking cancellation route', () => {
  it('serves the cancellation page at /rendez-vous/annulation with the token in the fragment', async () => {
    const landed = await landOn(`/rendez-vous/annulation#${TOKEN}`).catch(() => null);

    expect(landed?.leaf.component === BookingCancellation).toBe(true);
  });

  it('titles the page under the site name and keeps its SEO data on a fixed url, out of the index', async () => {
    const landed = await landOn(`/rendez-vous/annulation#${TOKEN}`).catch(() => null);
    const title = landed?.leaf.routeConfig?.title;
    const seo = landed?.leaf.data['seo'] as Readonly<Record<string, unknown>> | undefined;

    expect({
      suffixed: typeof title === 'string' && title.endsWith(' | Julien Nédellec'),
      seoTitle: seo?.['title'] === title,
      url: seo?.['url'],
      robots: seo?.['robots'],
    }).toEqual({
      suffixed: true,
      seoTitle: true,
      url: CANCELLATION_URL,
      robots: 'noindex, nofollow',
    });
  });
});
