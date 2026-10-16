import { REVIEW_INVITATION_COPY } from '@shared/identity/review-invitation.static-data';

export const FOOTER_COPY = {
  tagline:
    'Sites et applications web pour TPE, PME et ateliers. Missions le soir et le week-end, Yvelines et à distance.',
  headings: { offers: 'Offres', resources: 'Ressources', contact: 'Contact' },
  resources: { projects: 'Réalisations', blog: 'Blog', about: 'Parcours' },
  contactCta: 'Décrire mon projet',
  bookingLink: 'Réserver un appel de 30\u00a0min',
  socials: { malt: 'Malt', linkedin: 'LinkedIn', github: 'GitHub' },
  review: REVIEW_INVITATION_COPY,
  legal: {
    owner: 'Julien Nédellec',
    status: 'EI',
    siretLabel: 'SIRET',
    legalNotice: 'Mentions légales',
    privacy: 'Confidentialité',
  },
} as const;
