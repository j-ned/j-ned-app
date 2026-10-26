import type { Sourced } from './source.model';

export type IsoGroupLetter = 'P' | 'M' | 'K' | 'N' | 'S' | 'H';

export type IsoGroup = {
  readonly letter: IsoGroupLetter;
  readonly name: Sourced<string>;
};

export type IsoSubgroup =
  | 'non-alloyed-steel'
  | 'low-alloyed-steel'
  | 'free-cutting-steel'
  | 'ferritic-martensitic-stainless'
  | 'austenitic-stainless'
  | 'duplex-stainless'
  | 'precipitation-hardening-stainless'
  | 'cast-iron'
  | 'aluminium'
  | 'heat-resistant-and-titanium'
  | 'hardened-steel'
  | 'stellite';

export type DesignationSystem =
  'en-symbol' | 'material-number' | 'aisi' | 'uns' | 'afnor-legacy' | 'common-name';

export type Designation = Sourced<string> & { readonly system: DesignationSystem };

export type Material = {
  readonly slug: string;
  readonly designations: readonly [Designation, ...Designation[]];
  readonly isoGroup: Sourced<IsoGroupLetter>;
  readonly subgroup: IsoSubgroup;
  readonly behaviour: readonly [Sourced<string>, ...Sourced<string>[]];
};

export type MaterialSuggestion = { readonly material: Material; readonly matched: Designation };
