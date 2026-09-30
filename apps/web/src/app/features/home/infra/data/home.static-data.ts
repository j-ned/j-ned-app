import type { BuildStep } from '../../domain/models/build-step.model';
import type { HeroData } from '../../domain/models/hero.model';
import type { HomeHighlight } from '../../domain/models/home-highlight.model';

// Chaque preuve et chaque fait doit rester vérifiable dans ce repo ou dans celui de l'API :
// pas de score chiffré tant qu'il n'est pas mesuré en CI.
export const STATIC_HERO: HeroData = {
  id: 'c64a566f-9e53-44f9-96de-f938f0166b9c',
  headline: "Je livre des applications Angular et NestJS jusqu'en production.",
  lead: "Du composant au conteneur : architecture, API, base PostgreSQL, CI/CD et hébergement. Ce site en est l'échantillon, prérendu et déployé sur ma propre infrastructure.",
  proofs: [
    { label: 'runtime', value: 'Angular 22 zoneless', detail: 'signals · Signal Forms' },
    { label: 'rendu', value: 'Pages publiques prérendues', detail: 'hydratation incrémentale' },
    { label: 'sécurité', value: 'CSP stricte par hash', detail: 'calculée au build' },
    { label: 'déploiement', value: 'Docker sur Dokploy', detail: 'auto-hébergé · CI GitHub' },
  ],
};

export const STATIC_HOME_HIGHLIGHTS: readonly HomeHighlight[] = [
  {
    id: 'ba0760a4-4576-4136-a1d0-a78aa969de15',
    title: 'Front',
    description: 'Composants standalone, état en signals, formulaires en Signal Forms.',
    facts: [
      { label: 'détection', value: 'zoneless' },
      { label: 'archi', value: 'domain · infra · application' },
      { label: 'tests', value: 'Vitest' },
    ],
  },
  {
    id: '1caf531c-24d0-4c46-b26d-9105b6a5304a',
    title: 'API',
    description: 'NestJS modulaire, entrées validées, PostgreSQL via Drizzle.',
    facts: [
      { label: 'auth', value: 'JWT · 2FA TOTP' },
      { label: 'protection', value: 'Helmet · rate limiting' },
      { label: 'doc', value: 'Swagger' },
    ],
  },
  {
    id: 'd6c5d2a6-a7f1-4d8b-9573-5a4219a8424c',
    title: 'Infra',
    description: 'Serveur personnel, conteneurs orchestrés, reverse proxy et TLS.',
    facts: [
      { label: 'orchestration', value: 'Dokploy' },
      { label: 'proxy', value: 'Traefik' },
      { label: 'images', value: 'Docker multi-stage' },
    ],
  },
  {
    id: '6c4d4142-c512-4f41-9188-f8630af83d60',
    title: 'Qualité',
    description: 'Navigation clavier complète, mouvement réduit respecté, WCAG AA visé.',
    facts: [
      { label: 'gates', value: 'lint · tests · build' },
      { label: 'lockfile', value: 'frozen en CI' },
      { label: 'commits', value: 'Conventional' },
    ],
  },
];

export const STATIC_BUILD_STEPS: readonly BuildStep[] = [
  {
    id: 'install',
    command: 'pnpm install --frozen-lockfile',
    description: 'Lockfile vérifié, identique en local, en CI et dans Docker.',
  },
  {
    id: 'feeds',
    command: 'sitemap + rss',
    description: "Générés depuis l'API de production avant le build.",
  },
  {
    id: 'prerender',
    command: 'ng build · prérendu',
    description: 'Accueil, projets, articles et pages légales figés en HTML.',
  },
  {
    id: 'csp',
    command: 'apply-csp-hashes',
    description: 'Chaque script inline est haché dans la Content-Security-Policy.',
  },
  {
    id: 'hydrate',
    command: '@defer (hydrate on viewport)',
    description: "Les sections sous le pli ne s'hydratent qu'à l'approche.",
  },
];
