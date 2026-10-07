import type { BlogPost, BlogPostInput } from '@features/blog/domain/models/blog-post.model';
import { makeBlogPost } from '@features/blog/testing/blog-post-builders';
import {
  findPostById,
  toPostDraft,
  toPostInput,
  toPreviewPost,
  type PostDraft,
} from './post-draft';

const SAVED = makeBlogPost({
  id: 'b-1',
  slug: 'chiffrement-cote-client',
  title: 'Chiffrement côté client',
  excerpt: 'Le cas DashFlow.',
  contentMarkdown: '## AES-256-GCM\n\nUn IV unique par message.',
  coverImage: 'https://cdn.test/blog/b-1.avif',
  tags: ['Chiffrement', 'Angular'],
  status: 'published',
  likesCount: 4,
  publishedAt: '2026-09-09T10:00:00Z',
  updatedAt: '2026-09-10T08:00:00Z',
});

const DRAFT: PostDraft = {
  title: 'Signal Forms en production',
  excerpt: 'Retour sur une migration.',
  contentMarkdown: '## Avant\n\nDes formulaires réactifs.',
  status: 'draft',
};

describe('toPostDraft', () => {
  it('Given no article When the draft is built Then it is empty and unpublished', () => {
    expect(toPostDraft(null)).toEqual({
      title: '',
      excerpt: '',
      contentMarkdown: '',
      status: 'draft',
    } satisfies PostDraft);
  });

  it('Given a saved article When the draft is built Then it holds exactly its four editable fields', () => {
    expect(toPostDraft(SAVED)).toEqual({
      title: 'Chiffrement côté client',
      excerpt: 'Le cas DashFlow.',
      contentMarkdown: '## AES-256-GCM\n\nUn IV unique par message.',
      status: 'published',
    } satisfies PostDraft);
  });
});

describe('toPostInput', () => {
  it('Given a draft and its subjects When the payload is built Then it carries the draft fields and the subjects in set order', () => {
    expect(toPostInput(DRAFT, new Set(['RxJS', 'Angular']))).toEqual({
      title: 'Signal Forms en production',
      excerpt: 'Retour sur une migration.',
      contentMarkdown: '## Avant\n\nDes formulaires réactifs.',
      tags: ['RxJS', 'Angular'],
      status: 'draft',
    } satisfies BlogPostInput);
  });

  it.each([
    { tags: [], expected: [] },
    { tags: ['Angular'], expected: ['Angular'] },
    { tags: ['Tests', 'Angular', 'Zod'], expected: ['Tests', 'Angular', 'Zod'] },
  ])(
    'Given the subjects $tags When the payload is built Then its tags are $expected',
    ({ tags, expected }) => {
      expect(toPostInput(DRAFT, new Set(tags)).tags).toEqual(expected);
    },
  );

  it('Given a draft carrying a field outside the payload When the payload is built Then only the five written fields leave', () => {
    const marked = { ...DRAFT, [Symbol('form')]: true, likesCount: 9 } as PostDraft;

    expect(Reflect.ownKeys(toPostInput(marked, new Set())).sort()).toEqual([
      'contentMarkdown',
      'excerpt',
      'status',
      'tags',
      'title',
    ]);
  });

  it('Given a saved article When it is turned into a draft then a payload Then the payload equals its saved fields', () => {
    expect(toPostInput(toPostDraft(SAVED), new Set(SAVED.tags))).toEqual({
      title: SAVED.title,
      excerpt: SAVED.excerpt,
      contentMarkdown: SAVED.contentMarkdown,
      tags: ['Chiffrement', 'Angular'],
      status: 'published',
    } satisfies BlogPostInput);
  });
});

describe('toPreviewPost', () => {
  it('Given an edited draft of a saved article When the preview is built Then it is the article the draft would publish, keeping the server fields', () => {
    const edited: PostDraft = { ...toPostDraft(SAVED), title: 'Chiffrer côté client' };

    expect(toPreviewPost(edited, new Set(['Chiffrement']), SAVED)).toEqual({
      id: 'b-1',
      slug: 'chiffrement-cote-client',
      title: 'Chiffrer côté client',
      excerpt: 'Le cas DashFlow.',
      contentMarkdown: '## AES-256-GCM\n\nUn IV unique par message.',
      coverImage: 'https://cdn.test/blog/b-1.avif',
      tags: ['Chiffrement'],
      status: 'published',
      likesCount: 4,
      publishedAt: '2026-09-09T10:00:00Z',
      updatedAt: '2026-09-10T08:00:00Z',
    } satisfies BlogPost);
  });

  it('Given a new article When the preview is built Then the server fields are empty and it is not dated', () => {
    expect(toPreviewPost(DRAFT, new Set(['Angular']), null)).toEqual({
      id: '',
      slug: '',
      title: 'Signal Forms en production',
      excerpt: 'Retour sur une migration.',
      contentMarkdown: '## Avant\n\nDes formulaires réactifs.',
      coverImage: '',
      tags: ['Angular'],
      status: 'draft',
      likesCount: 0,
      publishedAt: null,
      updatedAt: '',
    } satisfies BlogPost);
  });

  it.each([
    { field: 'title', value: 'Titre en cours' },
    { field: 'excerpt', value: 'Extrait en cours' },
    { field: 'contentMarkdown', value: 'Contenu en cours' },
  ] as const)(
    'Given the $field typed When the preview is built Then it reads the typed $field',
    ({ field, value }) => {
      expect(
        toPreviewPost({ ...toPostDraft(SAVED), [field]: value }, new Set(), SAVED)[field],
      ).toBe(value);
    },
  );
});

describe('findPostById', () => {
  const POSTS = [
    makeBlogPost({ id: 'b-1', title: 'Premier' }),
    makeBlogPost({ id: 'b-2', title: 'Second' }),
  ];

  it.each([
    { posts: POSTS, id: 'b-2', title: 'Second' },
    { posts: POSTS, id: 'b-1', title: 'Premier' },
    { posts: POSTS, id: 'b-9', title: null },
    { posts: [], id: 'b-1', title: null },
  ])(
    'Given $posts.length articles When $id is looked for Then the article found is $title',
    ({ posts, id, title }) => {
      expect(findPostById(posts, id)?.title ?? null).toBe(title);
    },
  );

  it('Given the list When an article is found Then it is the listed object itself', () => {
    expect(findPostById(POSTS, 'b-2')).toBe(POSTS[1]);
  });
});
