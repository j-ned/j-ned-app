import { SITE_IDENTITY } from '@shared/identity/site-identity.static-data';
import { routes } from './app.routes';

type Seo = {
  readonly title?: string;
  readonly description?: string;
  readonly url?: string;
  readonly structuredData?: {
    readonly '@type'?: string;
    readonly itemListElement?: readonly {
      readonly position: number;
      readonly name?: string;
      readonly item?: string;
    }[];
  };
};

const seoRoutes = routes.flatMap((route) =>
  route.data?.['seo'] ? [[route.path ?? '', route.data['seo'] as Seo] as const] : [],
);

describe('public routes SEO data', () => {
  it('declares SEO data on several routes', () => {
    expect(seoRoutes.length).toBeGreaterThan(3);
  });

  it.each(seoRoutes)(
    'Given the route "%s" Then its SEO data is complete and well formed',
    (_, seo) => {
      expect(seo.title?.trim()).toBeTruthy();
      expect(seo.description?.trim()).toBeTruthy();
      expect(seo.description?.length).toBeLessThanOrEqual(160);
      expect(seo.url?.startsWith(SITE_IDENTITY.siteUrl)).toBe(true);

      if (seo.structuredData?.['@type'] === 'BreadcrumbList') {
        const items = seo.structuredData.itemListElement ?? [];
        expect(items.map((item) => item.position)).toEqual(items.map((_item, index) => index + 1));
        expect(items.every((item) => !!item.name && !!item.item)).toBe(true);
      }
    },
  );
});
