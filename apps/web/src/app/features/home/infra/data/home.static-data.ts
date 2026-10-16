import { formatEur } from '@features/offer/domain/format-eur';
import { OFFER_PRICES } from '@features/offer/domain/offer-prices.static-data';
import { SITE_IDENTITY } from '@shared/identity/site-identity.static-data';
import type { HeroData } from '../../domain/models/hero.model';

export const STATIC_HERO: HeroData = {
  id: 'c64a566f-9e53-44f9-96de-f938f0166b9c',
  headline: 'Votre site ou votre application web, à prix annoncé, sur un délai tenu.',
  headlineAccent: 'à prix annoncé',
  lead: `${SITE_IDENTITY.journey} Je prends des missions freelance ponctuelles, le soir et le week-end, avec une charge limitée. Pour les TPE, les artisans et les ateliers\u00a0: site vitrine à ${formatEur(OFFER_PRICES['site-vitrine'].creationEur)} prix final, périmètre, délai et prix fixés au devis avant de commencer.`,
};
