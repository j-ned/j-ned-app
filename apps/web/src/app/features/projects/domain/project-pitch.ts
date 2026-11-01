import type { Project } from './models/project.model';

const firstSentence = (text: string): string => text.split(/(?<=\.)\s/)[0] ?? text;

export function projectPitch(project: Project): string {
  return project.pitch ?? firstSentence(project.description);
}
