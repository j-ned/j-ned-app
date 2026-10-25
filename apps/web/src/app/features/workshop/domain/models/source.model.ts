export type SourceId = never;

export type Source = {
  readonly title: string;
  readonly publisher: string;
  readonly url: `https://${string}`;
  readonly consultedOn: string;
};

export type SourceCitation = { readonly source: SourceId; readonly locator: string };

export type Sourced<T> = { readonly value: T; readonly cite: SourceCitation };
