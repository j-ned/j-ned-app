import type { BlogPostSummary } from './models/blog-post.model';
import type { BlogCategoryFilter } from './models/blog-tag.model';
import { isPostInCategory } from './is-post-in-category';

export function filterPostsByCategory(
  posts: readonly BlogPostSummary[],
  category: BlogCategoryFilter,
): readonly BlogPostSummary[] {
  return category === 'all' ? posts : posts.filter((post) => isPostInCategory(post, category));
}
