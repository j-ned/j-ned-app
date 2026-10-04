export type OfferSlug =
  | 'site-vitrine'
  | 'site-atelier'
  | 'application-metier'
  | 'refonte-maintenance'
  | 'renfort-freelance';

export type OfferFamily = 'sites' | 'applications';

export type OfferAmount =
  | { readonly kind: 'fixed'; readonly eur: number }
  | { readonly kind: 'from'; readonly eur: number }
  | { readonly kind: 'on-request' };

export type OfferPeriod = 'once' | 'month' | 'day';

export type OfferPriceLine = {
  readonly id: string;
  readonly name: string;
  readonly amount: OfferAmount;
  readonly period: OfferPeriod;
  readonly label: string;
  readonly terms: string;
  readonly includes?: readonly string[];
  readonly link?: 'malt';
};

export type OfferSummary = {
  readonly slug: OfferSlug;
  readonly family: OfferFamily;
  readonly name: string;
  readonly shortName: string;
  readonly audience: string;
  readonly promise: string;
  readonly priceTeaser: string;
  readonly featuredOnHome: boolean;
  readonly seo: {
    readonly title: string;
    readonly description: string;
    readonly serviceType: string;
    readonly serviceDescription?: string;
    readonly breadcrumbName?: string;
  };
};

export type OfferReason = {
  readonly id: string;
  readonly lead: string;
  readonly detail: string;
};

export type OfferStep = {
  readonly id: string;
  readonly verb: string;
  readonly when: string;
  readonly detail: string;
};

export type OfferFaqItem = {
  readonly id: string;
  readonly question: string;
  readonly answer: string;
};

export type OfferSection<T> = { readonly heading: string; readonly items: readonly T[] };

export type OfferPageContent = {
  readonly hero: { readonly title: string; readonly subtitle: string; readonly ctaLabel: string };
  readonly reasons?: OfferSection<OfferReason>;
  readonly deliverables?: OfferSection<string>;
  readonly steps?: OfferSection<OfferStep>;
  readonly pricing: { readonly heading: string; readonly lines: readonly OfferPriceLine[] };
  readonly faq?: OfferSection<OfferFaqItem>;
  readonly request: { readonly subject: string; readonly intro: string };
};

export type OfferPages = Readonly<Record<OfferSlug, OfferPageContent>>;
