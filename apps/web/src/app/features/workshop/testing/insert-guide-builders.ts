import type {
  Designation,
  DesignationSystem,
  IsoGroup,
  IsoGroupColor,
  IsoGroupLetter,
  Material,
} from '../domain/models/material.model';
import type { InsertGuideReference } from '../domain/models/insert-guide-reference.model';
import type { Operation, OperationFamily, OperationId } from '../domain/models/operation.model';
import type {
  DescribedInsert,
  InsertFor,
  IsoInsertDesignation,
  RecommendationEntry,
} from '../domain/models/recommendation.model';
import type { Source, SourceCitation, SourceId, Sourced } from '../domain/models/source.model';

// Fictional ids stay assignable whatever the real closed unions list.
const FICTIONAL_SOURCE_ID = 'source-fictive' as string as SourceId;
const FICTIONAL_COLOR = 'couleur-fictive' as string as IsoGroupColor;

export function aSource(overrides: Partial<Source> = {}): Source {
  return {
    title: 'Document fictif de test',
    publisher: 'Éditeur fictif',
    url: 'https://exemple.invalid/document-fictif',
    consultedOn: '2001-01-01',
    ...overrides,
  };
}

export function aCitation(overrides: Partial<SourceCitation> = {}): SourceCitation {
  return {
    source: FICTIONAL_SOURCE_ID,
    locator: 'fixture',
    ...overrides,
  };
}

export function aSourced<T>(value: T): Sourced<T> {
  return { value, cite: aCitation() };
}

export function aDesignation(
  value: string,
  system: DesignationSystem = 'common-name',
): Designation {
  return { ...aSourced(value), system };
}

export function aMaterial(overrides: Partial<Material> = {}): Material {
  return {
    slug: 'matiere-fictive',
    designations: [aDesignation('Matière fictive'), aDesignation('ZZ-FICTIF-0', 'en-symbol')],
    isoGroup: aSourced('P'),
    behaviour: [aSourced('Comportement fictif à la coupe.')],
    ...overrides,
  };
}

export function anIsoGroup(letter: IsoGroupLetter, overrides: Partial<IsoGroup> = {}): IsoGroup {
  return {
    letter,
    name: aSourced(`Groupe fictif ${letter}`),
    color: aSourced(FICTIONAL_COLOR),
    ...overrides,
  };
}

export function anOperation(id: OperationId, overrides: Partial<Operation> = {}): Operation {
  return { id, slug: `operation-fictive-${id}`, label: `Opération fictive ${id}`, ...overrides };
}

export function anOperationFamily(overrides: Partial<OperationFamily> = {}): OperationFamily {
  return {
    id: 'external-turning',
    label: 'Famille fictive',
    operations: [anOperation('external-finishing')],
    ...overrides,
  };
}

export function anIsoInsert(): IsoInsertDesignation {
  return {
    kind: 'iso-1832',
    fields: [aSourced({ field: 'Champ fictif', code: 'Z', meaning: 'Signification fictive' })],
  };
}

export function aDescribedInsert(): DescribedInsert {
  return { kind: 'described', aspects: [aSourced({ aspect: 'width', text: 'Largeur fictive' })] };
}

type EntryCommon = Omit<RecommendationEntry, 'operation' | 'insert'>;

type RecommendationFor<O extends OperationId> = EntryCommon & {
  readonly operation: O;
  readonly insert: InsertFor<O>;
};

const ISO_DESIGNATED_OPERATION = /^(?:external|internal)-/u;

export function aRecommendation<O extends OperationId>(
  operation: O,
  overrides: Partial<EntryCommon & { readonly insert: InsertFor<O> }> = {},
): RecommendationFor<O> {
  const insert = ISO_DESIGNATED_OPERATION.test(operation) ? anIsoInsert() : aDescribedInsert();
  return {
    operation,
    materials: ['matiere-fictive'],
    insert: insert as InsertFor<O>,
    geometry: aSourced('Géométrie fictive.'),
    grade: aSourced('Nuance fictive.'),
    pitfalls: [aSourced('Piège fictif.')],
    ...overrides,
  };
}

export function aReference(overrides: Partial<InsertGuideReference> = {}): InsertGuideReference {
  return {
    sources: {} as InsertGuideReference['sources'],
    isoGroups: {
      P: anIsoGroup('P'),
      M: anIsoGroup('M'),
      K: anIsoGroup('K'),
      N: anIsoGroup('N'),
      S: anIsoGroup('S'),
      H: anIsoGroup('H'),
    },
    families: [anOperationFamily()],
    materials: [aMaterial()],
    recommendations: [],
    ...overrides,
  };
}
