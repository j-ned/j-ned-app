import type { OfferFamily, OfferSummary } from './models/offer.model';

const FAMILY_ORDER: readonly OfferFamily[] = ['sites', 'applications'];

export function groupOffersByFamily(
  offers: readonly OfferSummary[],
): readonly { readonly family: OfferFamily; readonly offers: readonly OfferSummary[] }[] {
  return FAMILY_ORDER.map((family) => ({
    family,
    offers: offers.filter((offer) => offer.family === family),
  })).filter((group) => group.offers.length > 0);
}
