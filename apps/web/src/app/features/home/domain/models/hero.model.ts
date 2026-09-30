export type HeroProof = {
  readonly label: string;
  readonly value: string;
  readonly detail: string;
};

export type HeroData = {
  readonly id: string;
  readonly headline: string;
  readonly lead: string;
  readonly proofs: readonly HeroProof[];
};
