import type { BlogPostSummary } from './models/blog-post.model';

export function filterPostsByTag(
  posts: readonly BlogPostSummary[],
  tag: string,
): readonly BlogPostSummary[] {
  return posts.filter((post) => post.tags.includes(tag));
}
