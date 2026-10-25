import { describe, expect, it } from 'vitest';
import {
  aMaterial,
  anOperation,
  anOperationFamily,
  aReference,
} from '../testing/insert-guide-builders';
import { parseGuideSelection } from './guide-selection';

describe('parseGuideSelection', () => {
  const REFERENCE = aReference({
    materials: [
      aMaterial({ slug: 'alliage-essai-alpha' }),
      aMaterial({ slug: 'alliage-essai-beta' }),
    ],
    families: [
      anOperationFamily({
        id: 'external-turning',
        operations: [
          anOperation('external-roughing', { slug: 'operation-fictive-a' }),
          anOperation('external-finishing', { slug: 'operation-fictive-b' }),
        ],
      }),
      anOperationFamily({
        id: 'threading',
        operations: [anOperation('threading', { slug: 'operation-fictive-c' })],
      }),
    ],
  });

  it.each([
    { material: 'alliage-essai-alpha', operation: 'operation-fictive-a' },
    { material: 'alliage-essai-beta', operation: 'operation-fictive-b' },
    { material: 'alliage-essai-beta', operation: 'operation-fictive-c' },
  ])(
    'Given known slugs "$material" and "$operation" When the URL is read Then both are kept',
    ({ material, operation }) => {
      expect(parseGuideSelection(REFERENCE, material, operation)).toEqual({ material, operation });
    },
  );

  it.each([
    { label: 'absent', raw: undefined },
    { label: 'empty', raw: '' },
    { label: 'unknown', raw: 'alliage-inconnu' },
    { label: 'in another case', raw: 'Alliage-Essai-Alpha' },
    { label: 'padded with spaces', raw: ' alliage-essai-alpha ' },
    { label: 'an operation slug', raw: 'operation-fictive-a' },
  ])(
    'Given a material $label When the URL is read Then no material is selected and the operation is kept',
    ({ raw }) => {
      expect(parseGuideSelection(REFERENCE, raw, 'operation-fictive-a')).toEqual({
        material: '',
        operation: 'operation-fictive-a',
      });
    },
  );

  it.each([
    { label: 'absent', raw: undefined },
    { label: 'empty', raw: '' },
    { label: 'unknown', raw: 'operation-inconnue' },
    { label: 'in another case', raw: 'OPERATION-FICTIVE-A' },
    { label: 'padded with spaces', raw: 'operation-fictive-a ' },
    { label: 'a material slug', raw: 'alliage-essai-alpha' },
    { label: 'an operation id instead of its slug', raw: 'external-roughing' },
  ])(
    'Given an operation $label When the URL is read Then no operation is selected and the material is kept',
    ({ raw }) => {
      expect(parseGuideSelection(REFERENCE, 'alliage-essai-alpha', raw)).toEqual({
        material: 'alliage-essai-alpha',
        operation: '',
      });
    },
  );

  it('Given an empty reference When the URL names a material and an operation Then nothing is selected', () => {
    expect(
      parseGuideSelection(
        aReference({ materials: [], families: [] }),
        'alliage-essai-alpha',
        'operation-fictive-a',
      ),
    ).toEqual({ material: '', operation: '' });
  });
});
