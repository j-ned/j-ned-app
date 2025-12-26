import type { Observable } from 'rxjs';
import type { SeoMetadata, StructuredData } from '../models';

export interface SeoGateway {
  getMetadataForRoute(route: string): Observable<SeoMetadata>;
  getStructuredDataForRoute(route: string): Observable<StructuredData | null>;

  // Future backend
  updateMetadata(route: string, metadata: SeoMetadata): Observable<SeoMetadata>;
}

export { SEO_GATEWAY } from './seo.gateway.token';
