import type { BlogPostSummary } from './models/blog-post.model';
import { byNewestPublication, isPublished } from './publication-order';
import { blogTagCategory, type BlogTagCategory } from './models/blog-tag.model';

export const RELATED_POSTS_LIMIT = 3;

function categoriesOf(post: BlogPostSummary): ReadonlySet<BlogTagCategory> {
  return new Set(post.tags.map(blogTagCategory).filter((category) => category !== null));
}

function sharedCount<T>(a: ReadonlySet<T>, b: Iterable<T>): number {
  return [...new Set(b)].filter((item) => a.has(item)).length;
}

export function relatedPosts(
  posts: readonly BlogPostSummary[],
  slug: string,
): readonly BlogPostSummary[] {
  const current = posts.find((p) => p.slug === slug);
  if (!current) return [];

  const tags = new Set(current.tags);
  const categories = categoriesOf(current);

  return posts
    .filter((p) => p.slug !== slug && isPublished(p))
    .map((post) => ({
      post,
      score: sharedCount(tags, post.tags) + sharedCount(categories, categoriesOf(post)),
    }))
    .filter(({ score }) => score > 0)
    .sort(
      (a, b) =>
        b.score - a.score ||
        byNewestPublication(a.post, b.post) ||
        a.post.slug.localeCompare(b.post.slug),
    )
    .slice(0, RELATED_POSTS_LIMIT)
    .map(({ post }) => post);
}
