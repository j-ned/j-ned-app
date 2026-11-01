import type { MachiningOperation } from '../domain/models/insert-guide.model';

type InsertGuideEntryDto = {
  readonly material?: string;
  readonly allMaterials?: boolean;
  readonly operation: MachiningOperation;
  readonly insert: string;
  readonly noseRadius?: number | null;
  readonly note?: string;
};

export type InsertGuideDto = {
  readonly enabled: boolean;
  readonly decoderEnabled: boolean;
  readonly entries: readonly InsertGuideEntryDto[];
  readonly version: number;
  readonly updatedAt: string | null;
};
