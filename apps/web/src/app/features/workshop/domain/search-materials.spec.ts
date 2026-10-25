import { describe, expect, it } from 'vitest';
import { aDesignation, aMaterial } from '../testing/insert-guide-builders';
import type { DesignationSystem } from './models/material.model';
import { searchMaterials } from './search-materials';

describe('searchMaterials', () => {
  describe('Given a material known under one designation per system', () => {
    const ALPHA = aMaterial({
      slug: 'alliage-essai-alpha',
      designations: [
        aDesignation('Alliage essai Alpha', 'common-name'),
        aDesignation('ZZ-FICTIF-1', 'en-symbol'),
        aDesignation('9.9901', 'material-number'),
        aDesignation('ESSAI 101', 'aisi'),
        aDesignation('Q99901', 'uns'),
        aDesignation('Z FICT 01', 'afnor-legacy'),
      ],
    });
    const BETA = aMaterial({
      slug: 'alliage-essai-beta',
      designations: [aDesignation('Alliage essai Beta'), aDesignation('YY-FICTIF-2', 'en-symbol')],
    });

    it.each<{ system: DesignationSystem; query: string }>([
      { system: 'common-name', query: 'alliage essai alpha' },
      { system: 'en-symbol', query: 'zz fictif 1' },
      { system: 'material-number', query: '9.9901' },
      { system: 'aisi', query: 'Essai-101' },
      { system: 'uns', query: 'q 99901' },
      { system: 'afnor-legacy', query: 'ZFICT01' },
    ])(
      'When "$query" is typed Then the material is suggested once, found by its $system designation',
      ({ system, query }) => {
        const matched = ALPHA.designations.find((designation) => designation.system === system);

        expect(searchMaterials([BETA, ALPHA], query)).toEqual([{ material: ALPHA, matched }]);
      },
    );

    it('When the query matches several of its designations Then it is suggested only once', () => {
      expect(searchMaterials([ALPHA], 'fict')).toEqual([
        { material: ALPHA, matched: ALPHA.designations[1] },
      ]);
    });

    it('When the query matches no designation Then nothing is suggested', () => {
      expect(searchMaterials([BETA, ALPHA], 'introuvable')).toEqual([]);
    });
  });

  describe('Given materials whose designations start with or contain the query', () => {
    const CONTAINING = aMaterial({
      slug: 'bloc-contenant',
      designations: [aDesignation('Bloc contenant'), aDesignation('XA-TEST-7', 'en-symbol')],
    });
    const LATE_PREFIX = aMaterial({
      slug: 'bloc-neuf',
      designations: [aDesignation('Bloc neuf'), aDesignation('TEST-009', 'en-symbol')],
    });
    const UNRELATED = aMaterial({
      slug: 'bloc-hors-sujet',
      designations: [aDesignation('Bloc hors sujet'), aDesignation('WW-FICTIF-4', 'en-symbol')],
    });
    const EARLY_NUMBER = aMaterial({
      slug: 'bloc-deux',
      designations: [aDesignation('Bloc deux'), aDesignation('TEST-002', 'en-symbol')],
    });
    const BOTH = aMaterial({
      slug: 'bloc-double',
      designations: [
        aDesignation('Bloc double'),
        aDesignation('XB-TEST-5', 'en-symbol'),
        aDesignation('TEST-005', 'aisi'),
      ],
    });
    const TWICE_CONTAINING = aMaterial({
      slug: 'bloc-triple',
      designations: [
        aDesignation('Bloc triple'),
        aDesignation('XC-TEST-6', 'en-symbol'),
        aDesignation('XD-TEST-6', 'aisi'),
      ],
    });
    const REFERENCE = [CONTAINING, LATE_PREFIX, UNRELATED, TWICE_CONTAINING, EARLY_NUMBER, BOTH];

    it('When the query is typed Then prefix matches come first, then containing ones, each group in reference order', () => {
      expect(searchMaterials(REFERENCE, 'test')).toEqual([
        { material: LATE_PREFIX, matched: LATE_PREFIX.designations[1] },
        { material: EARLY_NUMBER, matched: EARLY_NUMBER.designations[1] },
        { material: BOTH, matched: BOTH.designations[2] },
        { material: CONTAINING, matched: CONTAINING.designations[1] },
        { material: TWICE_CONTAINING, matched: TWICE_CONTAINING.designations[1] },
      ]);
    });

    it('When the query is typed with accents, case and dashes Then it matches like the plain query', () => {
      expect(searchMaterials(REFERENCE, 'BLÔC-D')).toEqual([
        { material: EARLY_NUMBER, matched: EARLY_NUMBER.designations[0] },
        { material: BOTH, matched: BOTH.designations[0] },
      ]);
    });

    it.each(['', '   ', ' ', ' - '])(
      'When the query "%s" is blank Then every material is suggested in reference order, under its displayed name',
      (query) => {
        expect(searchMaterials(REFERENCE, query)).toEqual(
          REFERENCE.map((material) => ({ material, matched: material.designations[0] })),
        );
      },
    );
  });

  it('Given an empty reference When anything is typed Then nothing is suggested', () => {
    expect(searchMaterials([], 'test')).toEqual([]);
  });
});
