import { makeBlogPost } from '../testing/blog-post-builders';
import { filterPostsByTag } from './filter-posts-by-tag';
import type { BlogPost } from './models/blog-post.model';

const POSTS: readonly BlogPost[] = [
  makeBlogPost({ id: 'a', slug: 'a', tags: ['Angular', 'NestJS'] }),
  makeBlogPost({ id: 'b', slug: 'b', tags: ['DevOps'] }),
  makeBlogPost({ id: 'c', slug: 'c', tags: ['AngularJS', 'Angular'] }),
  makeBlogPost({ id: 'd', slug: 'd', tags: [] }),
];

describe('filterPostsByTag', () => {
  it.each<{ label: string; tag: string; expected: readonly string[] }>([
    { label: 'a tag carried by two posts', tag: 'Angular', expected: ['a', 'c'] },
    { label: 'a tag carried by one post', tag: 'DevOps', expected: ['b'] },
    { label: 'a tag nobody carries', tag: 'Docker', expected: [] },
    { label: 'the tag in another case', tag: 'angular', expected: [] },
    { label: 'a prefix of a tag', tag: 'Nest', expected: [] },
    { label: 'a tag padded with spaces', tag: ' DevOps ', expected: [] },
    { label: 'a longer tag containing a shorter one', tag: 'AngularJS', expected: ['c'] },
  ])(
    'Given posts When filtered by $label Then only the posts carrying exactly that tag remain, in order',
    ({ tag, expected }) => {
      expect(filterPostsByTag(POSTS, tag).map((post) => post.slug)).toEqual(expected);
    },
  );

  it('Given no post When filtered by a tag Then the result is empty', () => {
    expect(filterPostsByTag([], 'Angular')).toEqual([]);
  });
});
