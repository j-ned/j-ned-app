export type MachiningOperation =
  | 'external-roughing'
  | 'external-finishing'
  | 'internal-roughing'
  | 'internal-finishing'
  | 'boring'
  | 'drilling'
  | 'grooving'
  | 'parting-off'
  | 'threading';

export type InsertGuideEntry = {
  readonly material?: string;
  readonly allMaterials?: true;
  readonly operation: MachiningOperation;
  readonly insert: string;
  readonly noseRadius?: number;
  readonly note?: string;
};

export type InsertGuide = {
  readonly enabled: boolean;
  readonly decoderEnabled: boolean;
  readonly entries: readonly InsertGuideEntry[];
};

export type InsertGuideDocument = InsertGuide & { readonly version: number };

export type InsertGuideRow = {
  readonly operation: string;
  readonly insert: string;
  readonly noseRadius?: number;
  readonly note?: string;
  readonly allMaterials: boolean;
  readonly key: number;
};
