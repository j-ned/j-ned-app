import { WHITESPACE_CLASS, countWords } from './word-count';

describe('countWords', () => {
  it.each([
    { label: 'texte vide', text: '', words: 0 },
    { label: 'un mot', text: 'mot', words: 1 },
    { label: 'trois mots', text: 'un deux trois', words: 3 },
  ])('Given $label When on compte Then $words mot(s)', ({ text, words }) => {
    expect(countWords(text)).toBe(words);
  });

  it('Given des sauts de ligne et espaces multiples When on compte Then seuls les mots comptent', () => {
    expect(countWords('  ## Titre\n\nun   deux\n\n  ')).toBe(4);
  });
});

describe('WHITESPACE_CLASS', () => {
  it('Given every code point of the basic plane, When matched by the class shared with Postgres, Then it agrees with \\s', () => {
    const shared = new RegExp(`^[${WHITESPACE_CLASS}]$`);
    const disagreements: number[] = [];
    for (let code = 0; code <= 0xffff; code += 1) {
      const char = String.fromCharCode(code);
      if (shared.test(char) !== /^\s$/.test(char)) disagreements.push(code);
    }

    expect(disagreements).toEqual([]);
  });
});
