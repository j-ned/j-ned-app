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

    // Update meta tags
    seoService.updateMetaTags(metaData);

    // Add structured data if provided
    if (structuredData) {
      seoService.addStructuredData(structuredData);
    }
  }

  return true;
};
