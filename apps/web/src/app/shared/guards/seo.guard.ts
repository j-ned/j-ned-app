import { inject } from '@angular/core';
import { ActivatedRouteSnapshot } from '@angular/router';
import { SeoData, SeoManager } from '../services/seo.manager';

export interface SeoRouteData extends SeoData {
  structuredData?: object;
}

export const seoGuard = (route: ActivatedRouteSnapshot) => {
  const seoService = inject(SeoManager);
  const seoData = route.data['seo'] as SeoRouteData | undefined;

  if (seoData) {
    const { structuredData, ...metaData } = seoData;

    seoService.updateMetaTags(metaData);

    if (structuredData) {
      seoService.addStructuredData(structuredData);
    }
  }

  return true;
};
