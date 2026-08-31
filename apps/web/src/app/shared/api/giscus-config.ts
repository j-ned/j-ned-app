import { InjectionToken } from '@angular/core';

export type GiscusConfig = {
  readonly repo: `${string}/${string}`;
  readonly repoId: string;
  readonly category: string;
  readonly categoryId: string;
};

// Valeurs `repoId`/`categoryId` à récupérer sur giscus.app une fois les
// Discussions activées + l'app Giscus installée sur j-ned/ng-portfolio-app
// (étape manuelle, cf. spec). Tant que ce n'est pas fait, le widget ne
// s'affichera simplement pas (Giscus ignore silencieusement un repoId invalide).
export const GISCUS_CONFIG = new InjectionToken<GiscusConfig>('GISCUS_CONFIG', {
  factory: (): GiscusConfig => ({
    repo: 'j-ned/ng-portfolio-app',
    repoId: '', // TODO (utilisateur) : coller la valeur donnée par giscus.app
    category: 'Comments',
    categoryId: '', // TODO (utilisateur) : coller la valeur donnée par giscus.app
  }),
});
