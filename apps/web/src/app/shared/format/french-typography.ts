const NBSP = '\u00a0';
const NARROW_NBSP = '\u202f';

// Espaces horizontales seulement : un retour à la ligne avant une ponctuation reste tel quel.
const SPACES = '[^\\S\\r\\n]+';

const RULES: readonly (readonly [RegExp, string])[] = [
  [new RegExp(`${SPACES}([:%€»])`, 'gu'), `${NBSP}$1`],
  [new RegExp(`${SPACES}([;?!])`, 'gu'), `${NARROW_NBSP}$1`],
  [new RegExp(`«${SPACES}`, 'gu'), `«${NBSP}`],
];

export function toFrenchTypography(text: string): string {
  return RULES.reduce(
    (result, [pattern, replacement]) => result.replace(pattern, replacement),
    text,
  );
}
