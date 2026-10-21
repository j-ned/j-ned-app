import { makeBlogPost } from '../testing/blog-post-builders';
import type { BlogPost } from './models/blog-post.model';
import { postsAboutProject } from './posts-about-project';

const post = (
  slug: string,
  tags: readonly string[],
  publishedAt: string | null = '2026-09-01T00:00:00Z',
): BlogPost =>
  makeBlogPost({
    id: slug,
    slug,
    title: slug,
    tags,
    publishedAt,
    status: publishedAt === null ? 'draft' : 'published',
  });

const slugsOf = (posts: readonly BlogPost[]): readonly string[] => posts.map((p) => p.slug);

describe('postsAboutProject', () => {
  it('Given posts on several projects When the posts about DashFlow are read Then only the published ones tagged DashFlow remain, newest first', () => {
    const posts = [
      post('ancien', ['Angular', 'DashFlow'], '2026-07-01T00:00:00Z'),
      post('autre-projet', ['CandiDash'], '2026-09-10T00:00:00Z'),
      post('brouillon', ['DashFlow'], null),
      post('recent', ['DashFlow'], '2026-09-20T00:00:00Z'),
      post('sans-projet', ['Angular'], '2026-09-15T00:00:00Z'),
      post('milieu', ['Chiffrement', 'DashFlow'], '2026-08-05T00:00:00Z'),
    ];

    expect(slugsOf(postsAboutProject(posts, 'dashflow'))).toEqual(['recent', 'milieu', 'ancien']);
  });

  it.each([
    { slug: 'candidash', expected: ['candidash'] },
    { slug: 'portfolio', expected: ['portfolio'] },
  ])(
    'Given a post per project tag When the posts about $slug are read Then only the post carrying its tag remains',
    ({ slug, expected }) => {
      const posts = [
        post('dashflow', ['DashFlow']),
        post('candidash', ['CandiDash']),
        post('portfolio', ['Portfolio']),
      ];

      expect(slugsOf(postsAboutProject(posts, slug))).toEqual(expected);
    },
  );

  it('Given a post whose free tag only differs from CandiDash by its case When the posts about candidash are read Then it is not one of them', () => {
    expect(postsAboutProject([post('casse', ['Candidash'])], 'candidash')).toEqual([]);
  });

  it.each(['le-vieux-comptoir', 'DashFlow', ''])(
    'Given posts tagged with every project When the posts about the slug « %s », absent from the project tags, are read Then there is none',
    (slug) => {
      const posts = [post('tous', ['DashFlow', 'CandiDash', 'Portfolio'])];

      expect(postsAboutProject(posts, slug)).toEqual([]);
    },
  );

  it('Given no post at all When the posts about DashFlow are read Then there is none', () => {
    expect(postsAboutProject([], 'dashflow')).toEqual([]);
  });

  it('Given a frozen list in publication order When the posts about DashFlow are read Then the result is sorted and the list is left untouched', () => {
    const posts = Object.freeze([
      post('premier', ['DashFlow'], '2026-06-01T00:00:00Z'),
      post('second', ['DashFlow'], '2026-08-01T00:00:00Z'),
    ]);

    expect({
      result: slugsOf(postsAboutProject(posts, 'dashflow')),
      input: slugsOf(posts),
    }).toEqual({ result: ['second', 'premier'], input: ['premier', 'second'] });
  });
});
