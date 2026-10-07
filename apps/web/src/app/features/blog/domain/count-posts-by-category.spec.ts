import { makeBlogPost, productionPosts } from '../testing/blog-post-builders';
import type { BlogPost } from './models/blog-post.model';
import { countPostsByCategory } from './count-posts-by-category';
import type { BlogCategoryCounts } from './models/blog-tag.model';

const postsTagged = (tagsPerPost: readonly (readonly string[])[]): readonly BlogPost[] =>
  tagsPerPost.map((tags, index) => makeBlogPost({ id: `p-${index}`, slug: `p-${index}`, tags }));

const ZERO: BlogCategoryCounts = { stack: 0, security: 0, engineering: 0, journey: 0, projects: 0 };

describe('countPostsByCategory', () => {
  it.each<{ label: string; tags: readonly (readonly string[])[]; expected: BlogCategoryCounts }>([
    { label: 'no post', tags: [], expected: ZERO },
    { label: 'a post without tag', tags: [[]], expected: ZERO },
    { label: 'free tags only', tags: [['Inconnu', 'angular']], expected: ZERO },
    {
      label: 'a free tag next to a catalogue tag',
      tags: [['Inconnu', 'Tests']],
      expected: { ...ZERO, engineering: 1 },
    },
    {
      label: 'a post spanning three categories',
      tags: [['Angular', 'RGPD', 'DashFlow']],
      expected: { ...ZERO, stack: 1, security: 1, projects: 1 },
    },
    {
      label: 'three tags of the same category',
      tags: [['Angular', 'TypeScript', 'NestJS']],
      expected: { ...ZERO, stack: 1 },
    },
    {
      label: 'two posts sharing a category',
      tags: [
        ['Angular', 'Reconversion'],
        ['Docker', 'CI/CD'],
      ],
      expected: { ...ZERO, stack: 2, journey: 1, projects: 1 },
    },
  ])(
    'Given $label When the posts are counted by category Then every category has its count',
    ({ tags, expected }) => {
      expect(countPostsByCategory(postsTagged(tags))).toEqual(expected);
    },
  );

  it('Given the two production posts When they are counted Then Stack 2, Security 1, Engineering 0, Journey 1, Projects 1', () => {
    expect(countPostsByCategory(productionPosts())).toEqual({
      stack: 2,
      security: 1,
      engineering: 0,
      journey: 1,
      projects: 1,
    });
  });
});
