import { makeBlogPost } from '../testing/blog-post-builders';
import { filterPostsByCategory } from './filter-posts-by-category';
import type { BlogPost } from './models/blog-post.model';
import type { BlogCategoryFilter } from './models/blog-tag.model';

const POSTS: readonly BlogPost[] = [
  makeBlogPost({ id: 'a', slug: 'a', tags: ['Angular', 'Reconversion'] }),
  makeBlogPost({ id: 'b', slug: 'b', tags: ['RGPD'] }),
  makeBlogPost({ id: 'c', slug: 'c', tags: ['Inconnu'] }),
  makeBlogPost({ id: 'd', slug: 'd', tags: ['DashFlow', 'Docker', 'Tests'] }),
  makeBlogPost({ id: 'e', slug: 'e', tags: [] }),
];

describe('filterPostsByCategory', () => {
  it.each<{ category: BlogCategoryFilter; expected: readonly string[] }>([
    { category: 'all', expected: ['a', 'b', 'c', 'd', 'e'] },
    { category: 'stack', expected: ['a', 'd'] },
    { category: 'security', expected: ['b'] },
    { category: 'engineering', expected: ['d'] },
    { category: 'journey', expected: ['a'] },
    { category: 'projects', expected: ['d'] },
  ])(
    'Given posts When filtered by $category Then only the posts with a tag of that category remain, in order',
    ({ category, expected }) => {
      expect(filterPostsByCategory(POSTS, category).map((post) => post.slug)).toEqual(expected);
    },
  );

  it('Given « Tous » When the posts are filtered Then the very same list comes back', () => {
    expect(filterPostsByCategory(POSTS, 'all')).toBe(POSTS);
  });

  it.each<{ category: BlogCategoryFilter }>([
    { category: 'stack' },
    { category: 'engineering' },
    { category: 'projects' },
  ])(
    'Given a post spanning stack, engineering and projects When filtered by $category Then that post is listed',
    ({ category }) => {
      const spanning = makeBlogPost({ slug: 'spanning', tags: ['DashFlow', 'Docker', 'Tests'] });

      expect(filterPostsByCategory([spanning], category)).toEqual([spanning]);
    },
  );

  it('Given no post When filtered by a category Then the result is empty', () => {
    expect(filterPostsByCategory([], 'stack')).toEqual([]);
  });
});
