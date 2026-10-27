import type { MachiningOperation } from '../domain/models/insert-guide.model';

type InsertGuideEntryDto = {
  readonly material: string;
  readonly operation: MachiningOperation;
  readonly insert: string;
  readonly noseRadius: number;
  readonly note?: string;
};

export type InsertGuideDto = {
  readonly enabled: boolean;
  readonly decoderEnabled: boolean;
  readonly entries: readonly InsertGuideEntryDto[];
  readonly version: number;
  readonly updatedAt: string | null;
};
