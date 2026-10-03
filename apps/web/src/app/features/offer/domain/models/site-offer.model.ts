export type OfferHeroContent = {
  readonly title: string;
  readonly subtitle: string;
  readonly ctaLabel: string;
  readonly priceLabel: string;
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

export type OfferPricingContent = {
  readonly creation: { readonly priceLabel: string; readonly terms: string };
  readonly maintenance: {
    readonly priceLabel: string;
    readonly terms: string;
    readonly includes: readonly string[];
  };
};

export type OfferFaqItem = {
  readonly id: string;
  readonly question: string;
  readonly answer: string;
};

export type SiteOfferContent = {
  readonly hero: OfferHeroContent;
  readonly reasons: readonly OfferReason[];
  readonly deliverables: readonly string[];
  readonly steps: readonly OfferStep[];
  readonly pricing: OfferPricingContent;
  readonly faq: readonly OfferFaqItem[];
  readonly requestSubject: string;
  readonly requestIntro: string;
};
