import { describe, expect, it } from 'vitest';
import {
  aDesignation,
  aMaterial,
  anOperation,
  anOperationFamily,
  aRecommendation,
  aReference,
  aSourced,
} from '../testing/insert-guide-builders';
import { findRecommendation, resolveGuideState } from './find-recommendation';

const ALPHA = aMaterial({
  slug: 'alliage-essai-alpha',
  designations: [aDesignation('Alliage essai Alpha')],
  isoGroup: aSourced('P'),
});
const BETA = aMaterial({
  slug: 'alliage-essai-beta',
  designations: [aDesignation('Alliage essai Beta')],
  isoGroup: aSourced('P'),
});
const GAMMA = aMaterial({
  slug: 'alliage-essai-gamma',
  designations: [aDesignation('Alliage essai Gamma')],
  isoGroup: aSourced('S'),
});

const FINISHING = anOperation('external-finishing', { slug: 'operation-fictive-a' });
const GROOVING = anOperation('grooving', { slug: 'operation-fictive-b' });

const ALPHA_FINISHING = aRecommendation('external-finishing', {
  materials: ['alliage-essai-alpha'],
  geometry: aSourced('Géométrie fictive Alpha.'),
});
const ALPHA_GAMMA_GROOVING = aRecommendation('grooving', {
  materials: ['alliage-essai-alpha', 'alliage-essai-gamma'],
});
const GAMMA_FINISHING = aRecommendation('external-finishing', {
  materials: ['alliage-essai-gamma'],
  geometry: aSourced('Géométrie fictive Gamma.'),
});
const RECOMMENDATIONS = [ALPHA_FINISHING, ALPHA_GAMMA_GROOVING, GAMMA_FINISHING];

describe('findRecommendation', () => {
  it.each([
    {
      label: 'Alpha in finishing',
      material: 'alliage-essai-alpha',
      operation: 'external-finishing',
      expected: ALPHA_FINISHING,
    },
    {
      label: 'Gamma in finishing',
      material: 'alliage-essai-gamma',
      operation: 'external-finishing',
      expected: GAMMA_FINISHING,
    },
    {
      label: 'Alpha in grooving',
      material: 'alliage-essai-alpha',
      operation: 'grooving',
      expected: ALPHA_GAMMA_GROOVING,
    },
    {
      label: 'Gamma in grooving',
      material: 'alliage-essai-gamma',
      operation: 'grooving',
      expected: ALPHA_GAMMA_GROOVING,
    },
  ] as const)(
    'Given entries that name their materials When $label is looked up Then the entry naming that couple is returned',
    ({ material, operation, expected }) => {
      expect(findRecommendation(RECOMMENDATIONS, material, operation)).toBe(expected);
    },
  );

  it.each([
    {
      label: 'a covered material in an operation without entry',
      material: 'alliage-essai-alpha',
      operation: 'threading',
    },
    {
      label: 'a material no entry names',
      material: 'alliage-inconnu',
      operation: 'external-finishing',
    },
    {
      label: 'a material of the same ISO group as a covered one',
      material: 'alliage-essai-beta',
      operation: 'external-finishing',
    },
    { label: 'an empty material', material: '', operation: 'grooving' },
  ] as const)(
    'Given entries that name their materials When $label is looked up Then there is no recommendation',
    ({ material, operation }) => {
      expect(findRecommendation(RECOMMENDATIONS, material, operation)).toBeUndefined();
    },
  );

  it('Given no entry When a couple is looked up Then there is no recommendation', () => {
    expect(findRecommendation([], 'alliage-essai-alpha', 'external-finishing')).toBeUndefined();
  });
});

describe('resolveGuideState', () => {
  const REFERENCE = aReference({
    materials: [ALPHA, BETA, GAMMA],
    families: [
      anOperationFamily({ id: 'external-turning', operations: [FINISHING] }),
      anOperationFamily({ id: 'grooving-parting', operations: [GROOVING] }),
    ],
    recommendations: RECOMMENDATIONS,
  });

  it.each([
    { label: 'nothing is selected', material: '', operation: '' },
    { label: 'only the material is selected', material: 'alliage-essai-alpha', operation: '' },
    { label: 'only the operation is selected', material: '', operation: 'operation-fictive-a' },
    {
      label: 'the material is not in the reference',
      material: 'alliage-inconnu',
      operation: 'operation-fictive-a',
    },
    {
      label: 'the operation is not in the reference',
      material: 'alliage-essai-alpha',
      operation: 'operation-inconnue',
    },
  ])(
    'Given $label When the guide state is resolved Then it is incomplete',
    ({ material, operation }) => {
      expect(resolveGuideState(REFERENCE, { material, operation })).toEqual({
        status: 'incomplete',
      });
    },
  );

  it('Given a material and an operation without entry When the guide state is resolved Then it says no recommendation is available', () => {
    expect(
      resolveGuideState(REFERENCE, {
        material: 'alliage-essai-beta',
        operation: 'operation-fictive-b',
      }),
    ).toEqual({ status: 'unavailable', material: BETA, operation: GROOVING });
  });

  it('Given a reference without any entry When a known couple is resolved Then no recommendation is available', () => {
    expect(
      resolveGuideState(aReference({ ...REFERENCE, recommendations: [] }), {
        material: 'alliage-essai-alpha',
        operation: 'operation-fictive-a',
      }),
    ).toEqual({ status: 'unavailable', material: ALPHA, operation: FINISHING });
  });

  it('Given a material of the same ISO group as a covered one When the guide state is resolved Then nothing is borrowed from its neighbour', () => {
    expect(
      resolveGuideState(REFERENCE, {
        material: 'alliage-essai-beta',
        operation: 'operation-fictive-a',
      }),
    ).toEqual({ status: 'unavailable', material: BETA, operation: FINISHING });
  });

  it.each([
    {
      label: 'Alpha in finishing',
      material: 'alliage-essai-alpha',
      operation: 'operation-fictive-a',
      expected: { material: ALPHA, operation: FINISHING, entry: ALPHA_FINISHING },
    },
    {
      label: 'Gamma in finishing',
      material: 'alliage-essai-gamma',
      operation: 'operation-fictive-a',
      expected: { material: GAMMA, operation: FINISHING, entry: GAMMA_FINISHING },
    },
    {
      label: 'Alpha in grooving',
      material: 'alliage-essai-alpha',
      operation: 'operation-fictive-b',
      expected: { material: ALPHA, operation: GROOVING, entry: ALPHA_GAMMA_GROOVING },
    },
  ])(
    'Given $label When the guide state is resolved Then the entry is available with the material and the operation',
    ({ material, operation, expected }) => {
      expect(resolveGuideState(REFERENCE, { material, operation })).toEqual({
        status: 'available',
        ...expected,
      });
    },
  );
});
