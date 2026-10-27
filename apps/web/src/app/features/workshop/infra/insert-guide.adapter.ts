import type { InsertGuide } from '../domain/models/insert-guide.model';
import type { InsertGuideDto } from './insert-guide.types';

export function toInsertGuide({ enabled, entries }: InsertGuideDto): InsertGuide {
  return {
    enabled,
    entries: entries.map(({ material, operation, insert, noseRadius, note }) => ({
      material,
      operation,
      insert,
      noseRadius,
      ...(note === undefined ? {} : { note }),
    })),
  };
}
