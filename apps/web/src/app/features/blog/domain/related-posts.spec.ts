import { makeBlogPost } from '../testing/blog-post-builders';
import type { BlogPost } from './models/blog-post.model';
import { RELATED_POSTS_LIMIT, relatedPosts } from './related-posts';

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

describe('relatedPosts', () => {
  it('caps the proposals at three', () => {
    expect(RELATED_POSTS_LIMIT).toBe(3);
  });

  it.each<{ label: string; current: readonly string[]; candidate: readonly string[] }>([
    {
      label: 'a shared catalogue tag',
      current: ['Angular'],
      candidate: ['Angular'],
    },
    {
      label: 'a shared free tag, outside any theme',
      current: ['Bricolage'],
      candidate: ['Bricolage'],
    },
    {
      label: 'a shared theme without any shared tag',
      current: ['Angular'],
      candidate: ['TypeScript'],
    },
  ])('Given $label When related posts are computed Then the candidate is proposed', (row) => {
    const posts = [post('courant', row.current), post('candidat', row.candidate)];

    expect(slugsOf(relatedPosts(posts, 'courant'))).toEqual(['candidat']);
  });

  it.each<{ label: string; current: readonly string[]; candidate: readonly string[] }>([
    { label: 'no tag in common and no theme in common', current: ['Angular'], candidate: ['XSS'] },
    { label: 'free tags that differ', current: ['Bricolage'], candidate: ['Jardinage'] },
    { label: 'a tag differing only by case', current: ['Bricolage'], candidate: ['bricolage'] },
    { label: 'a candidate without tags', current: ['Angular'], candidate: [] },
    { label: 'a current post without tags', current: [], candidate: ['Angular'] },
  ])('Given $label When related posts are computed Then nothing is proposed', (row) => {
    const posts = [post('courant', row.current), post('candidat', row.candidate)];

    expect(relatedPosts(posts, 'courant')).toEqual([]);
  });

  it('Given the current post among the published ones When related posts are computed Then it is never proposed to itself', () => {
    const posts = [post('courant', ['Angular']), post('voisin', ['Angular'])];

    expect(slugsOf(relatedPosts(posts, 'courant'))).toEqual(['voisin']);
  });

  it('Given a draft sharing every tag When related posts are computed Then the draft is not proposed', () => {
    const posts = [
      post('courant', ['Angular', 'CSP']),
      post('brouillon', ['Angular', 'CSP'], null),
      post('publie', ['TypeScript']),
    ];

    expect(slugsOf(relatedPosts(posts, 'courant'))).toEqual(['publie']);
  });

  it('Given a slug absent from the list When related posts are computed Then nothing is proposed', () => {
    const posts = [post('a', ['Angular']), post('b', ['Angular'])];

    expect(relatedPosts(posts, 'inconnu')).toEqual([]);
  });

  it('Given candidates of different scores When related posts are computed Then the highest score comes first, whatever the dates', () => {
    const posts = [
      post('courant', ['Angular', 'TypeScript', 'CSP']),
      post('theme-seul', ['NestJS'], '2026-10-01T00:00:00Z'),
      post('un-tag-et-son-theme', ['Angular'], '2026-09-01T00:00:00Z'),
      post('deux-tags-deux-themes', ['Angular', 'CSP'], '2026-08-01T00:00:00Z'),
    ];

    expect(slugsOf(relatedPosts(posts, 'courant'))).toEqual([
      'deux-tags-deux-themes',
      'un-tag-et-son-theme',
      'theme-seul',
    ]);
  });

  it('Given two candidates touching one theme through several tags or through one When related posts are computed Then a theme counts once, and the newer wins the tie', () => {
    const posts = [
      post('courant', ['Angular', 'TypeScript', 'CSP']),
      post('plusieurs-tags-stack', ['NestJS', 'Docker', 'Zod'], '2026-08-01T00:00:00Z'),
      post('un-tag-securite', ['XSS'], '2026-09-01T00:00:00Z'),
    ];

    expect(slugsOf(relatedPosts(posts, 'courant'))).toEqual([
      'un-tag-securite',
      'plusieurs-tags-stack',
    ]);
  });

  it('Given a shared free tag and a shared theme When related posts are computed Then both weigh the same, and the newer wins the tie', () => {
    const posts = [
      post('courant', ['Angular', 'Bricolage']),
      post('tag-libre', ['Bricolage'], '2026-08-01T00:00:00Z'),
      post('theme', ['TypeScript'], '2026-09-01T00:00:00Z'),
    ];

    expect(slugsOf(relatedPosts(posts, 'courant'))).toEqual(['theme', 'tag-libre']);
  });

  it('Given candidates of equal score and equal date When related posts are computed Then they come in slug order', () => {
    const posts = [
      post('courant', ['Angular']),
      post('c', ['Angular'], '2026-09-01T00:00:00Z'),
      post('a', ['Angular'], '2026-09-01T00:00:00Z'),
      post('b', ['Angular'], '2026-09-01T00:00:00Z'),
    ];

    expect(slugsOf(relatedPosts(posts, 'courant'))).toEqual(['a', 'b', 'c']);
  });

  it('Given more related candidates than the cap When related posts are computed Then only the three best are kept', () => {
    const posts = [
      post('courant', ['Angular', 'CSP']),
      post('faible-recent', ['TypeScript'], '2026-10-09T00:00:00Z'),
      post('fort-1', ['Angular', 'CSP'], '2026-08-01T00:00:00Z'),
      post('moyen', ['Angular'], '2026-08-02T00:00:00Z'),
      post('fort-2', ['Angular', 'CSP'], '2026-08-03T00:00:00Z'),
      post('faible-ancien', ['TypeScript'], '2026-07-01T00:00:00Z'),
    ];

    expect(slugsOf(relatedPosts(posts, 'courant'))).toEqual(['fort-2', 'fort-1', 'moyen']);
  });

  it('Given a frozen list When related posts are computed Then the input is left untouched', () => {
    const posts = Object.freeze([
      post('courant', ['Angular']),
      post('ancien', ['Angular'], '2026-08-01T00:00:00Z'),
      post('recent', ['Angular'], '2026-09-01T00:00:00Z'),
    ]);

    expect({
      related: slugsOf(relatedPosts(posts, 'courant')),
      input: slugsOf(posts),
    }).toEqual({ related: ['recent', 'ancien'], input: ['courant', 'ancien', 'recent'] });
  });
});
