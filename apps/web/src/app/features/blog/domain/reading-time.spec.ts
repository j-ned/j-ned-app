import { readingTimeMinutes } from './reading-time';

const words = (count: number): string => Array.from({ length: count }, () => 'mot').join(' ');

describe('readingTimeMinutes', () => {
  it.each([
    { label: 'texte vide', text: '', minutes: 1 },
    { label: '1 mot', text: words(1), minutes: 1 },
    { label: '220 mots', text: words(220), minutes: 1 },
    { label: '221 mots', text: words(221), minutes: 2 },
    { label: '1 136 mots (article reconversion)', text: words(1136), minutes: 6 },
    { label: '2 843 mots (article chiffrement)', text: words(2843), minutes: 13 },
  ])('Given $label When on estime la lecture Then $minutes min', ({ text, minutes }) => {
    expect(readingTimeMinutes(text)).toBe(minutes);
  });

  it('Given des sauts de ligne et espaces multiples When on estime Then seuls les mots comptent', () => {
    expect(readingTimeMinutes(`  ## Titre\n\n${words(219)}\n\n  `)).toBe(2);
  });
});
