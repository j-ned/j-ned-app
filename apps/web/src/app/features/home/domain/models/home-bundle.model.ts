import type { HeroData } from './hero.model';
import type { HomeHighlight } from '@features/home/domain';
import type { Project } from '@features/projects/domain';

export type HomeBundle = {
  readonly hero: HeroData | null;
  readonly highlights: readonly HomeHighlight[];
  readonly featuredProjects: readonly Project[];
};
