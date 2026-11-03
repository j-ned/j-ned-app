import { countWords } from './word-count';

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
