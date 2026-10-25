import { describe, expectTypeOf, it } from 'vitest';
import {
  aCitation,
  aDescribedInsert,
  aDesignation,
  aMaterial,
  anIsoGroup,
  anIsoInsert,
  anOperation,
  anOperationFamily,
  aRecommendation,
  aSource,
  aSourced,
} from '../testing/insert-guide-builders';
import type { IsoGroup, Material } from './models/material.model';
import type { Operation, OperationFamily } from './models/operation.model';
import type {
  DescribedInsert,
  GuideState,
  InsertFor,
  IsoInsertDesignation,
  RecommendationEntry,
} from './models/recommendation.model';
import type { Source, SourceCitation, SourceId, Sourced } from './models/source.model';
import { RECOMMENDATIONS } from './recommendations.static-data';
import { SOURCES } from './sources.static-data';

describe('Source types', () => {
  it('Given the catalogue When its type is read Then every source id needs its entry', () => {
    expectTypeOf(SOURCES).toEqualTypeOf<Readonly<Record<SourceId, Source>>>();
  });

  it('Given a sourced value When the citation is missing Then it does not compile', () => {
    // @ts-expect-error: a displayed value always carries its citation
    const _refused: Sourced<string> = { value: 'Texte fictif' };
  });

  it('Given a citation When its source is outside the catalogue Then it does not compile', () => {
    // @ts-expect-error: a citation only points to a catalogued source
    const _refused = aCitation({ source: 'source-hors-catalogue' });
  });

  it('Given a citation When the locator is missing Then it does not compile', () => {
    // @ts-expect-error: a citation says where in the source the value is found
    const _refused: SourceCitation = { source: aCitation().source };
  });

  it('Given a source When its URL is not https Then it does not compile', () => {
    // @ts-expect-error: a source URL is always https
    const _refused: Source = { ...aSource(), url: 'http://exemple.invalid/document-fictif' };
  });

  it('Given a source When the consultation date is missing Then it does not compile', () => {
    const { consultedOn: _dropped, ...undated } = aSource();
    // @ts-expect-error: a source records when it was consulted
    const _refused: Source = undated;
  });

  it('Given a source When the publisher is missing Then it does not compile', () => {
    const { publisher: _dropped, ...anonymous } = aSource();
    // @ts-expect-error: a source names its publisher
    const _refused: Source = anonymous;
  });
});

describe('ISO group types', () => {
  it('Given an ISO group When its letter is outside the six groups Then it does not compile', () => {
    // @ts-expect-error: ISO 513 only defines P, M, K, N, S and H
    const _refused: IsoGroup = { ...anIsoGroup('P'), letter: 'X' };
  });

  it('Given an ISO group When its name is not sourced Then it does not compile', () => {
    // @ts-expect-error: the group name comes from a cited source
    const _refused: IsoGroup = { ...anIsoGroup('M'), name: 'Groupe fictif' };
  });

  it('Given an ISO group When its colour is outside the closed union Then it does not compile', () => {
    // @ts-expect-error: only the colours the standard assigns are accepted
    const _refused: IsoGroup = { ...anIsoGroup('K'), color: aSourced('couleur-hors-norme') };
  });

  it('Given an ISO group When its colour is not sourced Then it does not compile', () => {
    // @ts-expect-error: the group colour comes from a cited source
    const _refused: IsoGroup = { ...anIsoGroup('N'), color: 'couleur-fictive' };
  });
});

describe('Material types', () => {
  it('Given a material When it has no designation Then it does not compile', () => {
    // @ts-expect-error: a material is displayed under at least one designation
    const _refused: Material = aMaterial({ designations: [] });
  });

  it('Given a material When it has no cutting behaviour Then it does not compile', () => {
    // @ts-expect-error: a material always describes how it cuts
    const _refused: Material = aMaterial({ behaviour: [] });
  });

  it('Given a material When its ISO group is outside the six letters Then it does not compile', () => {
    // @ts-expect-error: the ISO group is one of the six letters
    const _refused: Material = aMaterial({ isoGroup: aSourced('X') });
  });

  it('Given a material When its ISO group is not sourced Then it does not compile', () => {
    // @ts-expect-error: the ISO group comes from a cited source
    const _refused: Material = aMaterial({ isoGroup: 'P' });
  });

  it('Given a material When a designation is not sourced Then it does not compile', () => {
    const unsourced = { value: 'ZZ-FICTIF-9', system: 'aisi' } as const;
    // @ts-expect-error: every designation comes from a cited source
    const _refused: Material = aMaterial({ designations: [unsourced] });
  });

  it('Given a designation When its system is unknown Then it does not compile', () => {
    // @ts-expect-error: the designation systems form a closed list
    const _refused = aDesignation('ZZ-FICTIF-9', 'systeme-inconnu');
  });

  it('Given a material When a behaviour line is not sourced Then it does not compile', () => {
    // @ts-expect-error: every behaviour line comes from a cited source
    const _refused: Material = aMaterial({ behaviour: ['Comportement fictif.'] });
  });
});

describe('Operation types', () => {
  it('Given an operation When its id is unknown Then it does not compile', () => {
    // @ts-expect-error: the guide only knows the operations of its families
    const _refused: Operation = { ...anOperation('threading'), id: 'milling' };
  });

  it('Given a family When it has no operation Then it does not compile', () => {
    // @ts-expect-error: a family always offers at least one operation
    const _refused: OperationFamily = anOperationFamily({ operations: [] });
  });

  it('Given a family When its id is unknown Then it does not compile', () => {
    // @ts-expect-error: the families form a closed list
    const _refused: OperationFamily = { ...anOperationFamily(), id: 'milling' };
  });
});

describe('Recommendation types', () => {
  it('Given the reference When its recommendations are read Then each one is checked against the model', () => {
    expectTypeOf(RECOMMENDATIONS).toEqualTypeOf<readonly RecommendationEntry[]>();
  });

  it('Given an external or internal turning operation When its insert type is read Then it is an ISO 1832 designation', () => {
    expectTypeOf<
      InsertFor<
        | 'external-roughing'
        | 'external-semi-finishing'
        | 'external-finishing'
        | 'internal-roughing'
        | 'internal-finishing'
      >
    >().toEqualTypeOf<IsoInsertDesignation>();
  });

  it('Given a grooving, parting, threading or drilling operation When its insert type is read Then it is a described insert', () => {
    expectTypeOf<
      InsertFor<'grooving' | 'parting-off' | 'threading' | 'insert-drilling'>
    >().toEqualTypeOf<DescribedInsert>();
  });

  it('Given a grooving entry When its insert is an ISO designation Then it does not compile', () => {
    // @ts-expect-error: grooving inserts do not follow the ISO 1832 designation
    const _refused: RecommendationEntry = { ...aRecommendation('grooving'), insert: anIsoInsert() };
  });

  it('Given an external finishing entry When its insert is described Then it does not compile', () => {
    const described = { ...aRecommendation('external-finishing'), insert: aDescribedInsert() };
    // @ts-expect-error: external turning inserts are given by their ISO 1832 designation
    const _refused: RecommendationEntry = described;
  });

  it('Given an entry When it names no material Then it does not compile', () => {
    // @ts-expect-error: an entry lists explicitly the materials it covers
    const _refused: RecommendationEntry = { ...aRecommendation('threading'), materials: [] };
  });

  it('Given an entry When its operation is unknown Then it does not compile', () => {
    // @ts-expect-error: an entry is for one of the operations of the guide
    const _refused: RecommendationEntry = { ...aRecommendation('threading'), operation: 'milling' };
  });

  it('Given an entry When its geometry is not sourced Then it does not compile', () => {
    const unsourced = { ...aRecommendation('parting-off'), geometry: 'Géométrie fictive.' };
    // @ts-expect-error: the geometry comes from a cited source
    const _refused: RecommendationEntry = unsourced;
  });

  it('Given an entry When its cutting speed is in another unit Then it does not compile', () => {
    const inRevolutions = {
      ...aRecommendation('external-roughing'),
      cuttingSpeed: aSourced({ min: 1, max: 2, unit: 'tr/min' }),
    };
    // @ts-expect-error: a cutting speed is given in metres per minute
    const _refused: RecommendationEntry = inRevolutions;
  });

  it('Given an available guide state When its entry is missing Then it does not compile', () => {
    // @ts-expect-error: an available state always carries the entry it shows
    const _refused: GuideState = {
      status: 'available',
      material: aMaterial(),
      operation: anOperation('threading'),
    };
  });
});
