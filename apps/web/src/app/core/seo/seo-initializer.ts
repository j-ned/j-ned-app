import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { SITE_IDENTITY } from '@shared/identity/site-identity.static-data';
import { navigationEnd$ } from '@core/navigation/navigation-end';
import { Seo, type SeoData } from './seo';

const OPTIONAL_TEXT_FIELDS = [
  'keywords',
  'url',
  'image',
  'imageAlt',
  'type',
  'robots',
] as const satisfies readonly (keyof SeoData)[];

const isRecord = (value: unknown): value is Readonly<Record<string, unknown>> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

function isSeoData(value: unknown): value is SeoData {
  return (
    isRecord(value) &&
    typeof value['title'] === 'string' &&
    typeof value['description'] === 'string' &&
    OPTIONAL_TEXT_FIELDS.every(
      (field) => value[field] === undefined || typeof value[field] === 'string',
    ) &&
    (value['structuredData'] === undefined || isRecord(value['structuredData']))
  );
}

export function initializeSeo(): () => void {
  return (): void => {
    const router = inject(Router);
    const seoService = inject(Seo);

    navigationEnd$(router).subscribe((event) => {
      let route = router.routerState.snapshot.root;
      while (route.firstChild) {
        route = route.firstChild;
      }

      const seoData: unknown = route.data['seo'];
      if (isSeoData(seoData)) {
        const url = seoData.url ?? `${SITE_IDENTITY.siteUrl}${event.urlAfterRedirects}`;
        seoService.applySeoData({ ...seoData, url });
      }
    });
  };
}
