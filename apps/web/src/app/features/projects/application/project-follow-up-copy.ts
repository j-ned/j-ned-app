export const PROJECT_FOLLOW_UP_COPY = {
  heading: 'Un besoin similaire\u202f?',
  text: 'Décrivez-le, je vous réponds sous 24\u00a0h ouvrées.',
  catalogueLink: 'Voir les offres et les prix',
  hiringPrompt: 'Vous recrutez\u202f?',
  hiringLink: 'Parcours et CV',
} as const;

export const relatedOfferLinkLabel = (offerName: string): string =>
  `Voir l'offre «\u00a0${offerName}\u00a0»`;
