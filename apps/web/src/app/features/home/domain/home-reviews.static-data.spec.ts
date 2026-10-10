import { HOME_REVIEWS, HOME_REVIEWS_COPY } from './home-reviews.static-data';

describe('home reviews data', () => {
  it('holds no review until a real client has agreed to be quoted', () => {
    expect(HOME_REVIEWS).toEqual([]);
  });

  it('titles the section in the validated words', () => {
    expect(HOME_REVIEWS_COPY).toEqual({ heading: 'Avis clients' });
  });
});
