import { frenchTypographyViolations } from '../../testing/french-typography-violations';
import { toFrenchTypography } from './french-typography';

const NBSP = '\u00a0';
const NARROW_NBSP = '\u202f';

describe('toFrenchTypography: espaces avant la ponctuation haute et dans les guillemets', () => {
  it.each([
    { rule: 'an ordinary space before a colon', text: 'Prix : 890', expected: `Prix${NBSP}: 890` },
    {
      rule: 'an ordinary space before a semicolon',
      text: 'vite ; bien',
      expected: `vite${NARROW_NBSP}; bien`,
    },
    {
      rule: 'an ordinary space before a question mark',
      text: 'Pourquoi ?',
      expected: `Pourquoi${NARROW_NBSP}?`,
    },
    {
      rule: 'an ordinary space before an exclamation mark',
      text: 'Allons-y !',
      expected: `Allons-y${NARROW_NBSP}!`,
    },
    {
      rule: 'ordinary spaces inside quotes',
      text: '« clé en main »',
      expected: `«${NBSP}clé en main${NBSP}»`,
    },
    { rule: 'an ordinary space before a percent sign', text: '100 %', expected: `100${NBSP}%` },
    { rule: 'an ordinary space before a euro sign', text: '890 €', expected: `890${NBSP}€` },
    {
      rule: 'a no-break space before a question mark',
      text: `Pourquoi${NBSP}?`,
      expected: `Pourquoi${NARROW_NBSP}?`,
    },
    {
      rule: 'a narrow no-break space before a colon',
      text: `Prix${NARROW_NBSP}: 890`,
      expected: `Prix${NBSP}: 890`,
    },
    {
      rule: 'several spaces before a colon and inside quotes',
      text: 'Prix   : «  clé  »',
      expected: `Prix${NBSP}: «${NBSP}clé${NBSP}»`,
    },
    {
      rule: 'a tab before an exclamation mark',
      text: 'Enfin\t!',
      expected: `Enfin${NARROW_NBSP}!`,
    },
    {
      rule: 'every rule in one sentence',
      text: 'Le cadre : « sur mesure » ; livré à 100 % ? Oui !',
      expected: `Le cadre${NBSP}: «${NBSP}sur mesure${NBSP}»${NARROW_NBSP}; livré à 100${NBSP}%${NARROW_NBSP}? Oui${NARROW_NBSP}!`,
    },
  ])('Given $rule When the text is normalized Then it reads $expected', ({ text, expected }) => {
    expect(toFrenchTypography(text)).toBe(expected);
  });

  it.each([
    { name: 'a clock time', text: 'livré à 12:30' },
    { name: 'a link', text: 'https://x.fr/a?b=1' },
    { name: 'a colon glued to its word', text: 'Prix: 890' },
    { name: 'a plain sentence', text: 'Développeur full-stack.' },
    { name: 'an empty text', text: '' },
  ])('Given $name When the text is normalized Then it is unchanged', ({ text }) => {
    expect(toFrenchTypography(text)).toBe(text);
  });

  it.each(['Prix : 890', 'Le cadre : « sur mesure » ; livré à 100 % ? Oui !', `Pourquoi${NBSP}?`])(
    'Given %j When it is normalized twice Then the first pass leaves no violation and the second changes nothing',
    (text) => {
      const once = toFrenchTypography(text);

      expect({
        violations: frenchTypographyViolations(once, 'x'),
        twice: toFrenchTypography(once),
      }).toEqual({ violations: [], twice: once });
    },
  );

  it('Given a text breaking every rule When it is normalized Then the editorial checker finds no violation in it', () => {
    const text = 'Le cadre : « sur mesure » ; livré à 100 % pour 890 € ? Oui !';

    expect({
      before: frenchTypographyViolations(text, 'x').length,
      after: frenchTypographyViolations(toFrenchTypography(text), 'x'),
    }).toEqual({ before: 8, after: [] });
  });
});
