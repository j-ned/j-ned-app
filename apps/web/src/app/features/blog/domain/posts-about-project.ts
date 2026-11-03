import type { BlogPostSummary } from './models/blog-post.model';
import { projectTagOf } from './models/project-tag.model';

export function postsAboutProject(
  posts: readonly BlogPostSummary[],
  projectSlug: string,
): readonly BlogPostSummary[] {
  const tag = projectTagOf(projectSlug);
  if (!tag) return [];

  return posts
    .filter((post) => post.status === 'published' && post.tags.includes(tag))
    .sort((a, b) => (b.publishedAt ?? '').localeCompare(a.publishedAt ?? ''));
}
