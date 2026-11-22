import * as z from 'zod';
import { COMMENT_LIMITS } from '../comment-limits';

const { nameMin, nameMax, emailMax, bodyMin, bodyMax } = COMMENT_LIMITS;

const CONTROL = /\p{Cc}/u;
const CONTROL_EXCEPT_NEWLINE_AND_TAB = /[^\P{Cc}\n\t]/u;
// Caractères de format (largeur nulle, contrôles bidirectionnels, marque d'ordre) : invisibles ou
// trompeurs à l'affichage. Seul le ZWJ (U+200D) reste : il compose les émojis.
const FORMAT_EXCEPT_ZWJ = /[^\P{Cf}\u200D]/u;
// Moitié de paire UTF-16 isolée : le pilote Postgres l'enregistrerait en U+FFFD.
const LONE_SURROGATE = /\p{Cs}/u;
// Lettre, chiffre, ponctuation ou symbole, hors remplissages hangul et cellule braille vide.
const VISIBLE = /(?![\u115F\u1160\u3164\uFFA0\u2800])[\p{L}\p{N}\p{P}\p{S}]/u;

// Postgres compte des caractères (`char_length`), JavaScript des unités UTF-16 : un émoji en vaut deux.
const characterCount = (text: string): number => Array.from(text).length;
const between = (min: number, max: number) => (text: string) => {
  const count = characterCount(text);
  return count >= min && count <= max;
};
const withoutHiddenCharacters = (text: string): boolean =>
  !FORMAT_EXCEPT_ZWJ.test(text) && !LONE_SURROGATE.test(text);

const NAME_LENGTH = 'Ton nom doit compter entre 2 et 80 caractères.';
const NAME_CHARACTERS = 'Ton nom contient des caractères non autorisés.';
const NAME_INVISIBLE = 'Ton nom doit contenir au moins un caractère visible.';
const EMAIL_INVALID = 'Ton adresse e-mail n’est pas valide.';
const BODY_LENGTH = 'Ton message doit compter entre 2 et 2 000 caractères.';
const BODY_CHARACTERS = 'Ton message contient des caractères non autorisés.';
const BODY_INVISIBLE =
  'Ton message doit contenir au moins un caractère visible.';

// Texte brut, gardé tel qu'écrit (chevrons compris) : l'échappement est l'affaire du rendu.
export const commentBodySchema = z
  .string({ error: BODY_LENGTH })
  .transform((text) => text.replace(/\r\n?/g, '\n').trim())
  .pipe(
    z
      .string()
      .refine(between(bodyMin, bodyMax), { error: BODY_LENGTH })
      .refine(
        (text) =>
          !CONTROL_EXCEPT_NEWLINE_AND_TAB.test(text) &&
          withoutHiddenCharacters(text),
        { error: BODY_CHARACTERS },
      )
      .refine((text) => VISIBLE.test(text), { error: BODY_INVISIBLE }),
  );

export const createCommentSchema = z.strictObject({
  name: z
    .string({ error: NAME_LENGTH })
    .trim()
    .refine(between(nameMin, nameMax), { error: NAME_LENGTH })
    .refine((text) => !CONTROL.test(text) && withoutHiddenCharacters(text), {
      error: NAME_CHARACTERS,
    })
    .refine((text) => VISIBLE.test(text), { error: NAME_INVISIBLE }),
  email: z.email({ error: EMAIL_INVALID }).max(emailMax, {
    error: EMAIL_INVALID,
  }),
  body: commentBodySchema,
  parentId: z.uuid().optional(),
  // Champ piège : invisible pour un humain, rempli par un robot. Déclaré pour passer la liste blanche.
  website: z.string().max(200).optional(),
});
export type CreateCommentDto = z.infer<typeof createCommentSchema>;
