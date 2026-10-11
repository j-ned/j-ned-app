import { FORBIDDEN_WORDINGS } from './forbidden-wordings';

const found = (text: string): readonly string[] =>
  FORBIDDEN_WORDINGS.filter(({ pattern }) => text.search(pattern) !== -1).map(({ label }) => label);

describe('FORBIDDEN_WORDINGS', () => {
  it('Given the editorial rule When the list is read Then it names the three wordings in order', () => {
    expect(FORBIDDEN_WORDINGS.map(({ label }) => label)).toEqual([
      '20 ans',
      'vingt ans',
      'métallurgie',
    ]);
  });

  it.each([
    { text: 'Plus de 20 ans de métier', expected: ['20 ans'] },
    { text: 'Plus de 20\u00a0ans de métier', expected: ['20 ans'] },
    { text: 'Depuis vingt ans', expected: ['vingt ans'] },
    { text: 'Vingt\u202fans en atelier', expected: ['vingt ans'] },
    { text: 'Issu de la métallurgie', expected: ['métallurgie'] },
    { text: 'Métallurgie et usinage', expected: ['métallurgie'] },
    { text: 'La métallurgie, 20 ans durant', expected: ['20 ans', 'métallurgie'] },
  ])('Given $text When it is checked Then $expected is found', ({ text, expected }) => {
    expect(found(text)).toEqual(expected);
  });

  it.each(['Issu de la metallurgie', 'Issu de la Métallurgie', 'ISSU DE LA METALLURGIE'])(
    'Given %j, accented or not When it is checked Then « métallurgie » is found',
    (text) => {
      expect(found(text)).toEqual(['métallurgie']);
    },
  );

  it.each(['Diplômé en 2020', 'Après 20 années', 'Le métal se travaille'])(
    'Given %j When it is checked against the three wordings Then none is found',
    (text) => {
      expect({ wordings: FORBIDDEN_WORDINGS.length, found: found(text) }).toEqual({
        wordings: 3,
        found: [],
      });
    },
  );
});
