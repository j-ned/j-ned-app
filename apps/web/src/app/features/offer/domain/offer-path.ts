import type { OfferSlug } from './models/offer.model';

export const OFFERS_BASE_PATH = 'offres';

export const OFFER_REQUEST_FRAGMENT = 'demande';

export const offerPath = (slug: OfferSlug): string => `/${OFFERS_BASE_PATH}/${slug}`;
