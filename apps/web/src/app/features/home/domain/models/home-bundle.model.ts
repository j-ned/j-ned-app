import type { HeroData } from './hero.model';
import type { HomeHighlight } from '@features/home/domain';
import type { ServicePricing } from '@features/home/domain';
import type { Project } from '@features/projects/domain';

export type HomeBundle = {
  readonly hero: HeroData | null;
  readonly highlights: readonly HomeHighlight[];
  readonly services: readonly ServicePricing[];
  readonly featuredProjects: readonly Project[];
};
