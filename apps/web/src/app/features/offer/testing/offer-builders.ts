import { OFFERS } from '../domain/offer-catalog.static-data';
import type {
  OfferPageContent,
  OfferPriceLine,
  OfferSlug,
  OfferSummary,
} from '../domain/models/offer.model';

type OptionalOfferSection = 'reasons' | 'deliverables' | 'steps' | 'faq';
type Mutable<T> = { -readonly [K in keyof T]: T[K] };

export function offerSummaryOf(slug: OfferSlug): OfferSummary {
  const summary = OFFERS.find((offer) => offer.slug === slug);
  if (!summary) throw new Error(`No offer summary for slug ${slug}`);
  return summary;
}

export function makeOfferSummary(overrides: Partial<OfferSummary> = {}): OfferSummary {
  return {
    slug: 'site-atelier',
    family: 'sites',
    name: 'Offre de test',
    audience: 'Public de test',
    promise: 'Promesse de test',
    priceTeaser: 'Prix de test',
    featuredOnHome: true,
    seo: {
      title: 'Offre de test | Julien Nédellec',
      description: 'Description de test.',
      serviceType: 'Service de test',
    },
    ...overrides,
  };
}

export function makeOfferPriceLine(overrides: Partial<OfferPriceLine> = {}): OfferPriceLine {
  return {
    id: 'line',
    name: 'Ligne de test',
    amount: { kind: 'fixed', eur: 100 },
    period: 'once',
    label: 'Libellé de test',
    terms: 'Conditions de test',
    ...overrides,
  };
}

export function makeOfferPageContent(overrides: Partial<OfferPageContent> = {}): OfferPageContent {
  return {
    hero: { title: 'Titre de test', subtitle: 'Sous-titre de test', ctaLabel: 'Demander' },
    reasons: {
      heading: 'Raisons de test',
      items: [
        { id: 'r1', lead: 'Raison un', detail: 'détail un' },
        { id: 'r2', lead: 'Raison deux', detail: 'détail deux' },
      ],
    },
    deliverables: { heading: 'Livrables de test', items: ['Livrable un', 'Livrable deux'] },
    steps: {
      heading: 'Déroulé de test',
      items: [{ id: 's1', verb: 'Faire', when: 'jour 1', detail: 'Détail de l’étape' }],
    },
    pricing: { heading: 'Prix de test', lines: [makeOfferPriceLine()] },
    faq: {
      heading: 'FAQ de test',
      items: [{ id: 'q1', question: 'Question de test ?', answer: 'Réponse de test.' }],
    },
    request: { subject: 'Sujet de test', intro: 'Introduction de test.' },
    ...overrides,
  };
}

export function withoutSections(
  content: OfferPageContent,
  ...sections: readonly OptionalOfferSection[]
): OfferPageContent {
  const next: Mutable<OfferPageContent> = { ...content };
  for (const section of sections) delete next[section];
  return next;
}
