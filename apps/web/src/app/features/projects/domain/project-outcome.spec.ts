import type { ProjectOutcome } from './models/project-outcome.model';
import { projectOutcome } from './project-outcome';
import { PROJECT_USAGE_LABELS } from './project-outcomes.static-data';

describe('projectOutcome', () => {
  it.each<{ slug: string; expected: ProjectOutcome }>([
    {
      slug: 'dashflow',
      expected: {
        summary:
          'Suivre le budget du foyer et la santé de chacun sans confier ces données en clair à un serveur\u00a0: une seule application, chiffrée dans le navigateur avant tout envoi.',
        usage: 'personal',
      },
    },
    {
      slug: 'candidash',
      expected: {
        summary:
          'Suivre des candidatures sans tableur ni CRM surdimensionné\u00a0: un tableau de bord, des relances automatiques par email et les documents rangés avec chaque offre.',
        usage: 'personal',
      },
    },
  ])(
    'Given the $slug project When its outcome is read Then it is the validated sentence, for personal use',
    ({ slug, expected }) => {
      expect(projectOutcome(slug)).toEqual(expected);
    },
  );

  it.each(['le-vieux-comptoir', 'gitpush-auto', 'inconnu', undefined])(
    'Given the slug %s without validated outcome When its outcome is read Then there is none',
    (slug) => {
      expect(projectOutcome(slug)).toBeNull();
    },
  );
});

describe('PROJECT_USAGE_LABELS', () => {
  it('labels the personal use in the validated words', () => {
    expect(PROJECT_USAGE_LABELS).toEqual({ personal: 'Usage personnel, pour ma famille et moi.' });
  });
});
