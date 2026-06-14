import type { HeroData } from './hero.model';
import type { HomeHighlight } from '@features/home/domain/models/home-highlight.model';
import type { Project } from '@features/projects/domain/models/project.model';

export type HomeBundle = {
  readonly hero: HeroData | null;
  readonly highlights: readonly HomeHighlight[];
  readonly featuredProjects: readonly Project[];
};
