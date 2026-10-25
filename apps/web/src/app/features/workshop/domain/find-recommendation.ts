import type { GuideSelection } from './guide-selection';
import type { InsertGuideReference } from './models/insert-guide-reference.model';
import type { OperationId } from './models/operation.model';
import type { GuideState, RecommendationEntry } from './models/recommendation.model';

export function findRecommendation(
  recommendations: readonly RecommendationEntry[],
  materialSlug: string,
  operationId: OperationId,
): RecommendationEntry | undefined {
  return recommendations.find(
    (entry) => entry.operation === operationId && entry.materials.includes(materialSlug),
  );
}

export function resolveGuideState(
  reference: InsertGuideReference,
  selection: GuideSelection,
): GuideState {
  const material = reference.materials.find(({ slug }) => slug === selection.material);
  const operation = reference.families
    .flatMap(({ operations }) => operations)
    .find(({ slug }) => slug === selection.operation);
  if (material === undefined || operation === undefined) {
    return { status: 'incomplete' };
  }
  const entry = findRecommendation(reference.recommendations, material.slug, operation.id);
  return entry === undefined
    ? { status: 'unavailable', material, operation }
    : { status: 'available', material, operation, entry };
}
