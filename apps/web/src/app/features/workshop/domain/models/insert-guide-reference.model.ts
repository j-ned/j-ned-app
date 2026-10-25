import type { IsoGroup, IsoGroupLetter, Material } from './material.model';
import type { OperationFamily } from './operation.model';
import type { RecommendationEntry } from './recommendation.model';
import type { Source, SourceId } from './source.model';

export type InsertGuideReference = {
  readonly sources: Readonly<Record<SourceId, Source>>;
  readonly isoGroups: Readonly<Record<IsoGroupLetter, IsoGroup>>;
  readonly families: readonly OperationFamily[];
  readonly materials: readonly Material[];
  readonly recommendations: readonly RecommendationEntry[];
};
