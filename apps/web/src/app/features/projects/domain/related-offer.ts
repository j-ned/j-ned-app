import type { OfferSlug } from '@features/offer/domain/models/offer.model';
import type { ProjectKind } from './models/project.model';

const OFFER_BY_PROJECT_KIND = {
  production: 'application-metier',
  demo: 'site-vitrine',
  script: null,
} as const satisfies Record<ProjectKind, OfferSlug | null>;

export function relatedOfferSlug(kind: ProjectKind | null): OfferSlug | null {
  return kind === null ? null : OFFER_BY_PROJECT_KIND[kind];
}
