import { InjectionToken } from '@angular/core';

export type GiscusConfig = {
  readonly repo: `${string}/${string}`;
  readonly repoId: string;
  readonly category: string;
  readonly categoryId: string;
};

// repoId/categoryId récupérés via l'API GitHub GraphQL (Discussions déjà
// activées sur ce repo, catégorie "General" réutilisée plutôt que d'en créer
// une dédiée — l'API GitHub n'expose pas de mutation publique pour créer une
// catégorie de discussion, seule l'UI web le permet).
// Reste une étape manuelle : installer l'app Giscus (github.com/apps/giscus)
// sur j-ned/ng-portfolio-app. Tant que ce n'est pas fait, le widget ne
// s'affichera simplement pas (Giscus ignore silencieusement un repo sans
// l'app installée).
export const GISCUS_CONFIG = new InjectionToken<GiscusConfig>('GISCUS_CONFIG', {
  factory: (): GiscusConfig => ({
    repo: 'j-ned/ng-portfolio-app',
    repoId: 'R_kgDOQZwuIw',
    category: 'General',
    categoryId: 'DIC_kwDOQZwuI84DEl1C',
  }),
});
