import type { Project, ProjectKind } from '../domain/models/project.model';
import { projectPitch } from '../domain/project-pitch';
import { projectFacts, type ProjectFact } from './project-facts';
import { liveLinkLabel } from './project-kind-copy';

export type FeaturedProjectView = {
  readonly id: string;
  readonly slug: string;
  readonly title: string;
  readonly category: string;
  readonly kind: ProjectKind | null;
  readonly image: string;
  readonly pitch: string;
  readonly facts: readonly ProjectFact[];
  readonly liveLink: { readonly url: string; readonly label: string } | null;
};

export function toFeaturedProjectView(project: Project): FeaturedProjectView {
  return {
    id: project.id,
    slug: project.slug,
    title: project.title,
    category: project.category,
    kind: project.kind,
    image: project.image,
    pitch: projectPitch(project),
    facts: projectFacts(project, ['keyDecision', 'highlight', 'scope', 'stack']),
    liveLink: project.liveUrl ? { url: project.liveUrl, label: liveLinkLabel(project.kind) } : null,
  };
}
