import { makeBlogPost } from '../testing/blog-post-builders';
import { isPostInCategory } from './is-post-in-category';
import type { BlogTagCategory } from './models/blog-tag.model';

describe('isPostInCategory', () => {
  it.each<{ label: string; tags: readonly string[]; category: BlogTagCategory; expected: boolean }>(
    [
      { label: 'one tag of the category', tags: ['Angular'], category: 'stack', expected: true },
      {
        label: 'tags of another category only',
        tags: ['RGPD', 'OWASP'],
        category: 'stack',
        expected: false,
      },
      { label: 'free tags only', tags: ['Inconnu', 'angular'], category: 'stack', expected: false },
      { label: 'no tag', tags: [], category: 'projects', expected: false },
      {
        label: 'a free tag next to a catalogue tag',
        tags: ['Inconnu', 'DashFlow'],
        category: 'projects',
        expected: true,
      },
      {
        label: 'the category tag last',
        tags: ['Angular', 'RGPD', 'Tests'],
        category: 'engineering',
        expected: true,
      },
      { label: 'Full-Stack', tags: ['Full-Stack'], category: 'stack', expected: true },
      { label: 'Full-Stack', tags: ['Full-Stack'], category: 'journey', expected: false },
    ],
  )(
    'Given a post with $label When asked about "$category" Then it answers $expected',
    ({ tags, category, expected }) => {
      expect(isPostInCategory(makeBlogPost({ tags }), category)).toBe(expected);
    },
  );

  it.each<[BlogTagCategory, boolean]>([
    ['stack', true],
    ['security', false],
    ['engineering', false],
    ['journey', true],
    ['projects', false],
  ])(
    'Given a post tagged Angular and Reconversion When asked about "%s" Then it answers %s',
    (category, expected) => {
      const post = makeBlogPost({ tags: ['Angular', 'Reconversion'] });

      expect(isPostInCategory(post, category)).toBe(expected);
    },
  );
});
