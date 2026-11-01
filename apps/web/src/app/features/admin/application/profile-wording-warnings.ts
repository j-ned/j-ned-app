import { FORBIDDEN_WORDINGS } from '@shared/identity/forbidden-wordings';
import type { ProfileDraft } from './profile-draft';

export type WordingWarning = {
  readonly fieldId: string;
  readonly fieldLabel: string;
  readonly wording: string;
};

type CheckedField = {
  readonly fieldId: string;
  readonly fieldLabel: string;
  readonly text: string;
};

const field = (key: string, fieldLabel: string, text: string): CheckedField => ({
  fieldId: `profile-${key}`,
  fieldLabel,
  text,
});

const rows = <T>(
  items: readonly T[],
  fields: readonly (readonly [key: string, label: string, read: (item: T) => string])[],
): CheckedField[] =>
  items.flatMap((item, index) =>
    fields.map(([key, label, read]) =>
      field(`${key}-${index + 1}`, `${label} ${index + 1}`, read(item)),
    ),
  );

function checkedFields(draft: ProfileDraft): readonly CheckedField[] {
  return [
    field('biography-title', 'Titre du parcours', draft.biographyTitle),
    field('biography-summary', 'Résumé du parcours', draft.biographySummary),
    field('lead-emphasis', "Suite de l'accroche", draft.leadEmphasis),
    ...rows(draft.paragraphs, [['paragraph-text', 'Paragraphe', (row): string => row.text]]),
    ...rows(draft.highlights, [
      ['highlight-title', 'Titre du trait', (row): string => row.title],
      ['highlight-description', 'Description du trait', (row): string => row.description],
    ]),
    field('work-summary', 'Résumé des activités', draft.workSummary),
    ...rows(draft.whatIDo, [
      ['activity-title', "Titre de l'activité", (row): string => row.title],
      ['activity-description', "Description de l'activité", (row): string => row.description],
    ]),
    ...rows(draft.technologies, [
      ['technology-name', 'Nom de la technologie', (row): string => row.name],
      ['technology-category', 'Catégorie de la technologie', (row): string => row.category],
    ]),
    field('diplomas-summary', 'Résumé des formations', draft.diplomasSummary),
    ...rows(draft.diplomas, [
      ['diploma-title', 'Intitulé de la formation', (row): string => row.title],
      ['diploma-provider', 'Organisme de la formation', (row): string => row.provider],
      ['diploma-level', 'Niveau de la formation', (row): string => row.level],
      ['diploma-description', 'Description de la formation', (row): string => row.shortDescription],
      ['diploma-skills', 'Compétences de la formation', (row): string => row.skills],
    ]),
    field('motivation-title', 'Titre de la motivation', draft.motivationTitle),
    field('motivation-statement', 'Énoncé de la motivation', draft.motivationStatement),
    field('motivation-description', 'Description de la motivation', draft.motivationDescription),
  ];
}

export function profileWordingWarnings(draft: ProfileDraft): readonly WordingWarning[] {
  return checkedFields(draft).flatMap(({ fieldId, fieldLabel, text }) =>
    FORBIDDEN_WORDINGS.filter(({ pattern }) => pattern.test(text)).map(({ label }) => ({
      fieldId,
      fieldLabel,
      wording: label,
    })),
  );
}
