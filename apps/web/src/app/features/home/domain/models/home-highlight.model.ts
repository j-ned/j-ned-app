export type HighlightFact = {
  readonly label: string;
  readonly value: string;
};

export type HomeHighlight = {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly facts: readonly HighlightFact[];
};
