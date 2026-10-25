import type { Material } from './material.model';
import type { Operation, OperationId } from './operation.model';
import type { Sourced } from './source.model';

type IsoDesignatedOperation = Extract<OperationId, `external-${string}` | `internal-${string}`>;

type IsoDesignationField = Sourced<{
  readonly field: string;
  readonly code: string;
  readonly meaning: string;
}>;

export type IsoInsertDesignation = {
  readonly kind: 'iso-1832';
  readonly fields: readonly [IsoDesignationField, ...IsoDesignationField[]];
};

type InsertAspect = 'width' | 'profile' | 'edge-count' | 'clamping';

type DescribedAspect = Sourced<{ readonly aspect: InsertAspect; readonly text: string }>;

export type DescribedInsert = {
  readonly kind: 'described';
  readonly aspects: readonly [DescribedAspect, ...DescribedAspect[]];
};

export type InsertFor<O extends OperationId> = O extends IsoDesignatedOperation
  ? IsoInsertDesignation
  : DescribedInsert;

export type CuttingSpeedRange = {
  readonly min: number;
  readonly max: number;
  readonly unit: 'm/min';
};

export type RecommendationEntry = {
  [O in OperationId]: {
    readonly operation: O;
    readonly materials: readonly [string, ...string[]];
    readonly insert: InsertFor<O>;
    readonly geometry: Sourced<string>;
    readonly grade: Sourced<string>;
    readonly cuttingSpeed?: Sourced<CuttingSpeedRange>;
    readonly pitfalls: readonly Sourced<string>[];
  };
}[OperationId];

export type GuideState =
  | { readonly status: 'incomplete' }
  | { readonly status: 'unavailable'; readonly material: Material; readonly operation: Operation }
  | {
      readonly status: 'available';
      readonly material: Material;
      readonly operation: Operation;
      readonly entry: RecommendationEntry;
    };
