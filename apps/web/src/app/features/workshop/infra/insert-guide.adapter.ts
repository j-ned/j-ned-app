import type { InsertGuide, InsertGuideDocument } from '../domain/models/insert-guide.model';
import type { InsertGuideDto } from './insert-guide.types';

export function toInsertGuide({ enabled, decoderEnabled, entries }: InsertGuideDto): InsertGuide {
  return {
    enabled,
    decoderEnabled,
    entries: entries.map(({ material, allMaterials, operation, insert, noseRadius, note }) => ({
      ...(allMaterials === true ? { allMaterials } : { material }),
      operation,
      insert,
      ...(noseRadius == null ? {} : { noseRadius }),
      ...(note === undefined ? {} : { note }),
    })),
  };
}

export function toInsertGuideDocument(dto: InsertGuideDto): InsertGuideDocument {
  return { ...toInsertGuide(dto), version: dto.version };
}
