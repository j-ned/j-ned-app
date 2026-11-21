import type { BlogPostSummary } from './models/blog-post.model';
import { byNewestPublication } from './publication-order';

export function latestPosts(
  posts: readonly BlogPostSummary[],
  count: number,
): readonly BlogPostSummary[] {
  // `filter` rend un nouveau tableau : le `sort` ne mute pas l'entrée.
  return posts
    .filter((p) => p.publishedAt !== null)
    .sort(byNewestPublication)
    .slice(0, Math.max(0, count));
}
