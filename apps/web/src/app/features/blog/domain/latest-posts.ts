import type { BlogPost } from './models/blog-post.model';

/** Les `count` derniers articles publiés, du plus récent au plus ancien ; les brouillons sans date sont ignorés. */
export function latestPosts(posts: readonly BlogPost[], count: number): readonly BlogPost[] {
  // `filter` rend un nouveau tableau : le `sort` ne mute pas l'entrée.
  return posts
    .filter((p) => p.publishedAt !== null)
    .sort((a, b) => (b.publishedAt ?? '').localeCompare(a.publishedAt ?? ''))
    .slice(0, Math.max(0, count));
}
