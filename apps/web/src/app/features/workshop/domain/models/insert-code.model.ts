export type InsertCodePosition = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type InsertShapeCode =
  | 'A'
  | 'B'
  | 'C'
  | 'D'
  | 'E'
  | 'F'
  | 'H'
  | 'K'
  | 'L'
  | 'M'
  | 'O'
  | 'P'
  | 'R'
  | 'S'
  | 'T'
  | 'V'
  | 'W';

export type InsertClearanceCode = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'N' | 'P';

export type InsertToleranceCode =
  'A' | 'C' | 'E' | 'F' | 'G' | 'H' | 'J' | 'K' | 'L' | 'M' | 'N' | 'U';

export type InsertFixingCode =
  'A' | 'B' | 'C' | 'F' | 'G' | 'H' | 'J' | 'M' | 'N' | 'Q' | 'R' | 'T' | 'U' | 'W' | 'X';

export type InsertThicknessCode = '01' | '02' | 'T2' | '03' | 'T3' | '04' | '06' | '07' | '09';

export type InsertNoseRadiusCode =
  '00' | '01' | '02' | '04' | '08' | '12' | '16' | '20' | '24' | '28' | '32';

export type InsertSizedShapeCode = Extract<InsertShapeCode, 'C' | 'D' | 'S' | 'T' | 'V' | 'W'>;

export type Iso1832Source = {
  readonly publisher: 'Mitsubishi Materials' | 'Kyocera';
  readonly title: string;
  readonly url: string;
};

export type Iso1832Sources = readonly [Iso1832Source, Iso1832Source, ...Iso1832Source[]];

export type Iso1832LetterTable<Code extends string> = {
  readonly position: InsertCodePosition;
  readonly label: string;
  readonly sources: Iso1832Sources;
  readonly entries: Readonly<Record<Code, string>>;
};

export type Iso1832SizeTable = {
  readonly position: 5;
  readonly label: string;
  readonly sources: Iso1832Sources;
  readonly inscribedCircles: Readonly<
    Record<InsertSizedShapeCode, Readonly<Partial<Record<string, string>>>>
  >;
};

export type DecodedInsertPosition = {
  readonly position: InsertCodePosition;
  readonly label: string;
  readonly code: string;
  readonly meaning: string;
  readonly sources: Iso1832Sources;
};

export type InsertCodeErrorReason = 'missing' | 'unknown' | 'ansi';

export type InsertCodeError = {
  readonly position: InsertCodePosition;
  readonly reason: InsertCodeErrorReason;
  readonly found: string;
};

export type InsertCodeDecoding =
  | {
      readonly ok: true;
      readonly positions: readonly DecodedInsertPosition[];
      readonly suffix: string;
    }
  | { readonly ok: false; readonly error: InsertCodeError };
