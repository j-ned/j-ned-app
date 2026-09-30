export type Biography = {
  readonly id: string;
  readonly title: string;
  readonly summary: string;
  readonly lead: string;
  readonly leadEmphasis: string;
  readonly paragraphs: readonly string[];
};
