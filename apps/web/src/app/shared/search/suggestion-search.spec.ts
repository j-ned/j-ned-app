import { distinctSuggestions, matchingSuggestions, suggestionKey } from './suggestion-search';

describe('suggestionKey', () => {
  it.each([
    ['Inox 316L', 'inox316l'],
    ['  CNMG 120408-PM ', 'cnmg120408pm'],
    ['Acier à outils', 'acieraoutils'],
    ['ÉCROU\tlaiton', 'ecroulaiton'],
  ])(
    'Given %j When its key is computed Then case, accents, spaces and dashes are ignored',
    (text, key) => {
      expect(suggestionKey(text)).toBe(key);
    },
  );
});

describe('matchingSuggestions', () => {
  const MATERIALS = ['Acier C35', 'Inox 316L', 'Aluminium 2017', 'Laiton CuZn39', 'Acier 33MnCrB5'];

  it.each<[string, readonly string[]]>([
    ['33', ['Acier 33MnCrB5']],
    ['cr', ['Acier 33MnCrB5']],
    ['a', ['Acier C35', 'Aluminium 2017', 'Acier 33MnCrB5', 'Laiton CuZn39']],
    ['inox-316', ['Inox 316L']],
    ['INOX316L', ['Inox 316L']],
    ['lAITON cuzn', ['Laiton CuZn39']],
    ['titane', []],
  ])(
    'Given known materials When %j is typed Then those starting with it come first, then those containing it, each group in the given order',
    (query, expected) => {
      expect(matchingSuggestions(MATERIALS, query)).toEqual(expected);
    },
  );

  it.each(['', '   ', ' - '])(
    'Given known materials When the query %j holds nothing to search Then every suggestion is offered, in the given order',
    (query) => {
      expect(matchingSuggestions(MATERIALS, query)).toEqual(MATERIALS);
    },
  );

  it('Given accented suggestions When the query is typed without accents Then they match', () => {
    expect(matchingSuggestions(['Écrou', 'Pièce brute', 'Fonte'], 'piece')).toEqual([
      'Pièce brute',
    ]);
  });
});

describe('distinctSuggestions', () => {
  it('Given values with blanks, duplicates and variants of spelling When they are made distinct Then each key stays once, with its first spelling trimmed, sorted in French order', () => {
    expect(
      distinctSuggestions([
        'Inox 316L',
        '  ',
        'Écrou',
        'inox 316l',
        ' Acier C35 ',
        'INOX-316L',
        'Acier C35',
        'étain',
      ]),
    ).toEqual(['Acier C35', 'Écrou', 'étain', 'Inox 316L']);
  });
});
