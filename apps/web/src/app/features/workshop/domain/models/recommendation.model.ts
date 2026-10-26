import type { Material } from './material.model';
import type { Operation, OperationId } from './operation.model';
import type { SourceCitation, Sourced } from './source.model';

type IsoDesignationField = Sourced<{
  readonly field: string;
  readonly code: string;
  readonly meaning: string;
}>;

export type ExternalSituation =
  | 'external-shoulder'
  | 'external-no-shoulder'
  | 'external-profiling'
  | 'external-steep-profiling'
  | 'external-facing';

export type InternalSituation =
  'internal-shoulder' | 'internal-stronger-edge' | 'internal-no-shoulder' | 'internal-profiling';

export type InsertSituation = ExternalSituation | InternalSituation;

export type IsoInsertProposal<S extends InsertSituation = InsertSituation> = {
  readonly situation: S;
  readonly choice: readonly [SourceCitation, ...SourceCitation[]];
  readonly fields: readonly [IsoDesignationField, ...IsoDesignationField[]];
};

export type IsoInsertDesignation<S extends InsertSituation = InsertSituation> = {
  readonly kind: 'iso-1832';
  readonly proposals: readonly [IsoInsertProposal<S>, ...IsoInsertProposal<S>[]];
};

type InsertAspect = 'width' | 'profile' | 'edge-count' | 'clamping';

type DescribedAspect = Sourced<{ readonly aspect: InsertAspect; readonly text: string }>;

export type DescribedInsert = {
  readonly kind: 'described';
  readonly aspects: readonly [DescribedAspect, ...DescribedAspect[]];
};

export type InsertFor<O extends OperationId> = O extends `external-${string}`
  ? IsoInsertDesignation<ExternalSituation>
  : O extends `internal-${string}`
    ? IsoInsertDesignation<InternalSituation>
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
    readonly geometry: readonly [Sourced<string>, ...Sourced<string>[]];
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
