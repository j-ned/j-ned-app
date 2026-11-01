import type { ProjectOutcome, ProjectUsage } from './models/project-outcome.model';

export const PROJECT_OUTCOMES: Readonly<Record<string, ProjectOutcome>> = {
  dashflow: {
    summary:
      'Suivre le budget du foyer et la santé de chacun sans confier ces données en clair à un serveur\u00a0: une seule application, chiffrée dans le navigateur avant tout envoi.',
    usage: 'personal',
  },
  candidash: {
    summary:
      'Suivre des candidatures sans tableur ni CRM surdimensionné\u00a0: un tableau de bord, des relances automatiques par email et les documents rangés avec chaque offre.',
    usage: 'personal',
  },
};

export const PROJECT_USAGE_LABELS: Readonly<Record<ProjectUsage, string>> = {
  personal: 'Usage personnel, pour ma famille et moi.',
};
