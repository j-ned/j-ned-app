import { countWords, readingTimeMinutes } from './reading-time';

describe('readingTimeMinutes', () => {
  it.each([
    { label: 'texte vide', words: 0, minutes: 1 },
    { label: '1 mot', words: 1, minutes: 1 },
    { label: '220 mots', words: 220, minutes: 1 },
    { label: '221 mots', words: 221, minutes: 2 },
    { label: '1 136 mots (article reconversion)', words: 1136, minutes: 6 },
    { label: '2 843 mots (article chiffrement)', words: 2843, minutes: 13 },
  ])('Given $label When on estime la lecture Then $minutes min', ({ words, minutes }) => {
    expect(readingTimeMinutes(words)).toBe(minutes);
  });
});

describe('countWords', () => {
  it('Given des sauts de ligne et espaces multiples When on compte Then seuls les mots comptent', () => {
    expect(countWords(`  ## Titre\n\nun   deux\n\n  `)).toBe(4);
  });

  it('Given un texte vide When on compte Then zéro mot', () => {
    expect(countWords('')).toBe(0);
  });
});
