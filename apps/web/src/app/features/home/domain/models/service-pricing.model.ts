export type ServicePricing = {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly price: string;
  readonly features: readonly string[];
  readonly highlighted: boolean;
  readonly enabled: boolean;
  readonly order: number;
};
