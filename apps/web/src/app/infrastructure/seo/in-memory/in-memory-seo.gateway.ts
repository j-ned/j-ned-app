import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import type { SeoGateway } from '../../../core/seo/gateways';
import type { SeoMetadata, StructuredData } from '../../../core/seo/models';
import { SEO_METADATA_MAP, STRUCTURED_DATA_MAP } from './seo.data';

@Injectable()
export class InMemorySeoGateway implements SeoGateway {
  getMetadataForRoute(route: string): Observable<SeoMetadata> {
    const metadata = SEO_METADATA_MAP[route] || SEO_METADATA_MAP['/'];
    return of(metadata).pipe(delay(50));
  }

  getStructuredDataForRoute(route: string): Observable<StructuredData | null> {
    const data = STRUCTURED_DATA_MAP[route] || null;
    return of(data).pipe(delay(50));
  }

  updateMetadata(route: string, metadata: SeoMetadata): Observable<SeoMetadata> {
    // In-memory simulation - would mutate SEO_METADATA_MAP
    return of(metadata).pipe(delay(200));
  }
}
