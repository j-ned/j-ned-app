import type { Sourced } from './source.model';

export type IsoGroupLetter = 'P' | 'M' | 'K' | 'N' | 'S' | 'H';

export type IsoGroupColor = never;

export type IsoGroup = {
  readonly letter: IsoGroupLetter;
  readonly name: Sourced<string>;
  readonly color: Sourced<IsoGroupColor>;
};

export type DesignationSystem =
  'en-symbol' | 'material-number' | 'aisi' | 'uns' | 'afnor-legacy' | 'common-name';

export type Designation = Sourced<string> & { readonly system: DesignationSystem };

export type Material = {
  readonly slug: string;
  readonly designations: readonly [Designation, ...Designation[]];
  readonly isoGroup: Sourced<IsoGroupLetter>;
  readonly behaviour: readonly [Sourced<string>, ...Sourced<string>[]];
};

export type MaterialSuggestion = { readonly material: Material; readonly matched: Designation };
