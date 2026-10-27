export type MachiningOperation =
  | 'external-roughing'
  | 'external-finishing'
  | 'internal-roughing'
  | 'internal-finishing'
  | 'drilling'
  | 'grooving'
  | 'parting-off'
  | 'threading';

export type InsertGuideEntry = {
  readonly material: string;
  readonly operation: MachiningOperation;
  readonly insert: string;
  readonly noseRadius: number;
  readonly note?: string;
};

export type InsertGuide = {
  readonly enabled: boolean;
  readonly entries: readonly InsertGuideEntry[];
};

export type InsertGuideRow = {
  readonly operation: string;
  readonly insert: string;
  readonly noseRadius: number;
  readonly note?: string;
};
