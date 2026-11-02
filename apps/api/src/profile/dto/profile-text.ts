import { z } from 'zod';

/** Balise ou commentaire HTML : `<` suivi d'une lettre, de `/`, `!` ou `?`. « a < b » reste du texte. */
const MARKUP = /<[a-zA-Z/!?]/;

/** Texte sans balisage HTML (les messages restent ceux de l'ancienne API). */
export const withoutMarkup = (text: z.ZodString) =>
  text.refine((value) => !MARKUP.test(value), {
    error: 'must not contain HTML markup',
  });

/**
 * Texte éditorial du parcours : chaîne non blanche, bornée, sans balisage. Le front l'interpole en
 * texte (jamais en HTML), mais le document est du contenu, pas un gabarit : un balisage est une
 * erreur de saisie ou une tentative, refusée à la frontière.
 */
export const profileText = (max: number) =>
  withoutMarkup(
    z
      .string()
      .max(max)
      .refine((value) => value.trim().length > 0, {
        error: 'must not be blank',
      }),
  );
