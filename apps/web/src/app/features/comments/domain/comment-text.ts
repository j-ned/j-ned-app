// Bornes de l'API (`createCommentSchema`) : le formulaire refuse ce qu'elle refuserait.
export const COMMENT_LIMITS = {
  nameMin: 2,
  nameMax: 80,
  emailMax: 320,
  bodyMin: 2,
  bodyMax: 2000,
} as const;

// Lettre, chiffre, ponctuation ou symbole, hors remplissages hangul et cellule braille vide.
const VISIBLE = /(?![\u115F\u1160\u3164\uFFA0\u2800])[\p{L}\p{N}\p{P}\p{S}]/u;

// Comme l'API : retours chariot normalisés, espaces de bord retirés, caractères (pas unités UTF-16).
export function characterCount(text: string): number {
  return Array.from(text.replace(/\r\n?/g, '\n').trim()).length;
}

export function hasVisibleCharacter(text: string): boolean {
  return VISIBLE.test(text);
}

const CONTROL = /\p{Cc}/u;
const CONTROL_EXCEPT_NEWLINE_AND_TAB = /[^\P{Cc}\n\t]/u;
// Caractères de format (largeur nulle, contrôles bidirectionnels, marque d'ordre) : invisibles ou
// trompeurs à l'affichage. Seul le ZWJ (U+200D) reste : il compose les émojis.
const FORMAT_EXCEPT_ZWJ = /[^\P{Cf}\u200D]/u;
// Moitié de paire UTF-16 isolée : la base l'enregistrerait en U+FFFD.
const LONE_SURROGATE = /\p{Cs}/u;

// Mêmes refus que l'API : le nom n'admet aucun caractère de contrôle, le message garde `\n` et `\t`.
export function hasForbiddenCharacter(text: string, field: 'name' | 'body'): boolean {
  const control =
    field === 'name'
      ? CONTROL.test(text)
      : CONTROL_EXCEPT_NEWLINE_AND_TAB.test(text.replace(/\r\n?/g, '\n'));
  return control || FORMAT_EXCEPT_ZWJ.test(text) || LONE_SURROGATE.test(text);
}
