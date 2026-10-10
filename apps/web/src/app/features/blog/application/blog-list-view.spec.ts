import type { CartoucheRow } from '@shared/ui/cartouche';
import type { Fact } from '@shared/ui/fact-list';
import type { BlogPost } from '../domain/models/blog-post.model';
import type { BlogCategoryFilter } from '../domain/models/blog-tag.model';
import { makeBlogPost, productionPosts } from '../testing/blog-post-builders';
import {
  toBlogListView,
  toBlogPostRowView,
  type BlogListFilter,
  type BlogPostRowView,
} from './blog-list-view';

const ALL: BlogListFilter = { by: 'category', category: 'all' };

const postsTagged = (tagsPerPost: readonly (readonly string[])[]): readonly BlogPost[] =>
  tagsPerPost.map((tags, index) => makeBlogPost({ id: `p-${index}`, slug: `p-${index}`, tags }));

describe('toBlogListView', () => {
  describe('total', () => {
    it.each([
      { tags: [], expected: 0 },
      { tags: [['Angular']], expected: 1 },
      { tags: [['Angular'], ['Inconnu'], []], expected: 3 },
    ] satisfies readonly { tags: readonly (readonly string[])[]; expected: number }[])(
      'Given $expected post(s), free tags and untagged included, When the view is built Then the total is $expected',
      ({ tags, expected }) => {
        expect(toBlogListView(postsTagged(tags), ALL).total).toBe(expected);
      },
    );
  });

  describe('themes', () => {
    it('Given the two production posts When the view is built Then the cartouche rows are the covered themes in order, with their article count, the empty one left out', () => {
      expect(toBlogListView(productionPosts(), ALL).themes).toEqual([
        { label: 'Stack', value: '2\u00a0articles' },
        { label: 'Sécurité', value: '1\u00a0article' },
        { label: 'Parcours', value: '1\u00a0article' },
        { label: 'Projets', value: '1\u00a0article' },
      ] satisfies readonly CartoucheRow[]);
    });

    it.each([
      { label: 'no post', tags: [], expected: [] },
      {
        label: 'three journey posts and a free tag',
        tags: [['Parcours'], ['Carrière', 'Industrie'], ['Autodidacte'], ['Inconnu']],
        expected: [{ label: 'Parcours', value: '3\u00a0articles' }],
      },
      {
        label: 'posts tagged in reverse category order',
        tags: [
          ['GreenTech', 'Tests'],
          ['SEO', 'XSS', 'Docker'],
        ],
        expected: [
          { label: 'Stack', value: '1\u00a0article' },
          { label: 'Sécurité', value: '1\u00a0article' },
          { label: 'Ingénierie', value: '2\u00a0articles' },
          { label: 'Projets', value: '1\u00a0article' },
        ],
      },
    ] satisfies readonly {
      label: string;
      tags: readonly (readonly string[])[];
      expected: readonly CartoucheRow[];
    }[])(
      'Given $label When the view is built Then only the covered themes are listed, in catalogue order, with their count',
      ({ tags, expected }) => {
        expect(toBlogListView(postsTagged(tags), ALL).themes).toEqual(expected);
      },
    );

    it('Given a tag filter When the view is built Then the total and the themes still count every post', () => {
      const view = toBlogListView(productionPosts(), { by: 'tag', tag: 'Reconversion' });

      expect(view.total).toBe(2);
      expect(view.themes).toEqual(toBlogListView(productionPosts(), ALL).themes);
    });
  });

  describe('rows', () => {
    const slugsOf = (view: { readonly rows: readonly BlogPostRowView[] }): readonly string[] =>
      view.rows.map((row) => row.slug);

    it('Given a dated post with a cover When the view is built Then its row carries everything the article line shows', () => {
      const post = makeBlogPost({
        slug: 'chiffrement-cote-client',
        title: 'Chiffrement côté client',
        excerpt: 'Le cas DashFlow.',
        contentMarkdown: Array.from({ length: 1136 }, () => 'mot').join(' '),
        coverImage: '/covers/chiffrement.avif',
        tags: ['Chiffrement', 'AES-256-GCM', 'PBKDF2', 'Angular'],
        publishedAt: '2026-08-31T12:00:00Z',
      });

      expect(toBlogListView([post], ALL).rows).toEqual([
        {
          slug: 'chiffrement-cote-client',
          title: 'Chiffrement côté client',
          excerpt: 'Le cas DashFlow.',
          publishedAt: '2026-08-31T12:00:00Z',
          readingTime: '6\u00a0min de lecture',
          facts: [{ label: 'Sujets', value: 'Chiffrement · AES-256-GCM · PBKDF2' }],
          coverImage: '/covers/chiffrement.avif',
          linkContext: '\u00a0: Chiffrement côté client',
          priority: true,
        },
      ] satisfies readonly BlogPostRowView[]);
    });

    it('Given an undated post without cover When the view is built Then its row keeps a null date and an empty cover', () => {
      const [row] = toBlogListView([makeBlogPost({ publishedAt: null, coverImage: '' })], ALL).rows;

      expect([row?.publishedAt, row?.coverImage]).toEqual([null, '']);
    });

    it.each([
      { words: 0, label: '1\u00a0min de lecture' },
      { words: 220, label: '1\u00a0min de lecture' },
      { words: 221, label: '2\u00a0min de lecture' },
      { words: 1136, label: '6\u00a0min de lecture' },
    ])(
      'Given a post of $words words When the view is built Then its reading time reads « $label »',
      ({ words, label }) => {
        const contentMarkdown = Array.from({ length: words }, () => 'mot').join(' ');
        const [row] = toBlogListView([makeBlogPost({ contentMarkdown })], ALL).rows;

        expect(row?.readingTime).toBe(label);
      },
    );

    it.each<{ label: string; tags: readonly string[]; expected: readonly Fact[] }>([
      { label: 'no tag', tags: [], expected: [] },
      { label: 'one tag', tags: ['Angular'], expected: [{ label: 'Sujets', value: 'Angular' }] },
      {
        label: 'three tags',
        tags: ['Angular', 'NestJS', 'Docker'],
        expected: [{ label: 'Sujets', value: 'Angular · NestJS · Docker' }],
      },
      {
        label: 'five tags, free ones included',
        tags: ['Inconnu', 'Angular', 'NestJS', 'Docker', 'RGPD'],
        expected: [{ label: 'Sujets', value: 'Inconnu · Angular · NestJS' }],
      },
    ])(
      'Given a post with $label When the view is built Then its « Sujets » fact lists its first three tags',
      ({ tags, expected }) => {
        const [row] = toBlogListView([makeBlogPost({ tags })], ALL).rows;

        expect(row?.facts).toEqual(expected);
      },
    );

    it('Given the two production posts When the view is built Then each row names its post and lists its first three subjects', () => {
      const { rows } = toBlogListView(productionPosts(), ALL);

      expect(rows.map((row) => [row.slug, row.facts, row.linkContext])).toEqual([
        [
          'chiffrement-cote-client',
          [{ label: 'Sujets', value: 'Chiffrement · AES-256-GCM · PBKDF2' }],
          '\u00a0: Chiffrement côté client avec AES-256-GCM et PBKDF2 : le cas DashFlow',
        ],
        [
          'de-la-metallurgie-au-developpement',
          [{ label: 'Sujets', value: 'Angular · NestJS · Reconversion' }],
          '\u00a0: De 20 ans de métallurgie à développeur Full-Stack',
        ],
      ]);
    });

    it('Given several posts and no filter When the view is built Then there is one row per post, in API order, and only the first is a priority', () => {
      const view = toBlogListView(postsTagged([['Angular'], ['Inconnu'], [], ['DevOps']]), ALL);

      expect(slugsOf(view)).toEqual(['p-0', 'p-1', 'p-2', 'p-3']);
      expect(view.rows.map((row) => row.priority)).toEqual([true, false, false, false]);
    });

    it.each<{
      label: string;
      tag: string;
      slugs: readonly string[];
      priorities: readonly boolean[];
    }>([
      {
        label: 'a tag the first post carries',
        tag: 'Angular',
        slugs: ['p-0', 'p-2'],
        priorities: [true, false],
      },
      {
        label: 'a tag the first post lacks',
        tag: 'DevOps',
        slugs: ['p-1', 'p-3'],
        priorities: [false, false],
      },
      { label: 'a tag nobody carries', tag: 'Kubernetes', slugs: [], priorities: [] },
      { label: 'the tag in another case', tag: 'devops', slugs: [], priorities: [] },
    ])(
      'Given a filter by $label When the view is built Then only the posts with that exact tag remain, and priority stays with the first post of the whole list',
      ({ tag, slugs, priorities }) => {
        const view = toBlogListView(
          postsTagged([['Angular'], ['DevOps'], ['Angular', 'Docker'], ['DevOps']]),
          { by: 'tag', tag },
        );

        expect(slugsOf(view)).toEqual(slugs);
        expect(view.rows.map((row) => row.priority)).toEqual(priorities);
      },
    );

    it('Given the production posts filtered by « Reconversion » When the view is built Then the only row is the career change post, without priority', () => {
      const { rows } = toBlogListView(productionPosts(), { by: 'tag', tag: 'Reconversion' });

      expect(rows.map((row) => [row.slug, row.priority])).toEqual([
        ['de-la-metallurgie-au-developpement', false],
      ]);
    });
  });
  describe('filters', () => {
    const optionsOf = (
      view: ReturnType<typeof toBlogListView>,
    ): readonly (readonly [BlogCategoryFilter, string, number | undefined, boolean])[] =>
      view.filters.map((option) => [
        option.value,
        option.label,
        option.count,
        option.disabled === true,
      ]);

    it('Given the two production posts When the view is built Then « Tous » and the covered themes are offered in order with their count, none inactive', () => {
      expect(optionsOf(toBlogListView(productionPosts(), ALL))).toEqual([
        ['all', 'Tous', 2, false],
        ['stack', 'Stack', 2, false],
        ['security', 'Sécurité', 1, false],
        ['journey', 'Parcours', 1, false],
        ['projects', 'Projets', 1, false],
      ]);
    });

    it('Given no post When the view is built Then « Tous » at zero is the only option', () => {
      expect(optionsOf(toBlogListView([], ALL))).toEqual([['all', 'Tous', 0, false]]);
    });

    it.each<{ label: string; filter: BlogListFilter }>([
      { label: 'the « Parcours » theme', filter: { by: 'category', category: 'journey' } },
      { label: 'the « Reconversion » tag', filter: { by: 'tag', tag: 'Reconversion' } },
      { label: 'an unknown tag', filter: { by: 'tag', tag: 'Kubernetes' } },
    ])(
      'Given $label When the view is built Then the options still count every post',
      ({ filter }) => {
        expect(toBlogListView(productionPosts(), filter).filters).toEqual(
          toBlogListView(productionPosts(), ALL).filters,
        );
      },
    );
  });

  describe('visible posts by theme', () => {
    const MIXED = postsTagged([
      ['Angular', 'Reconversion'],
      ['RGPD'],
      ['Inconnu'],
      ['DashFlow', 'Docker'],
    ]);

    it.each<{ category: BlogCategoryFilter; slugs: readonly string[] }>([
      { category: 'all', slugs: ['p-0', 'p-1', 'p-2', 'p-3'] },
      { category: 'stack', slugs: ['p-0', 'p-3'] },
      { category: 'security', slugs: ['p-1'] },
      { category: 'journey', slugs: ['p-0'] },
      { category: 'projects', slugs: ['p-3'] },
    ])(
      'Given the theme $category When the view is built Then only its posts are rows and the visible count follows',
      ({ category, slugs }) => {
        const view = toBlogListView(MIXED, { by: 'category', category });

        expect(view.rows.map((row) => row.slug)).toEqual(slugs);
        expect(view.visibleCount).toBe(slugs.length);
      },
    );

    it('Given a theme without post is requested When the view is built Then it falls back to every post', () => {
      const view = toBlogListView(MIXED, { by: 'category', category: 'engineering' });

      expect(view.rows.map((row) => row.slug)).toEqual(['p-0', 'p-1', 'p-2', 'p-3']);
      expect(view.visibleCount).toBe(4);
    });

    it.each<{ label: string; filter: BlogListFilter; expected: number }>([
      { label: 'no filter', filter: ALL, expected: 2 },
      {
        label: 'the « Parcours » theme',
        filter: { by: 'category', category: 'journey' },
        expected: 1,
      },
      {
        label: 'the « Reconversion » tag',
        filter: { by: 'tag', tag: 'Reconversion' },
        expected: 1,
      },
      { label: 'an unknown tag', filter: { by: 'tag', tag: 'Kubernetes' }, expected: 0 },
    ])(
      'Given the production posts and $label When the view is built Then the visible count is $expected',
      ({ filter, expected }) => {
        expect(toBlogListView(productionPosts(), filter).visibleCount).toBe(expected);
      },
    );

    it('Given the production posts under « Parcours » When the view is built Then the only row is the career change post, without priority, and the totals are unchanged', () => {
      const view = toBlogListView(productionPosts(), { by: 'category', category: 'journey' });

      expect(view.rows.map((row) => [row.slug, row.priority])).toEqual([
        ['de-la-metallurgie-au-developpement', false],
      ]);
      expect(view.total).toBe(2);
      expect(view.themes).toEqual(toBlogListView(productionPosts(), ALL).themes);
    });

    it('Given the production posts under « Sécurité » When the view is built Then the first post keeps its priority', () => {
      const { rows } = toBlogListView(productionPosts(), { by: 'category', category: 'security' });

      expect(rows.map((row) => [row.slug, row.priority])).toEqual([
        ['chiffrement-cote-client', true],
      ]);
    });
  });
});

describe('toBlogPostRowView', () => {
  const POST = makeBlogPost({
    slug: 'chiffrement-cote-client',
    title: 'Chiffrement côté client',
    excerpt: 'Le cas DashFlow.',
    contentMarkdown: Array.from({ length: 1136 }, () => 'mot').join(' '),
    coverImage: '/covers/chiffrement.avif',
    tags: ['Chiffrement', 'AES-256-GCM', 'PBKDF2', 'Angular'],
    publishedAt: '2026-08-31T12:00:00Z',
  });

  it.each([true, false])(
    'Given a post and priority %s When its row is built on its own Then it carries everything the article line shows',
    (priority) => {
      expect(toBlogPostRowView(POST, priority)).toEqual({
        slug: 'chiffrement-cote-client',
        title: 'Chiffrement côté client',
        excerpt: 'Le cas DashFlow.',
        publishedAt: '2026-08-31T12:00:00Z',
        readingTime: '6\u00a0min de lecture',
        facts: [{ label: 'Sujets', value: 'Chiffrement · AES-256-GCM · PBKDF2' }],
        coverImage: '/covers/chiffrement.avif',
        linkContext: '\u00a0: Chiffrement côté client',
        priority,
      } satisfies BlogPostRowView);
    },
  );

  it('Given the blog list When its rows are built Then each one is the row built on its own, only the first with priority', () => {
    const posts = productionPosts();

    expect(toBlogListView(posts, ALL).rows).toEqual(
      posts.map((post, index) => toBlogPostRowView(post, index === 0)),
    );
  });
});
