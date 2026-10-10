import { makeReview } from '../testing/review-builders';
import { reviewsJsonLd } from './reviews-json-ld';

describe('reviewsJsonLd', () => {
  it('Given no review When the structured data is built Then it adds nothing', () => {
    expect(reviewsJsonLd([])).toEqual({});
  });

  it('Given two reviews When the structured data is built Then each one is a schema.org Review by its author, in order', () => {
    const reviews = [
      makeReview({
        id: 'a',
        quote: 'Premier avis.',
        authorName: 'Auteur A',
        datePublished: '2026-02-01',
      }),
      makeReview({
        id: 'b',
        quote: 'Second avis.',
        authorName: 'Auteur B',
        datePublished: '2026-03-01',
      }),
    ];

    expect(reviewsJsonLd(reviews)).toEqual({
      review: [
        {
          '@type': 'Review',
          author: { '@type': 'Person', name: 'Auteur A' },
          reviewBody: 'Premier avis.',
          datePublished: '2026-02-01',
        },
        {
          '@type': 'Review',
          author: { '@type': 'Person', name: 'Auteur B' },
          reviewBody: 'Second avis.',
          datePublished: '2026-03-01',
        },
      ],
    });
  });
});
