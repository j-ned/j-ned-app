import { describe, expect, it } from 'vitest';
import { INSERT_GUIDE_COPY } from '@features/workshop/application/insert-guide-copy';
import { findConfidentialReferences } from '@features/workshop/domain/confidential-references';
import { ISO_513_GROUPS } from '@features/workshop/domain/iso-groups.static-data';
import { MATERIALS } from '@features/workshop/domain/materials.static-data';
import { OPERATION_FAMILIES } from '@features/workshop/domain/operations.static-data';
import { RECOMMENDATIONS } from '@features/workshop/domain/recommendations.static-data';
import { WORKSHOP_SPACE } from '@features/workshop/domain/workshop-space.static-data';
import {
  aCitation,
  aDesignation,
  aMaterial,
  anIsoInsert,
  anIsoInsertProposal,
  anOperation,
  anOperationFamily,
  aRecommendation,
  aSourced,
} from '@features/workshop/testing/insert-guide-builders';
import { editorialTexts, ROUTE_TEXTS } from './testing/editorial-sources';

// A designation value is checked by its format: a UNS number has five digits.
const DESIGNATION_VALUE = /\.designations\[\d+\]\.value$/u;

const confidentialPaths = (value: unknown, name: string): readonly string[] =>
  editorialTexts(value, name)
    .filter(({ path }) => !DESIGNATION_VALUE.test(path))
    .filter(({ text }) => findConfidentialReferences(text).length > 0)
    .map(({ path }) => path);

describe('workshop confidentiality', () => {
  it.each<[string, unknown]>([
    ['WORKSHOP_SPACE', WORKSHOP_SPACE],
    ['ISO_513_GROUPS', ISO_513_GROUPS],
    ['MATERIALS', MATERIALS],
    ['OPERATION_FAMILIES', OPERATION_FAMILIES],
    ['RECOMMENDATIONS', RECOMMENDATIONS],
    ['the /atelier route', ROUTE_TEXTS['/atelier']],
    ['INSERT_GUIDE_COPY', INSERT_GUIDE_COPY],
    ['the /atelier/plaquettes route', ROUTE_TEXTS['/atelier/plaquettes']],
  ])('Given %s When its texts are read Then none carries a part reference', (name, value) => {
    expect(confidentialPaths(value, name)).toEqual([]);
  });

  describe('Given fictional content', () => {
    it.each<[string, unknown, readonly string[]]>([
      [
        'an intro paragraph',
        { heading: 'Espace fictif', intro: ['Paragraphe fictif.', 'Repris du plan n° 12.'] },
        ['sample.intro[1]'],
      ],
      [
        'a material behaviour',
        aMaterial({ behaviour: [aSourced('Se reprend comme la P/N 4521-07.')] }),
        ['sample.behaviour[0].value'],
      ],
      [
        'the locator of a designation',
        aMaterial({
          designations: [
            { ...aDesignation('Matière fictive'), cite: aCitation({ locator: 'OF n° 3' }) },
          ],
        }),
        ['sample.designations[0].cite.locator'],
      ],
      [
        'a geometry',
        aRecommendation('grooving', { geometry: [aSourced('Arête fictive, réf. pièce à part.')] }),
        ['sample.geometry[0].value'],
      ],
      [
        'a grade',
        aRecommendation('grooving', { grade: aSourced('Nuance fictive, indice C.') }),
        ['sample.grade.value'],
      ],
      [
        'a pitfall',
        aRecommendation('grooving', {
          pitfalls: [aSourced('Piège fictif.'), aSourced('Vu sur le D23456789.')],
        }),
        ['sample.pitfalls[1].value'],
      ],
      [
        'a described aspect',
        aRecommendation('parting-off', {
          insert: {
            kind: 'described',
            aspects: [aSourced({ aspect: 'profile', text: 'Profil fictif, n° de plan à part.' })],
          },
        }),
        ['sample.insert.aspects[0].value.text'],
      ],
      [
        'the meaning of an ISO field',
        aRecommendation('external-finishing', {
          insert: anIsoInsert(
            anIsoInsertProposal({
              fields: [
                aSourced({ field: 'Champ fictif', code: 'Z', meaning: 'Repris de PN: 88-123.' }),
              ],
            }),
          ),
        }),
        ['sample.insert.proposals[0].fields[0].value.meaning'],
      ],
      [
        'the locator of a citation',
        aRecommendation('grooving', {
          geometry: [{ value: 'Géométrie fictive.', cite: aCitation({ locator: 'réf. client' }) }],
        }),
        ['sample.geometry[0].cite.locator'],
      ],
      [
        'an operation family label',
        anOperationFamily({ label: 'Famille fictive OF n° 3' }),
        ['sample.label'],
      ],
      [
        'an operation label',
        anOperationFamily({
          operations: [anOperation('external-finishing', { label: 'Finition P/N 4521-07' })],
        }),
        ['sample.operations[0].label'],
      ],
    ])('When %s carries a part reference Then its path is flagged', (_, value, paths) => {
      expect(confidentialPaths(value, 'sample')).toEqual(paths);
    });

    it('When a five-digit designation value is read Then it is not flagged', () => {
      const material = aMaterial({
        designations: [aDesignation('Matière fictive'), aDesignation('X99999', 'uns')],
      });

      expect(confidentialPaths(material, 'sample')).toEqual([]);
    });
  });
});
