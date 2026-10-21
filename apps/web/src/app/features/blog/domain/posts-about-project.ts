import type { BlogPost } from './models/blog-post.model';
import { projectTagOf } from './models/project-tag.model';

export function postsAboutProject(
  posts: readonly BlogPost[],
  projectSlug: string,
): readonly BlogPost[] {
  const tag = projectTagOf(projectSlug);
  if (!tag) return [];

  return posts
    .filter((post) => post.status === 'published' && post.tags.includes(tag))
    .sort((a, b) => (b.publishedAt ?? '').localeCompare(a.publishedAt ?? ''));
}
