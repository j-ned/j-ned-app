export type Review = {
  readonly id: string;
  readonly quote: string;
  readonly authorName: string;
  readonly authorContext: string;
  readonly datePublished: `${number}-${number}-${number}`;
};
