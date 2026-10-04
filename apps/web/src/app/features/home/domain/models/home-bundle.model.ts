import type { HeroData } from './hero.model';
import type { Project } from '@features/projects/domain/models/project.model';

export type HomeBundle = {
  readonly hero: HeroData | null;
  readonly featuredProjects: readonly Project[];
};
