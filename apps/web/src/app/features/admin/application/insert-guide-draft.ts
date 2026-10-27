import type {
  InsertGuide,
  InsertGuideEntry,
  MachiningOperation,
} from '@features/workshop/domain/models/insert-guide.model';

// `key` ne sert qu'au suivi des blocs et des outils à l'écran : il ne part jamais à l'API.
export type InsertGuideToolDraft = {
  key: string;
  operation: MachiningOperation | '';
  insert: string;
  noseRadius: number | null;
  note: string;
};

export type InsertGuideGroupDraft = {
  key: string;
  material: string;
  allMaterials: boolean;
  tools: InsertGuideToolDraft[];
};

export type InsertGuideDraft = {
  enabled: boolean;
  decoderEnabled: boolean;
  groups: InsertGuideGroupDraft[];
};

export function newInsertGuideTool(): InsertGuideToolDraft {
  return {
    key: `tool-${crypto.randomUUID()}`,
    operation: '',
    insert: '',
    noseRadius: null,
    note: '',
  };
}

export function newInsertGuideGroup(allMaterials: boolean): InsertGuideGroupDraft {
  return {
    key: `group-${crypto.randomUUID()}`,
    material: '',
    allMaterials,
    tools: [newInsertGuideTool()],
  };
}

const GENERIC = Symbol('all materials');

function groupedEntries(entries: readonly InsertGuideEntry[]): InsertGuideEntry[][] {
  const groups = new Map<string | typeof GENERIC, InsertGuideEntry[]>();
  for (const entry of entries) {
    const material = entry.allMaterials ? GENERIC : (entry.material ?? '').trim();
    groups.set(material, [...(groups.get(material) ?? []), entry]);
  }
  const generic = groups.get(GENERIC);
  groups.delete(GENERIC);
  return generic ? [...groups.values(), generic] : [...groups.values()];
}

// Le document renvoyé garde l'ordre du brouillon : blocs et outils reprennent la clé de leur position.
export function toInsertGuideDraft(
  guide: InsertGuide | null,
  previous?: InsertGuideDraft,
): InsertGuideDraft {
  return {
    enabled: guide?.enabled ?? false,
    decoderEnabled: guide?.decoderEnabled ?? false,
    groups: groupedEntries(guide?.entries ?? []).map((entries, groupIndex) => {
      const before = previous?.groups[groupIndex];
      return {
        key: before?.key ?? `group-${groupIndex + 1}`,
        material: entries[0]?.allMaterials ? '' : (entries[0]?.material ?? '').trim(),
        allMaterials: entries[0]?.allMaterials === true,
        tools: entries.map((entry, toolIndex) => ({
          key: before?.tools[toolIndex]?.key ?? `tool-${groupIndex + 1}-${toolIndex + 1}`,
          operation: entry.operation,
          insert: entry.insert,
          noseRadius: entry.noseRadius ?? null,
          note: entry.note ?? '',
        })),
      };
    }),
  };
}

// Les outils sans opération n'atteignent jamais l'envoi : le schéma les refuse avant.
export function toInsertGuidePayload(draft: InsertGuideDraft): InsertGuide {
  return {
    enabled: draft.enabled,
    decoderEnabled: draft.decoderEnabled,
    entries: draft.groups.flatMap(({ material, allMaterials, tools }) =>
      tools.flatMap(({ operation, insert, noseRadius, note }) => {
        if (operation === '') return [];
        const remark = note.trim();
        const entry: InsertGuideEntry = {
          ...(allMaterials ? { allMaterials } : { material: material.trim() }),
          operation,
          insert: insert.trim(),
          ...(noseRadius === null || Number.isNaN(noseRadius) ? {} : { noseRadius }),
          ...(remark ? { note: remark } : {}),
        };
        return [entry];
      }),
    ),
  };
}
