import type { HeroData } from './hero.model';
import type { BuildStep } from './build-step.model';
import type { HomeHighlight } from '@features/home/domain/models/home-highlight.model';
import type { Project } from '@features/projects/domain/models/project.model';

export type HomeBundle = {
  readonly hero: HeroData | null;
  readonly highlights: readonly HomeHighlight[];
  readonly buildSteps: readonly BuildStep[];
  readonly featuredProjects: readonly Project[];
};
