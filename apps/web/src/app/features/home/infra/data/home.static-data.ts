import { formatEur } from '@features/offer/domain/format-eur';
import { OFFER_PRICES } from '@features/offer/domain/offer-prices.static-data';
import { SITE_IDENTITY } from '@shared/identity/site-identity.static-data';
import type { HeroData } from '../../domain/models/hero.model';

export const STATIC_HERO: HeroData = {
  id: 'c64a566f-9e53-44f9-96de-f938f0166b9c',
  headline: 'Votre site ou votre application web, à prix annoncé, en ligne vite.',
  headlineAccent: 'à prix annoncé',
  lead: `Pour les TPE, les artisans et les ateliers des Yvelines et d'Île-de-France\u00a0: site vitrine à ${formatEur(OFFER_PRICES['site-vitrine'].creationEur)} prix final, en ligne en 7 jours, réponse sous 48\u00a0h ouvrées. ${SITE_IDENTITY.journey}`,
};
