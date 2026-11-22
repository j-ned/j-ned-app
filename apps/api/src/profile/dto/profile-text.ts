import * as z from 'zod';

// `<` suivi d'une lettre, de `/`, `!` ou `?` : balise ou commentaire HTML. « a < b » reste du texte.
const MARKUP = /<[a-zA-Z/!?]/;

// Messages du contrat figé de l'API, à l'identique de NestJS.
const withoutMarkup = (text: z.ZodString) =>
  text.refine((value) => !MARKUP.test(value), {
    error: 'must not contain HTML markup',
  });

// Le front l'interpole en texte, jamais en HTML, mais le document est du contenu, pas un gabarit :
// un balisage est une erreur de saisie ou une tentative, refusée à la frontière.
export const profileText = (max: number) =>
  withoutMarkup(
    z
      .string()
      .max(max)
      .refine((value) => value.trim().length > 0, {
        error: 'must not be blank',
      }),
  );
