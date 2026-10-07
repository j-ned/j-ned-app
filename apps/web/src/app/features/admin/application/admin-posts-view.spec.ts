import type { BlogPost } from '@features/blog/domain/models/blog-post.model';
import { makeBlogPost } from '@features/blog/testing/blog-post-builders';
import {
  toAdminPostsView,
  type AdminPostRowView,
  type AdminPostsFilter,
  type PostsSortDirection,
} from './admin-posts-view';

const words = (count: number): string => Array.from({ length: count }, () => 'mot').join(' ');

const CHIFFREMENT = makeBlogPost({
  id: 'b-1',
  slug: 'chiffrement-cote-client',
  title: 'Chiffrement côté client',
  contentMarkdown: words(2860),
  coverImage: 'https://cdn.test/blog/b-1.avif',
  tags: ['Chiffrement', 'AES-256-GCM', 'PBKDF2', 'Angular'],
  status: 'published',
  likesCount: 0,
  publishedAt: '2026-09-09T10:00:00Z',
});

const METALLURGIE = makeBlogPost({
  id: 'b-2',
  title: 'De 20 ans de métallurgie',
  status: 'published',
  publishedAt: '2026-09-01T10:00:00Z',
});

const BROUILLON_A = makeBlogPost({ id: 'b-3', status: 'draft', publishedAt: null });
const BROUILLON_B = makeBlogPost({ id: 'b-4', status: 'draft', publishedAt: null });

const AUTOMNE = makeBlogPost({
  id: 'b-5',
  status: 'published',
  publishedAt: '2026-10-02T10:00:00Z',
});

const POSTS: readonly BlogPost[] = [BROUILLON_A, METALLURGIE, AUTOMNE, BROUILLON_B, CHIFFREMENT];

const ids = (filter: AdminPostsFilter, sortDir: PostsSortDirection): readonly string[] =>
  toAdminPostsView(POSTS, filter, sortDir).rows.map((row) => row.id);

describe('toAdminPostsView: filtres', () => {
  it('Given three published articles and two drafts When the filters are built Then « Tous » counts everything and each status its own', () => {
    expect(toAdminPostsView(POSTS, 'all', 'descending').filters).toEqual([
      { value: 'all', label: 'Tous', count: 5, disabled: false },
      { value: 'published', label: 'Publiés', count: 3, disabled: false },
      { value: 'draft', label: 'Brouillons', count: 2, disabled: false },
    ]);
  });

  it.each([
    { posts: [CHIFFREMENT], disabled: [false, false, true] },
    { posts: [BROUILLON_A], disabled: [false, true, false] },
    { posts: [], disabled: [true, true, true] },
  ])(
    'Given $posts.length article(s) When the filters are built Then an empty status is disabled: $disabled',
    ({ posts, disabled }) => {
      expect(
        toAdminPostsView(posts, 'all', 'descending').filters.map((option) => option.disabled),
      ).toEqual(disabled);
    },
  );

  it.each(['all', 'published', 'draft'] as const)(
    'Given the filter %s When the view is built Then the counts stay those of the whole list',
    (filter) => {
      expect(
        toAdminPostsView(POSTS, filter, 'descending').filters.map((option) => option.count),
      ).toEqual([5, 3, 2]);
    },
  );
});

describe('toAdminPostsView: lignes filtrées et triées', () => {
  it.each([
    { filter: 'all', sortDir: 'descending', expected: ['b-5', 'b-1', 'b-2', 'b-3', 'b-4'] },
    { filter: 'all', sortDir: 'ascending', expected: ['b-2', 'b-1', 'b-5', 'b-3', 'b-4'] },
    { filter: 'published', sortDir: 'descending', expected: ['b-5', 'b-1', 'b-2'] },
    { filter: 'published', sortDir: 'ascending', expected: ['b-2', 'b-1', 'b-5'] },
    { filter: 'draft', sortDir: 'descending', expected: ['b-3', 'b-4'] },
    { filter: 'draft', sortDir: 'ascending', expected: ['b-3', 'b-4'] },
  ] satisfies readonly {
    filter: AdminPostsFilter;
    sortDir: PostsSortDirection;
    expected: readonly string[];
  }[])(
    'Given the filter $filter sorted $sortDir When the rows are built Then they are $expected, drafts last in list order',
    ({ filter, sortDir, expected }) => {
      expect(ids(filter, sortDir)).toEqual(expected);
    },
  );

  it('Given two articles published the same day When the rows are built Then they keep their list order in both directions', () => {
    const first = makeBlogPost({ id: 'x-1', publishedAt: '2026-09-09T10:00:00Z' });
    const second = makeBlogPost({ id: 'x-2', publishedAt: '2026-09-09T10:00:00Z' });

    expect(
      (['descending', 'ascending'] as const).map((sortDir) =>
        toAdminPostsView([first, second], 'all', sortDir).rows.map((row) => row.id),
      ),
    ).toEqual([
      ['x-1', 'x-2'],
      ['x-1', 'x-2'],
    ]);
  });

  it('Given a list When the rows are built Then the list itself is left in its order', () => {
    const posts = [...POSTS];

    toAdminPostsView(posts, 'all', 'descending');

    expect(posts.map((post) => post.id)).toEqual(['b-3', 'b-2', 'b-5', 'b-4', 'b-1']);
  });
});

describe('toAdminPostsView: contenu d’une ligne', () => {
  it('Given a published article When its row is built Then it reads id, slug, title, subjects, cover, status, date, reading time and likes', () => {
    expect(toAdminPostsView([CHIFFREMENT], 'all', 'descending').rows).toEqual([
      {
        id: 'b-1',
        slug: 'chiffrement-cote-client',
        title: 'Chiffrement côté client',
        subjects: 'Chiffrement · AES-256-GCM · PBKDF2',
        cover: 'https://cdn.test/blog/b-1.avif',
        status: 'published',
        publishedAt: '2026-09-09T10:00:00Z',
        readingTime: '13\u00a0min',
        likes: 0,
      },
    ] satisfies readonly AdminPostRowView[]);
  });

  it.each([
    { tags: [], subjects: '' },
    { tags: ['Angular'], subjects: 'Angular' },
    { tags: ['Angular', 'Tests', 'Zod'], subjects: 'Angular · Tests · Zod' },
    { tags: ['Angular', 'Tests', 'Zod', 'RxJS', 'SEO'], subjects: 'Angular · Tests · Zod' },
  ])(
    'Given the tags $tags When the row is built Then the subjects read « $subjects »',
    ({ tags, subjects }) => {
      const [row] = toAdminPostsView([makeBlogPost({ tags })], 'all', 'descending').rows;

      expect(row?.subjects).toBe(subjects);
    },
  );

  it.each([
    { count: 0, readingTime: '1\u00a0min' },
    { count: 220, readingTime: '1\u00a0min' },
    { count: 221, readingTime: '2\u00a0min' },
    { count: 2860, readingTime: '13\u00a0min' },
  ])(
    'Given a content of $count words When the row is built Then the reading time is « $readingTime »',
    ({ count, readingTime }) => {
      const [row] = toAdminPostsView(
        [makeBlogPost({ contentMarkdown: words(count) })],
        'all',
        'descending',
      ).rows;

      expect(row?.readingTime).toBe(readingTime);
    },
  );

  it('Given a draft without cover and with likes When its row is built Then it keeps a null date, an empty cover and its likes', () => {
    const [row] = toAdminPostsView(
      [makeBlogPost({ status: 'draft', publishedAt: null, coverImage: '', likesCount: 3 })],
      'all',
      'descending',
    ).rows;

    expect([row?.status, row?.publishedAt, row?.cover, row?.likes]).toEqual(['draft', null, '', 3]);
  });
});
