import type { BlogPost } from './models/blog-post.model';
import { blogTagCategory, type BlogTagCategory } from './models/blog-tag.model';

export const RELATED_POSTS_LIMIT = 3;

function categoriesOf(post: BlogPost): ReadonlySet<BlogTagCategory> {
  return new Set(post.tags.map(blogTagCategory).filter((category) => category !== null));
}

function sharedCount<T>(a: ReadonlySet<T>, b: Iterable<T>): number {
  return [...new Set(b)].filter((item) => a.has(item)).length;
}

export function relatedPosts(posts: readonly BlogPost[], slug: string): readonly BlogPost[] {
  const current = posts.find((p) => p.slug === slug);
  if (!current) return [];

  const tags = new Set(current.tags);
  const categories = categoriesOf(current);

  return posts
    .filter((p) => p.slug !== slug && p.status === 'published')
    .map((post) => ({
      post,
      score: sharedCount(tags, post.tags) + sharedCount(categories, categoriesOf(post)),
    }))
    .filter(({ score }) => score > 0)
    .sort(
      (a, b) =>
        b.score - a.score ||
        (b.post.publishedAt ?? '').localeCompare(a.post.publishedAt ?? '') ||
        a.post.slug.localeCompare(b.post.slug),
    )
    .slice(0, RELATED_POSTS_LIMIT)
    .map(({ post }) => post);
}
