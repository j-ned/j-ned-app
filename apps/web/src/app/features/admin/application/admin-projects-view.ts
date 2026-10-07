import { countProjectsByKind } from '@features/projects/domain/count-projects-by-kind';
import { filterProjectsByKind } from '@features/projects/domain/filter-projects-by-kind';
import {
  PROJECT_KINDS,
  type Project,
  type ProjectKind,
  type ProjectKindFilter,
} from '@features/projects/domain/models/project.model';
import { projectStack } from '@features/projects/domain/project-stack';
import { PROJECT_KIND_FILTER_LABELS } from '@features/projects/application/project-kind-copy';
import type { Fact } from '@shared/ui/fact-list';
import type { FilterOption } from '@shared/ui/filter-group';

const STACK_SIZE = 4;

export type AdminProjectRowView = {
  readonly id: string;
  readonly slug: string;
  readonly order: string;
  readonly overline: string;
  readonly title: string;
  readonly pitch: string | null;
  readonly image: string;
  readonly kind: ProjectKind | null;
  readonly facts: readonly Fact[];
};

type AdminProjectsView = {
  readonly filters: readonly FilterOption<ProjectKindFilter>[];
  readonly rows: readonly AdminProjectRowView[];
};

function stackFact(tags: readonly string[]): readonly Fact[] {
  if (tags.length === 0) return [];
  const rest = tags.length - STACK_SIZE;
  const shown = projectStack(tags, STACK_SIZE).join(' · ');
  return [{ label: 'Stack', value: rest > 0 ? `${shown} +${rest}` : shown }];
}

function toRow(project: Project, order: string): AdminProjectRowView {
  return {
    id: project.id,
    slug: project.slug,
    order,
    overline: `${order} · ${project.category}`,
    title: project.title,
    pitch: project.pitch || null,
    image: project.image,
    kind: project.kind,
    facts: [
      ...stackFact(project.tags),
      ...(project.featured ? [{ label: 'Accueil', value: 'Mis en avant' }] : []),
    ],
  };
}

export function toAdminProjectsView(
  projects: readonly Project[],
  filter: ProjectKindFilter,
): AdminProjectsView {
  const counts = countProjectsByKind(projects);
  const ranks = new Map(projects.map((project, index) => [project.id, index + 1]));
  return {
    filters: [
      {
        value: 'all',
        label: PROJECT_KIND_FILTER_LABELS.all,
        count: projects.length,
        disabled: projects.length === 0,
      },
      ...PROJECT_KINDS.map((kind) => ({
        value: kind,
        label: PROJECT_KIND_FILTER_LABELS[kind],
        count: counts[kind],
        disabled: counts[kind] === 0,
      })),
    ],
    rows: filterProjectsByKind(projects, filter).map((project) =>
      toRow(project, String(ranks.get(project.id) ?? 0).padStart(2, '0')),
    ),
  };
}
