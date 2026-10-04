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
    { label: 'Interlocuteur', value: 'Un seul, du devis à la maintenance' },
    { label: 'Site vitrine', value: '7 jours, prix fixe' },
    { label: 'Application', value: 'Devis ferme après cadrage' },
    { label: 'Propriété', value: 'Code et domaine à votre nom' },
    { label: 'Tolérance prix', value: '± 0 € hors avenant signé' },
  ],
  dimension: 'de la demande à la mise en ligne',
};
