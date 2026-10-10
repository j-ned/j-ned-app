type WorkFrame = {
  readonly title: string;
  readonly reference: string;
  readonly rows: readonly { readonly label: string; readonly value: string }[];
  readonly dimension: string;
};

export const HOME_HERO_CTA_LABELS = {
  contact: 'Décrire mon projet',
  offers: 'Voir les offres et les prix',
} as const;

export const HOME_WORK_FRAME: WorkFrame = {
  title: 'Cadre de travail',
  reference: 'réf. JN-2026',
  rows: [
    { label: 'Prix', value: 'Fixe, annoncé avant de commencer' },
    { label: 'Site vitrine', value: 'En ligne en 7 jours' },
    { label: 'Réponse', value: 'Sous 48\u00a0h ouvrées' },
    { label: 'Propriété', value: 'Le site, le code et le nom de domaine sont à vous' },
    { label: 'Zone', value: 'Yvelines et Île-de-France, rendez-vous possible' },
  ],
  dimension: 'de la demande à la mise en ligne',
};
