import type { BlogPost } from './models/blog-post.model';

export function filterPostsByTag(posts: readonly BlogPost[], tag: string): readonly BlogPost[] {
  return posts.filter((post) => post.tags.includes(tag));
}
