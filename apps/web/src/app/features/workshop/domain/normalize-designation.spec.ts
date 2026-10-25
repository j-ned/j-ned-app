import { describe, expect, it } from 'vitest';
import { normalizeDesignation } from './normalize-designation';

describe('normalizeDesignation', () => {
  it.each([
    { label: 'upper case', text: 'ZZFICTIF', expected: 'zzfictif' },
    { label: 'accents', text: 'Éprouvette fîctive ç', expected: 'eprouvettefictivec' },
    { label: 'spaces', text: '  Alliage essai  A ', expected: 'alliageessaia' },
    { label: 'no-break space', text: 'TEST 001', expected: 'test001' },
    { label: 'narrow no-break space', text: 'TEST 001', expected: 'test001' },
    { label: 'hyphen-minus', text: 'ZZ-FICTIF-1', expected: 'zzfictif1' },
    { label: 'hyphen', text: 'ZZ‐FICTIF‐1', expected: 'zzfictif1' },
    { label: 'en dash', text: 'ZZ–FICTIF–1', expected: 'zzfictif1' },
    { label: 'dots, kept', text: '9.99.01', expected: '9.99.01' },
    { label: 'everything at once', text: ' Zz – Fîctif - 1.0 ', expected: 'zzfictif1.0' },
    { label: 'blank text', text: '  - ', expected: '' },
  ])(
    'Given $label When the designation is normalized Then it gives "$expected"',
    ({ text, expected }) => {
      expect(normalizeDesignation(text)).toBe(expected);
    },
  );

  it.each(['ZZ-FICTIF-1', 'Éprouvette fîctive ç', 'TEST 001', ' Zz – Fîctif - 1.0 ', '9.99.01'])(
    'Given "%s" When it is normalized twice Then the second pass changes nothing',
    (text) => {
      const once = normalizeDesignation(text);
      expect(normalizeDesignation(once)).toBe(once);
    },
  );
});
