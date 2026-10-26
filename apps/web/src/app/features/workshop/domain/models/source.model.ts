export type SourceId =
  | 'sandvik-choose-insert'
  | 'sandvik-external-turning'
  | 'sandvik-internal-turning'
  | 'sandvik-turning-materials'
  | 'sandvik-workpiece-materials'
  | 'mitsubishi-insert-identification'
  | 'kyocera-turning-inserts'
  | 'kyocera-aluminium-finishing'
  | 'julien-working-list';

export type Source = {
  readonly title: string;
  readonly publisher: string;
  readonly url?: `https://${string}`;
  readonly consultedOn: string;
};

export type SourceCitation = {
  readonly source: SourceId;
  readonly locator: string;
  readonly basis: 'stated' | 'deduced';
  readonly scope?: 'group' | 'subgroup';
};

export type Sourced<T> = { readonly value: T; readonly cite: SourceCitation };
