import type { BlogPost } from './models/blog-post.model';
import { blogTagCategory, type BlogTagCategory } from './models/blog-tag.model';

export function isPostInCategory(post: BlogPost, category: BlogTagCategory): boolean {
  return post.tags.some((tag) => blogTagCategory(tag) === category);
}
