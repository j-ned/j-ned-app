import { inject } from '@angular/core';
import { ActivatedRouteSnapshot } from '@angular/router';
import { SeoService, type SeoData } from '../services/seo.service';

export interface SeoRouteData extends SeoData {
  structuredData?: object;
}

export const seoGuard = (route: ActivatedRouteSnapshot) => {
  const seoService = inject(SeoService);
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
