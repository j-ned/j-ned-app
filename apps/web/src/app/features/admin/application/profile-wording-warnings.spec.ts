import { aProfileContent } from '@features/profile/testing/profile-builders';
import { toProfileDraft, type ProfileDraft } from './profile-draft';
import { profileWordingWarnings } from './profile-wording-warnings';

const witnessDraft = (): ProfileDraft => toProfileDraft(aProfileContent());

describe('profileWordingWarnings', () => {
  it('Given the witness draft When it is checked Then there is nothing to reread', () => {
    const draft = witnessDraft();

    expect({
      clean: profileWordingWarnings(draft),
      flagged: profileWordingWarnings({ ...draft, biographyTitle: 'Métallurgie' }).length,
    }).toEqual({ clean: [], flagged: 1 });
  });

  it.each([
    {
      place: 'the biography summary',
      edit: (draft: ProfileDraft): ProfileDraft => ({
        ...draft,
        biographySummary: 'Plus de 20 ans de métier.',
      }),
      expected: {
        fieldId: 'profile-biography-summary',
        fieldLabel: 'Résumé du parcours',
        wording: '20 ans',
      },
    },
    {
      place: 'the second paragraph',
      edit: (draft: ProfileDraft): ProfileDraft => ({
        ...draft,
        paragraphs: [
          draft.paragraphs[0] ?? { key: 'paragraph-1', text: '' },
          { key: 'paragraph-2', text: 'Issu de la métallurgie.' },
        ],
      }),
      expected: {
        fieldId: 'profile-paragraph-text-2',
        fieldLabel: 'Paragraphe 2',
        wording: 'métallurgie',
      },
    },
    {
      place: 'the description of a trait',
      edit: (draft: ProfileDraft): ProfileDraft => ({
        ...draft,
        highlights: draft.highlights.map((row) => ({
          ...row,
          description: 'Vingt ans d’atelier.',
        })),
      }),
      expected: {
        fieldId: 'profile-highlight-description-1',
        fieldLabel: 'Description du trait 1',
        wording: 'vingt ans',
      },
    },
    {
      place: 'a skill of a diploma',
      edit: (draft: ProfileDraft): ProfileDraft => ({
        ...draft,
        diplomas: draft.diplomas.map((row) => ({ ...row, skills: 'Rigueur\nMétallurgie' })),
      }),
      expected: {
        fieldId: 'profile-diploma-skills-1',
        fieldLabel: 'Compétences de la formation 1',
        wording: 'métallurgie',
      },
    },
    {
      place: 'the title of an activity',
      edit: (draft: ProfileDraft): ProfileDraft => ({
        ...draft,
        whatIDo: draft.whatIDo.map((row) => ({ ...row, title: '20 ans de sites' })),
      }),
      expected: {
        fieldId: 'profile-activity-title-1',
        fieldLabel: "Titre de l'activité 1",
        wording: '20 ans',
      },
    },
  ])(
    'Given a wording in $place When the draft is checked Then one warning names the field and anchors it',
    ({ edit, expected }) => {
      expect(profileWordingWarnings(edit(witnessDraft()))).toEqual([expected]);
    },
  );

  it('Given two wordings in one field and one in another When the draft is checked Then the warnings follow the field order, then the list order', () => {
    const draft: ProfileDraft = {
      ...witnessDraft(),
      motivationDescription: 'La métallurgie, 20 ans durant.',
      biographyTitle: 'Vingt ans',
    };

    expect(profileWordingWarnings(draft)).toEqual([
      { fieldId: 'profile-biography-title', fieldLabel: 'Titre du parcours', wording: 'vingt ans' },
      {
        fieldId: 'profile-motivation-description',
        fieldLabel: 'Description de la motivation',
        wording: '20 ans',
      },
      {
        fieldId: 'profile-motivation-description',
        fieldLabel: 'Description de la motivation',
        wording: 'métallurgie',
      },
    ]);
  });
});
