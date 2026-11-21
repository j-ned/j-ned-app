import type { BlogPostSummary } from './models/blog-post.model';
import { byNewestPublication, isPublished } from './publication-order';
import { projectTagOf } from './models/project-tag.model';

export function postsAboutProject(
  posts: readonly BlogPostSummary[],
  projectSlug: string,
): readonly BlogPostSummary[] {
  const tag = projectTagOf(projectSlug);
  if (!tag) return [];

  return posts
    .filter((post) => isPublished(post) && post.tags.includes(tag))
    .sort(byNewestPublication);
}
