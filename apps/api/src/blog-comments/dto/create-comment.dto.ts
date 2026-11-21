import * as z from 'zod';
import { COMMENT_LIMITS } from '../comment-limits';

const { nameMin, nameMax, emailMax, bodyMin, bodyMax } = COMMENT_LIMITS;

// Les contrôles bidirectionnels retournent l'affichage du texte qui suit : usurpation visuelle d'un nom.
const BIDI_CONTROL = /[‪-‮⁦-⁩]/u;
const CONTROL = /\p{Cc}/u;
const CONTROL_EXCEPT_NEWLINE_AND_TAB = /[^\P{Cc}\n\t]/u;

// Postgres compte des caractères (`char_length`), JavaScript des unités UTF-16 : un émoji en vaut deux.
const characterCount = (text: string): number => Array.from(text).length;
const between = (min: number, max: number) => (text: string) => {
  const count = characterCount(text);
  return count >= min && count <= max;
};

const NAME_LENGTH = 'Ton nom doit compter entre 2 et 80 caractères.';
const NAME_CHARACTERS = 'Ton nom contient des caractères non autorisés.';
const EMAIL_INVALID = 'Ton adresse e-mail n’est pas valide.';
const BODY_LENGTH = 'Ton message doit compter entre 2 et 2 000 caractères.';
const BODY_CHARACTERS = 'Ton message contient des caractères non autorisés.';

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
          !BIDI_CONTROL.test(text),
        { error: BODY_CHARACTERS },
      ),
  );

export const createCommentSchema = z.strictObject({
  name: z
    .string({ error: NAME_LENGTH })
    .trim()
    .refine(between(nameMin, nameMax), { error: NAME_LENGTH })
    .refine((text) => !CONTROL.test(text) && !BIDI_CONTROL.test(text), {
      error: NAME_CHARACTERS,
    }),
  email: z.email({ error: EMAIL_INVALID }).max(emailMax, {
    error: EMAIL_INVALID,
  }),
  body: commentBodySchema,
  parentId: z.uuid().optional(),
  // Champ piège : invisible pour un humain, rempli par un robot. Déclaré pour passer la liste blanche.
  website: z.string().max(200).optional(),
});
export type CreateCommentDto = z.infer<typeof createCommentSchema>;
