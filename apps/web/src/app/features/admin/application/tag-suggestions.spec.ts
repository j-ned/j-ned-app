import { describe, it, expect } from 'vitest';
import { knownTags, matchingTags } from './tag-suggestions';

describe('knownTags', () => {
  it('Given a catalogue and the tags of the articles When they are merged Then each tag appears once, in alphabetical order', () => {
    expect(
      knownTags(
        ['RxJS', 'Angular', 'Sécurité'],
        [['Playwright', 'angular'], ['Freelance', 'Aéronautique'], []],
      ),
    ).toEqual(['Aéronautique', 'Angular', 'Freelance', 'Playwright', 'RxJS', 'Sécurité']);
  });

  it('Given a used tag spelt differently from the catalogue When they are merged Then the catalogue spelling wins', () => {
    expect(knownTags(['Angular'], [['ANGULAR']])).toEqual(['Angular']);
  });
});

describe('matchingTags', () => {
  const KNOWN = ['Aéronautique', 'Angular', 'Cryptographie', 'Sécurité', 'Sécurité web', 'Tests'];

  it.each([
    { query: '', selected: [], expected: KNOWN },
    {
      query: '  ',
      selected: ['Angular'],
      expected: ['Aéronautique', 'Cryptographie', 'Sécurité', 'Sécurité web', 'Tests'],
    },
    { query: 'secu', selected: [], expected: ['Sécurité', 'Sécurité web'] },
    { query: 'SÉCU', selected: ['sécurité'], expected: ['Sécurité web'] },
    { query: 'graph', selected: [], expected: ['Cryptographie'] },
    { query: 'a', selected: [], expected: ['Aéronautique', 'Angular', 'Cryptographie'] },
    { query: 'Playwright', selected: [], expected: [] },
    { query: 'te', selected: [], expected: ['Tests', 'Sécurité', 'Sécurité web'] },
  ])(
    'Given the query "$query" and the selection $selected Then $expected is suggested, prefix matches first',
    ({ query, selected, expected }) => {
      expect(matchingTags(KNOWN, selected, query)).toEqual(expected);
    },
  );
});
