import type { BlogPost } from './models/blog-post.model';
import { PROJECT_TAGS, type ProjectTag } from './models/project-tag.model';

// Égalité exacte : le tag libre « Candidash » ne rattache pas l'article au projet « CandiDash ».
export function linkedProjects(post: BlogPost | undefined): readonly ProjectTag[] {
  return (post?.tags ?? []).flatMap((tag) => PROJECT_TAGS.filter((entry) => entry.tag === tag));
}
