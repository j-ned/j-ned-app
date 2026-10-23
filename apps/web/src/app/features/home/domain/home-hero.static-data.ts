type WorkFrame = {
  readonly title: string;
  readonly reference: string;
  readonly rows: readonly { readonly label: string; readonly value: string }[];
  readonly dimension: string;
};

export const HOME_HERO_CTA_LABELS = {
  blog: 'Lire le blog',
  projects: 'Voir les réalisations',
} as const;

export const HOME_HERO_STICKER_LABEL = 'Fait main';

export const HOME_WORK_FRAME: WorkFrame = {
  title: 'Fiche technique',
  reference: 'réf. JN-2026',
  rows: [
    { label: 'Métier', value: "Tourneur CN de haute précision, dans l'aéronautique" },
    { label: 'Code', value: 'Depuis 2025, titre Développeur Web et Web Mobile' },
    { label: 'Stack', value: 'Angular, NestJS, TypeScript, PostgreSQL' },
    { label: 'Hébergement', value: 'Auto-hébergé, Docker et Traefik' },
    { label: 'Règle', value: 'Une pièce hors tolérance ne part pas, un code non testé non plus' },
  ],
  dimension: "de l'atelier au code",
};
