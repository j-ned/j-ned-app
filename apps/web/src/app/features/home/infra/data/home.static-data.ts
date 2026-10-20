import { SITE_IDENTITY } from '@shared/identity/site-identity.static-data';
import type { HeroData } from '../../domain/models/hero.model';

export const STATIC_HERO: HeroData = {
  id: 'c64a566f-9e53-44f9-96de-f938f0166b9c',
  headline: 'Tourneur CN le jour, développeur web le reste du temps.',
  headlineAccent: 'développeur web',
  lead: `${SITE_IDENTITY.journey} J'écris ici sur ce que je construis avec Angular, NestJS et PostgreSQL, et sur l'auto-hébergement\u00a0: le code, les choix et leurs compromis.`,
};
