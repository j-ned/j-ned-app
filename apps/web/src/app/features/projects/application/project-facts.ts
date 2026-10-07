import type { Project } from '../domain/models/project.model';
import { projectStack } from '../domain/project-stack';
import { PROJECT_FACT_LABELS } from './project-kind-copy';

const STACK_SIZE = 4;

type ProjectFactKey = keyof typeof PROJECT_FACT_LABELS;

export type ProjectFact = { readonly label: string; readonly value: string };

function factValue(project: Project, key: ProjectFactKey): string {
  switch (key) {
    case 'keyDecision':
      return project.architectureDecisions?.[0]?.decision ?? '';
    case 'stack':
      return projectStack(project.tags, STACK_SIZE).join(' · ');
    case 'highlight':
      return project.highlight ?? '';
    case 'scope':
      return project.scope ?? '';
  }
}

export function projectFacts(
  project: Project,
  keys: readonly ProjectFactKey[],
): readonly ProjectFact[] {
  return keys.flatMap((key) => {
    const value = factValue(project, key);
    return value ? [{ label: PROJECT_FACT_LABELS[key], value }] : [];
  });
}
