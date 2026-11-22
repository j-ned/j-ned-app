// Bornes de l'API (`createCommentSchema`) : le formulaire refuse ce qu'elle refuserait.
export const COMMENT_LIMITS = {
  nameMin: 2,
  nameMax: 80,
  emailMax: 320,
  bodyMin: 2,
  bodyMax: 2000,
} as const;

// Lettre, chiffre, ponctuation ou symbole, hors remplissages hangul et cellule braille vide.
const VISIBLE = /(?![ᅟᅠㅤﾠ⠀])[\p{L}\p{N}\p{P}\p{S}]/u;

// Comme l'API : retours chariot normalisés, espaces de bord retirés, caractères (pas unités UTF-16).
export function characterCount(text: string): number {
  return Array.from(text.replace(/\r\n?/g, '\n').trim()).length;
}

export function hasVisibleCharacter(text: string): boolean {
  return VISIBLE.test(text);
}
