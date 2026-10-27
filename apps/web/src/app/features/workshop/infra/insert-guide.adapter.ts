import type { InsertGuide, InsertGuideDocument } from '../domain/models/insert-guide.model';
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

export function toInsertGuideDocument(dto: InsertGuideDto): InsertGuideDocument {
  return { ...toInsertGuide(dto), version: dto.version };
}
