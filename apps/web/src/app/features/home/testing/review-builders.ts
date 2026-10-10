import type { Review } from '../domain/models/review.model';

export function makeReview(overrides: Partial<Review> = {}): Review {
  return {
    id: 'review-1',
    quote: 'Citation de test.',
    authorName: 'Auteur de test',
    authorContext: 'Métier de test · Entreprise de test · Ville de test',
    datePublished: '2026-01-15',
    ...overrides,
  };
}
