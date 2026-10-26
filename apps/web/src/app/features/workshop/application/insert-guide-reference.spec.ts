import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { ISO_513_GROUPS } from '../domain/iso-groups.static-data';
import { MATERIALS } from '../domain/materials.static-data';
import { OPERATION_FAMILIES } from '../domain/operations.static-data';
import { RECOMMENDATIONS } from '../domain/recommendations.static-data';
import { SOURCES } from '../domain/sources.static-data';
import { INSERT_GUIDE_REFERENCE } from './insert-guide-reference';

describe('INSERT_GUIDE_REFERENCE', () => {
  it('Given no provider When the token is injected Then it hands over the real reference constants', () => {
    const reference = TestBed.inject(INSERT_GUIDE_REFERENCE);

    expect(reference).toStrictEqual({
      sources: SOURCES,
      isoGroups: ISO_513_GROUPS,
      families: OPERATION_FAMILIES,
      materials: MATERIALS,
      recommendations: RECOMMENDATIONS,
    });
    expect([
      reference.sources === SOURCES,
      reference.isoGroups === ISO_513_GROUPS,
      reference.families === OPERATION_FAMILIES,
      reference.materials === MATERIALS,
      reference.recommendations === RECOMMENDATIONS,
    ]).toEqual([true, true, true, true, true]);
  });
});
