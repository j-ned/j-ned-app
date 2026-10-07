import type { BlogPost } from './models/blog-post.model';
import type { BlogCategoryCounts, BlogTagCategory } from './models/blog-tag.model';
import { isPostInCategory } from './is-post-in-category';

export function countPostsByCategory(posts: readonly BlogPost[]): BlogCategoryCounts {
  const count = (category: BlogTagCategory): number =>
    posts.filter((post) => isPostInCategory(post, category)).length;
  return {
    stack: count('stack'),
    security: count('security'),
    engineering: count('engineering'),
    journey: count('journey'),
    projects: count('projects'),
  };
}
