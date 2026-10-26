import { describe, expect, it } from 'vitest';
import { findConfidentialReferences } from './confidential-references';

describe('findConfidentialReferences', () => {
  it.each<[string, string]>([
    ['a part number written P/N', 'P/N 4521-07'],
    ['a part number written PN:', 'PN: 88-123'],
    ['a part reference', 'réf. pièce'],
    ['a drawing reference', 'réf. plan'],
    ['a customer reference', 'réf. client'],
    ['a drawing number', 'plan n° 12'],
    ['a drawing number written the other way', 'n° de plan'],
    ['a drawing number opening a sentence', 'Plan n° 12 repris.'],
    ['a drawing number written the other way, opening a sentence', 'N° de plan à part.'],
    ['a work order number', 'OF n° 3'],
    ['a revision letter', 'indice C'],
    ['a revision digit', 'indice 3'],
    ['a long number behind a letter', 'D23456789'],
    ['exactly five digits', '12345'],
    ['a reference inside a sentence', 'Cote reprise du plan n° 12 avant contrôle.'],
  ])('Given %s When the text is read Then one reference is flagged', (_, text) => {
    const found = findConfidentialReferences(text);

    expect(found).toHaveLength(1);
    expect(found[0].trim()).not.toBe('');
    expect(text).toContain(found[0]);
  });

  it.each<[string, string]>([
    ['a quality standard', 'AS9100'],
    ['a European quality standard', 'EN 9100'],
    ['a tolerance standard', 'ISO 2768'],
    ['a nickel alloy', 'Inconel 718'],
    ['a titanium alloy', 'Ti-6Al-4V'],
    ['an aluminium alloy and temper', '7075-T6'],
    ['a dimension with its tolerance', 'Ø20 ±0,02'],
    ['a G-code cycle', 'G71'],
    ['an M-code', 'M30'],
    ['a spindle speed with a narrow no-break space', '10 000 tr/min'],
    ['four digits', '1234'],
    ['the word indice followed by a word', "L'indice de rugosité dépend de l'avance."],
    ['an empty text', ''],
  ])('Given %s When the text is read Then nothing is flagged', (_, text) => {
    expect(findConfidentialReferences(text)).toEqual([]);
  });

  it('Given two references in one text When it is read Then both are flagged in order', () => {
    const text = 'Voir P/N 4521-07, puis OF n° 3.';

    const found = findConfidentialReferences(text);

    expect(found).toHaveLength(2);
    expect(found.filter((fragment) => fragment.trim() === '' || !text.includes(fragment))).toEqual(
      [],
    );
    expect(text.indexOf(found[0])).toBeLessThan(text.indexOf(found[1]));
  });
});
