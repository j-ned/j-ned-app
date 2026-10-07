import { countProjectsByKind } from '../domain/count-projects-by-kind';
import { filterProjectsByKind } from '../domain/filter-projects-by-kind';
import {
  PROJECT_KINDS,
  type Project,
  type ProjectKind,
  type ProjectKindFilter,
} from '../domain/models/project.model';
import { projectPitch } from '../domain/project-pitch';
import { projectStack } from '../domain/project-stack';
import { splitCaseStudies } from '../domain/split-case-studies';
import type { Fact } from '@shared/ui/fact-list';
import type { FilterOption } from '@shared/ui/filter-group';
import { projectFacts } from './project-facts';
import { PROJECT_KIND_DEFINITIONS, PROJECT_KIND_FILTER_LABELS } from './project-kind-copy';
import { projectsIntro } from './projects-intro';

const CARD_STACK_SIZE = 2;

export type LegendRow = {
  readonly kind: ProjectKind;
  readonly definition: string;
  readonly count: number;
};

export type CaseStudyView = {
  readonly id: string;
  readonly slug: string;
  readonly title: string;
  readonly overline: string;
  readonly pitch: string;
  readonly facts: readonly Fact[];
  readonly liveUrl: string | null;
  readonly image: string;
};

export type ProjectCardView = {
  readonly id: string;
  readonly slug: string;
  readonly title: string;
  readonly kind: ProjectKind | null;
  readonly stack: string;
  readonly pitch: string;
  readonly image: string;
};

type ProjectsView = {
  readonly total: number;
  readonly intro: string;
  readonly legend: readonly LegendRow[];
  readonly filters: readonly FilterOption<ProjectKindFilter>[];
  readonly visibleCount: number;
  readonly caseStudies: readonly CaseStudyView[];
  readonly cards: readonly ProjectCardView[];
};

function toCaseStudyView(project: Project, index: number): CaseStudyView {
  return {
    id: project.id,
    slug: project.slug,
    title: project.title,
    overline: `${String(index + 1).padStart(2, '0')} · ${project.category}`,
    pitch: projectPitch(project),
    facts: projectFacts(project, ['stack', 'highlight', 'scope']),
    liveUrl: project.liveUrl ?? null,
    image: project.image,
  };
}

function toCardView(project: Project): ProjectCardView {
  return {
    id: project.id,
    slug: project.slug,
    title: project.title,
    kind: project.kind,
    stack: projectStack(project.tags, CARD_STACK_SIZE).join(' · '),
    pitch: projectPitch(project),
    image: project.image,
  };
}

export function toProjectsView(
  projects: readonly Project[],
  filter: ProjectKindFilter,
): ProjectsView {
  const counts = countProjectsByKind(projects);
  const filtered = filterProjectsByKind(projects, filter);
  const visible = filtered.length > 0 ? filtered : projects;
  const { caseStudies, others } = splitCaseStudies(visible);
  return {
    total: projects.length,
    intro: projectsIntro(counts),
    legend: PROJECT_KINDS.map((kind) => ({
      kind,
      definition: PROJECT_KIND_DEFINITIONS[kind],
      count: counts[kind],
    })),
    filters: [
      { value: 'all', label: PROJECT_KIND_FILTER_LABELS.all, count: projects.length },
      ...PROJECT_KINDS.filter((kind) => counts[kind] > 0).map((kind) => ({
        value: kind,
        label: PROJECT_KIND_FILTER_LABELS[kind],
        count: counts[kind],
      })),
    ],
    visibleCount: visible.length,
    caseStudies: caseStudies.map(toCaseStudyView),
    cards: others.map(toCardView),
  };
}
