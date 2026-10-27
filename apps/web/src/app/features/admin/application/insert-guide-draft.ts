import type {
  InsertGuide,
  InsertGuideEntry,
  MachiningOperation,
} from '@features/workshop/domain/models/insert-guide.model';

// `key` ne sert qu'au suivi des lignes à l'écran : il ne part jamais à l'API.
export type InsertGuideRowDraft = {
  key: string;
  material: string;
  operation: MachiningOperation | '';
  insert: string;
  noseRadius: number | null;
  note: string;
};

export type InsertGuideDraft = {
  enabled: boolean;
  decoderEnabled: boolean;
  entries: InsertGuideRowDraft[];
};

export function newInsertGuideRow(): InsertGuideRowDraft {
  return {
    key: `entry-${crypto.randomUUID()}`,
    material: '',
    operation: '',
    insert: '',
    noseRadius: null,
    note: '',
  };
}

// Le document renvoyé garde l'ordre du brouillon : chaque ligne reprend la clé de sa position.
export function toInsertGuideDraft(
  guide: InsertGuide | null,
  previous?: InsertGuideDraft,
): InsertGuideDraft {
  return {
    enabled: guide?.enabled ?? false,
    decoderEnabled: guide?.decoderEnabled ?? false,
    entries: (guide?.entries ?? []).map((entry, index) => ({
      key: previous?.entries[index]?.key ?? `entry-${index + 1}`,
      material: entry.material,
      operation: entry.operation,
      insert: entry.insert,
      noseRadius: entry.noseRadius,
      note: entry.note ?? '',
    })),
  };
}

// Les lignes sans opération ni rayon n'atteignent jamais l'envoi : le schéma les refuse avant.
export function toInsertGuidePayload(draft: InsertGuideDraft): InsertGuide {
  return {
    enabled: draft.enabled,
    decoderEnabled: draft.decoderEnabled,
    entries: draft.entries.flatMap(({ material, operation, insert, noseRadius, note }) => {
      if (operation === '' || noseRadius === null) return [];
      const entry: InsertGuideEntry = {
        material: material.trim(),
        operation,
        insert: insert.trim(),
        noseRadius,
      };
      const remark = note.trim();
      return [remark ? { ...entry, note: remark } : entry];
    }),
  };
}
