import { InjectionToken } from '@angular/core';
import type { SeoGateway } from './seo.gateway';

export const SEO_GATEWAY = new InjectionToken<SeoGateway>('SeoGateway', {
  providedIn: 'root',
  factory: () => {
    throw new Error('SeoGateway must be provided in app.config.ts');
  },
});
