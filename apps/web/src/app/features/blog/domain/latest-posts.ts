import type { BlogPostSummary } from './models/blog-post.model';
import { byNewestPublication } from './publication-order';

/** Les `count` derniers articles publiés, du plus récent au plus ancien ; les brouillons sans date sont ignorés. */
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
