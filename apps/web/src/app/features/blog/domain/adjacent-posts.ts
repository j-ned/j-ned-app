import type { BlogPostSummary } from './models/blog-post.model';

export type AdjacentPosts = {
  /** Article publié juste avant (plus ancien). */
  readonly older: BlogPostSummary | null;
  /** Article publié juste après (plus récent). */
  readonly newer: BlogPostSummary | null;
};

const NONE: AdjacentPosts = { older: null, newer: null };

/** Voisins d'un article dans l'ordre de publication ; les brouillons sans date sont ignorés. */
export function adjacentPosts(posts: readonly BlogPostSummary[], slug: string): AdjacentPosts {
  // `filter` rend un nouveau tableau : le `sort` ne mute pas l'entrée.
  const published = posts
    .filter((p) => p.publishedAt !== null)
    .sort((a, b) => (b.publishedAt ?? '').localeCompare(a.publishedAt ?? ''));
  const index = published.findIndex((p) => p.slug === slug);
  if (index === -1) return NONE;
  return { older: published[index + 1] ?? null, newer: published[index - 1] ?? null };
}
