import type { BlogPostSummary } from './models/blog-post.model';
import { byNewestPublication } from './publication-order';

export type AdjacentPosts = {
  readonly older: BlogPostSummary | null;
  readonly newer: BlogPostSummary | null;
};

const NONE: AdjacentPosts = { older: null, newer: null };

export function adjacentPosts(posts: readonly BlogPostSummary[], slug: string): AdjacentPosts {
  // `filter` rend un nouveau tableau : le `sort` ne mute pas l'entrée.
  const published = posts.filter((p) => p.publishedAt !== null).sort(byNewestPublication);
  const index = published.findIndex((p) => p.slug === slug);
  if (index === -1) return NONE;
  return { older: published[index + 1] ?? null, newer: published[index - 1] ?? null };
}
