import { makeBlogPost } from '../testing/blog-post-builders';
import { latestPosts } from './latest-posts';

describe('latestPosts', () => {
  const posts = [
    makeBlogPost({ slug: 'old', publishedAt: '2026-01-10T08:00:00Z' }),
    makeBlogPost({ slug: 'draft', publishedAt: null }),
    makeBlogPost({ slug: 'newest', publishedAt: '2026-09-01T08:00:00Z' }),
    makeBlogPost({ slug: 'middle', publishedAt: '2026-05-20T08:00:00Z' }),
    makeBlogPost({ slug: 'recent', publishedAt: '2026-08-15T08:00:00Z' }),
  ];

  it('Given published posts in any order When the 3 latest are asked Then they come newest first', () => {
    expect(latestPosts(posts, 3).map((p) => p.slug)).toEqual(['newest', 'recent', 'middle']);
  });

  it('Given a draft without publication date When the latest are asked Then it never shows up', () => {
    expect(latestPosts(posts, 10).map((p) => p.slug)).toEqual([
      'newest',
      'recent',
      'middle',
      'old',
    ]);
  });

  it.each([
    [0, 0],
    [-1, 0],
    [2, 2],
  ])('Given a count of %i When the latest are asked Then %i posts are returned', (count, size) => {
    expect(latestPosts(posts, count)).toHaveLength(size);
  });

  it('Given an input list When the latest are computed Then the input order is left untouched', () => {
    const input = [...posts];

    latestPosts(input, 3);

    expect(input.map((p) => p.slug)).toEqual(['old', 'draft', 'newest', 'middle', 'recent']);
  });
});
