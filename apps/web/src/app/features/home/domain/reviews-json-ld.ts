import type { Review } from './models/review.model';

export function reviewsJsonLd(reviews: readonly Review[]): Readonly<Record<string, unknown>> {
  return reviews.length
    ? {
        review: reviews.map(({ authorName, quote, datePublished }) => ({
          '@type': 'Review',
          author: { '@type': 'Person', name: authorName },
          reviewBody: quote,
          datePublished,
        })),
      }
    : {};
}
