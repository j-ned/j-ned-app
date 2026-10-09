import type {
  ArchitectureDecision,
  Project,
  ProjectInput,
  ProjectKind,
  TechChoice,
} from '@features/projects/domain/models/project.model';

export type ProjectDraft = {
  title: string;
  category: string;
  tags: readonly string[];
  description: string;
  liveUrl: string;
  repoUrl: string;
  repoUrlFront: string;
  repoUrlBack: string;
  featured: boolean;
  order: number;
  kind: ProjectKind | '';
  techChoices: TechChoice[];
  architectureDecisions: ArchitectureDecision[];
  pitch: string;
  highlight: string;
  scope: string;
};

export function toProjectDraft(project: Project | null): ProjectDraft {
  return {
    title: project?.title ?? '',
    category: project?.category ?? '',
    tags: [...(project?.tags ?? [])],
    description: project?.description ?? '',
    liveUrl: project?.liveUrl ?? '',
    repoUrl: project?.repoUrl ?? '',
    repoUrlFront: project?.repoUrlFront ?? '',
    repoUrlBack: project?.repoUrlBack ?? '',
    featured: project?.featured ?? false,
    order: project?.order ?? 0,
    kind: project?.kind ?? '',
    techChoices: [...(project?.techChoices ?? [])],
    architectureDecisions: [...(project?.architectureDecisions ?? [])],
    pitch: project?.pitch ?? '',
    highlight: project?.highlight ?? '',
    scope: project?.scope ?? '',
  };
}

// `image` n'est jamais dans le payload : la couverture passe par `uploadImage`, le DTO la refuse.
// `null` plutôt qu'absent : un lien vidé doit effacer la valeur dans le PATCH.
export function toProjectInput(draft: ProjectDraft, kind: ProjectKind): ProjectInput {
  return {
    title: draft.title,
    category: draft.category,
    tags: [...draft.tags],
    description: draft.description,
    liveUrl: draft.liveUrl || null,
    repoUrl: draft.repoUrl || null,
    repoUrlFront: draft.repoUrlFront || null,
    repoUrlBack: draft.repoUrlBack || null,
    featured: draft.featured,
    order: draft.order,
    // Copie champ par champ : Signal Forms marque les éléments de tableau d'un symbole interne.
    techChoices: draft.techChoices.map(({ techno, why }) => ({ techno, why })),
    architectureDecisions: draft.architectureDecisions.map(({ decision, rationale }) => ({
      decision,
      rationale,
    })),
    kind,
    pitch: draft.pitch.trim() || null,
    highlight: draft.highlight.trim() || null,
    scope: draft.scope.trim() || null,
  };
}

export function toPreviewProject(draft: ProjectDraft, base: Project | null): Project | null {
  if (draft.kind === '') return null;
  return {
    ...toProjectInput(draft, draft.kind),
    id: base?.id ?? '',
    slug: base?.slug ?? '',
    image: base?.image ?? '',
    gallery: base?.gallery ?? [],
  };
}
