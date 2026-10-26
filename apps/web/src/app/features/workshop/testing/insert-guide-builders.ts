import type {
  Designation,
  DesignationSystem,
  IsoGroup,
  IsoGroupLetter,
  Material,
} from '../domain/models/material.model';
import type { InsertGuideReference } from '../domain/models/insert-guide-reference.model';
import type { Operation, OperationFamily, OperationId } from '../domain/models/operation.model';
import type {
  DescribedInsert,
  InsertFor,
  InsertSituation,
  IsoInsertDesignation,
  IsoInsertProposal,
  RecommendationEntry,
} from '../domain/models/recommendation.model';
import type { Source, SourceCitation, SourceId, Sourced } from '../domain/models/source.model';

// A fictional id stays assignable whatever the real closed union lists.
const FICTIONAL_SOURCE_ID = 'source-fictive' as string as SourceId;

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
    basis: 'stated',
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
    subgroup: 'non-alloyed-steel',
    behaviour: [aSourced('Comportement fictif à la coupe.')],
    ...overrides,
  };
}

export function anIsoGroup(letter: IsoGroupLetter, overrides: Partial<IsoGroup> = {}): IsoGroup {
  return {
    letter,
    name: aSourced(`Groupe fictif ${letter}`),
    ...overrides,
  };
}

export function anIsoGroupCatalogue(): InsertGuideReference['isoGroups'] {
  return {
    P: anIsoGroup('P'),
    M: anIsoGroup('M'),
    K: anIsoGroup('K'),
    N: anIsoGroup('N'),
    S: anIsoGroup('S'),
    H: anIsoGroup('H'),
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

export function anIsoInsertField(
  field: string,
  code: string,
  meaning: string,
  cite: SourceCitation = aCitation(),
): IsoInsertProposal['fields'][number] {
  return { value: { field, code, meaning }, cite };
}

export function anIsoInsertProposal<S extends InsertSituation = 'external-shoulder'>(
  overrides: Partial<IsoInsertProposal<S>> = {},
): IsoInsertProposal<S> {
  return {
    situation: 'external-shoulder' as S,
    choice: [aCitation()],
    fields: [aSourced({ field: 'Champ fictif', code: 'Z', meaning: 'Signification fictive' })],
    ...overrides,
  };
}

export function anIsoInsert<S extends InsertSituation = 'external-shoulder'>(
  ...proposals: readonly IsoInsertProposal<S>[]
): IsoInsertDesignation<S> {
  const [first = anIsoInsertProposal<S>(), ...others] = proposals;
  return { kind: 'iso-1832', proposals: [first, ...others] };
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
  const insert = operation.startsWith('internal-')
    ? anIsoInsert(anIsoInsertProposal({ situation: 'internal-shoulder' }))
    : ISO_DESIGNATED_OPERATION.test(operation)
      ? anIsoInsert()
      : aDescribedInsert();
  return {
    operation,
    materials: ['matiere-fictive'],
    insert: insert as InsertFor<O>,
    geometry: [aSourced('Géométrie fictive.')],
    grade: aSourced('Nuance fictive.'),
    pitfalls: [aSourced('Piège fictif.')],
    ...overrides,
  };
}

export function aReference(overrides: Partial<InsertGuideReference> = {}): InsertGuideReference {
  return {
    sources: { [FICTIONAL_SOURCE_ID]: aSource() } as InsertGuideReference['sources'],
    isoGroups: anIsoGroupCatalogue(),
    families: [anOperationFamily()],
    materials: [aMaterial()],
    recommendations: [],
    ...overrides,
  };
}

export function aMaterialCatalogue(): readonly [Material, Material, Material] {
  return [
    aMaterial({
      slug: 'alliage-essai-alpha',
      designations: [
        aDesignation('Alliage essai Alpha'),
        aDesignation('ZZ-FICTIF-1', 'en-symbol'),
        aDesignation('TEST-001', 'aisi'),
      ],
      isoGroup: aSourced('P'),
      behaviour: [aSourced('Comportement fictif Alpha.'), aSourced('Second trait fictif Alpha.')],
    }),
    aMaterial({
      slug: 'alliage-essai-beta',
      designations: [aDesignation('Alliage essai Bêta'), aDesignation('ZZ-FICTIF-2', 'en-symbol')],
      isoGroup: aSourced('M'),
      behaviour: [aSourced('Comportement fictif Bêta.')],
    }),
    aMaterial({
      slug: 'alliage-essai-gamma',
      designations: [
        aDesignation('Alliage essai Gamma'),
        aDesignation('TEST-002', 'material-number'),
      ],
      isoGroup: aSourced('K'),
      behaviour: [aSourced('Comportement fictif Gamma.')],
    }),
  ];
}
