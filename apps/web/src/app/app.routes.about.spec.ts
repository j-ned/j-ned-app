import { SITE_IDENTITY } from '@shared/identity/site-identity.static-data';
import { routes } from './app.routes';

const aboutSeo = (): Readonly<Record<string, unknown>> | undefined =>
  routes.find((route) => route.path === 'about')?.data?.['seo'];

describe('about route', () => {
  it('gives the page a search snippet of at most 160 characters', () => {
    const description = String(aboutSeo()?.['description'] ?? '');

    expect(description.length).toBeGreaterThan(SITE_IDENTITY.journey.length);
    expect(description.length).toBeLessThanOrEqual(160);
  });
});
