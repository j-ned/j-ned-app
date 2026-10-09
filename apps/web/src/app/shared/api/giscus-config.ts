import { InjectionToken } from '@angular/core';

export type GiscusConfig = {
  readonly repo: `${string}/${string}`;
  readonly repoId: string;
  readonly category: string;
  readonly categoryId: string;
};

// Le widget ne s'affiche que si l'app Giscus est installée sur le dépôt (cf. README).
export const GISCUS_CONFIG = new InjectionToken<GiscusConfig>('GISCUS_CONFIG', {
  factory: (): GiscusConfig => ({
    repo: 'j-ned/ng-portfolio-app',
    repoId: 'R_kgDOQZwuIw',
    category: 'General',
    categoryId: 'DIC_kwDOQZwuI84DEl1C',
  }),
});
