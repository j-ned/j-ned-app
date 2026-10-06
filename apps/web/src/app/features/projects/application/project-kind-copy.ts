import type { ProjectKind } from '../domain/models/project.model';

export const PROJECT_KIND_LABELS: Record<ProjectKind, string> = {
  production: 'En production',
  demo: 'Démo',
  script: 'Script',
};

const NEUTRAL_LIVE_LINK_LABEL = 'Voir le site';

const LIVE_LINK_LABELS: Record<ProjectKind, string> = {
  production: "Ouvrir l'application",
  demo: 'Voir la démo',
  script: NEUTRAL_LIVE_LINK_LABEL,
};

export function liveLinkLabel(kind: ProjectKind | null): string {
  return kind ? LIVE_LINK_LABELS[kind] : NEUTRAL_LIVE_LINK_LABEL;
}

const NBSP = '\u00a0';

export function liveLinkContext(title: string): string {
  return `${NBSP}: ${title}, nouvel onglet`;
}
