import type { OfferSlug } from '@features/offer/domain/models/offer.model';
import type { ProjectKind } from './models/project.model';
import { relatedOfferSlug } from './related-offer';

describe('relatedOfferSlug', () => {
  it.each<{ kind: ProjectKind | null; expected: OfferSlug | null }>([
    { kind: 'production', expected: 'application-metier' },
    { kind: 'demo', expected: 'site-vitrine' },
    { kind: 'script', expected: null },
    { kind: null, expected: null },
  ])(
    'Given a project of kind $kind When its related offer is read Then it is $expected',
    ({ kind, expected }) => {
      expect(relatedOfferSlug(kind)).toBe(expected);
    },
  );
});
