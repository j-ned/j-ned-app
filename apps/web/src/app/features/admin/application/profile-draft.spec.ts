import {
  aDiploma,
  aHighlight,
  aProfileContent,
  aTechnology,
  aWhatIDo,
} from '@features/profile/testing/profile-builders';
import { toProfileContent, toProfileDraft, type ProfileDraft } from './profile-draft';

const RICH_CONTENT = aProfileContent({
  highlights: [aHighlight(), aHighlight({ id: 'highlight-2', title: 'Second trait' })],
  whatIDo: [aWhatIDo(), aWhatIDo({ id: 'work-2', title: 'Seconde activité' })],
  technologies: [aTechnology(), aTechnology({ id: 'tech-2', name: 'NestJS', icon: 'nestjs' })],
  diplomas: [aDiploma(), aDiploma({ id: 'diploma-2', skills: ['Compétence C'] })],
});

describe('toProfileDraft', () => {
  it('Given a document content When it becomes a draft Then each text is a flat field, paragraphs are rows and skills are one per line', () => {
    expect(toProfileDraft(aProfileContent())).toEqual({
      biographyTitle: 'Parcours témoin',
      biographySummary: 'Résumé du parcours témoin.',
      leadEmphasis: 'Suite de l’accroche témoin.',
      paragraphs: [
        { key: 'paragraph-1', text: 'Premier paragraphe témoin.' },
        { key: 'paragraph-2', text: 'Second paragraphe témoin.' },
      ],
      highlights: [
        { id: 'highlight-1', title: 'Trait témoin', description: 'Description du trait témoin.' },
      ],
      workSummary: 'Résumé des activités témoin.',
      whatIDo: [
        {
          id: 'work-1',
          title: 'Activité témoin',
          description: 'Description de l’activité témoin.',
        },
      ],
      technologies: [
        { id: 'tech-1', name: 'Techno témoin', category: 'Catégorie témoin', icon: 'angular' },
      ],
      diplomasSummary: 'Résumé des formations témoin.',
      diplomas: [
        {
          id: 'diploma-1',
          title: 'Formation témoin',
          provider: 'Organisme témoin',
          level: 'Niveau témoin',
          shortDescription: 'Description de la formation témoin.',
          skills: 'Compétence A\nCompétence B',
        },
      ],
      motivationTitle: 'Motivation témoin',
      motivationStatement: 'Énoncé de la motivation témoin.',
      motivationDescription: 'Description de la motivation témoin.',
    } satisfies ProfileDraft);
  });

  it('Given a content When it becomes a draft Then the rows are copies the form may edit without touching the document', () => {
    const content = aProfileContent();
    const draft = toProfileDraft(content);

    const [row] = draft.highlights;
    if (row) row.title = 'Modifié';
    draft.paragraphs.push({ key: 'paragraph-3', text: 'Ajout' });

    expect({
      edited: draft.highlights[0]?.title,
      highlight: content.highlights[0]?.title,
      paragraphs: content.biography.paragraphs.length,
    }).toEqual({ edited: 'Modifié', highlight: 'Trait témoin', paragraphs: 2 });
  });
});

describe('toProfileContent', () => {
  it.each([
    { name: 'the witness content', content: aProfileContent() },
    { name: 'a content with two items in every list', content: RICH_CONTENT },
  ])(
    'Given $name When it goes to a draft and back Then the content is unchanged',
    ({ content }) => {
      expect(toProfileContent(toProfileDraft(content))).toEqual(content);
    },
  );

  it.each([
    {
      field: 'the biography title',
      edit: (draft: ProfileDraft): ProfileDraft => ({ ...draft, biographyTitle: '  Titre  ' }),
      read: (content: ReturnType<typeof toProfileContent>): string => content.biography.title,
      expected: 'Titre',
    },
    {
      field: 'the lead emphasis',
      edit: (draft: ProfileDraft): ProfileDraft => ({ ...draft, leadEmphasis: '\n suite \t' }),
      read: (content: ReturnType<typeof toProfileContent>): string =>
        content.biography.leadEmphasis,
      expected: 'suite',
    },
    {
      field: 'the work summary',
      edit: (draft: ProfileDraft): ProfileDraft => ({ ...draft, workSummary: ' Résumé ' }),
      read: (content: ReturnType<typeof toProfileContent>): string => content.workSummary,
      expected: 'Résumé',
    },
    {
      field: 'the diplomas summary',
      edit: (draft: ProfileDraft): ProfileDraft => ({ ...draft, diplomasSummary: ' Bilan ' }),
      read: (content: ReturnType<typeof toProfileContent>): string => content.diplomasSummary,
      expected: 'Bilan',
    },
    {
      field: 'the motivation statement',
      edit: (draft: ProfileDraft): ProfileDraft => ({ ...draft, motivationStatement: ' Énoncé ' }),
      read: (content: ReturnType<typeof toProfileContent>): string => content.motivation.statement,
      expected: 'Énoncé',
    },
    {
      field: 'a paragraph',
      edit: (draft: ProfileDraft): ProfileDraft => ({
        ...draft,
        paragraphs: [{ key: 'paragraph-1', text: '  Un paragraphe.  ' }],
      }),
      read: (content: ReturnType<typeof toProfileContent>): string =>
        content.biography.paragraphs.join('|'),
      expected: 'Un paragraphe.',
    },
    {
      field: 'a trait description',
      edit: (draft: ProfileDraft): ProfileDraft => ({
        ...draft,
        highlights: [{ id: 'highlight-1', title: 'Trait', description: '  Décrit.  ' }],
      }),
      read: (content: ReturnType<typeof toProfileContent>): string =>
        content.highlights.map((item) => item.description).join('|'),
      expected: 'Décrit.',
    },
  ])(
    'Given $field typed with surrounding blanks When the content is built Then it is trimmed',
    ({ edit, read, expected }) => {
      const draft = edit(toProfileDraft(aProfileContent()));

      expect(read(toProfileContent(draft))).toBe(expected);
    },
  );

  it('Given rows marked by the form When the content is built Then each row is copied field by field, without the mark', () => {
    const mark = Symbol('form-row');
    const draft = toProfileDraft(aProfileContent());
    const marked: ProfileDraft = {
      ...draft,
      paragraphs: draft.paragraphs.map((row) => Object.assign({ ...row }, { [mark]: true })),
      highlights: draft.highlights.map((row) => Object.assign({ ...row }, { [mark]: true })),
      technologies: draft.technologies.map((row) => Object.assign({ ...row }, { [mark]: true })),
      diplomas: draft.diplomas.map((row) => Object.assign({ ...row }, { [mark]: true })),
    };

    const content = toProfileContent(marked);

    expect(
      [...content.highlights, ...content.technologies, ...content.diplomas].map((row) =>
        Object.getOwnPropertySymbols(row),
      ),
    ).toEqual([[], [], []]);
  });
});

describe('profile-draft: stack et formations', () => {
  it.each([
    { name: 'a stored icon of the closed list', icon: 'nestjs', expected: 'nestjs' },
    { name: 'a stored icon outside the closed list', icon: 'vue', expected: '' },
  ])(
    'Given $name When the draft is built Then the icon field reads « $expected »',
    ({ icon, expected }) => {
      const draft = toProfileDraft(aProfileContent({ technologies: [aTechnology({ icon })] }));

      expect(draft.technologies.map((row) => row.icon)).toEqual([expected]);
    },
  );

  it.each([
    { skills: 'a\n\n b \n', expected: ['a', 'b'] },
    { skills: '\n\tRigueur\r\nMéthode  ', expected: ['Rigueur', 'Méthode'] },
  ])(
    'Given the skills typed as $skills When the content is built Then each non-empty line is one trimmed skill',
    ({ skills, expected }) => {
      const draft = toProfileDraft(aProfileContent());
      const edited: ProfileDraft = {
        ...draft,
        diplomas: draft.diplomas.map((row) => ({ ...row, skills })),
      };

      expect(toProfileContent(edited).diplomas.map((diploma) => diploma.skills)).toEqual([
        expected,
      ]);
    },
  );
});

describe("profile-draft: typographie française à l'enregistrement", () => {
  const TYPED = 'Texte : « fin » ; vraiment ?';
  const NORMALIZED = 'Texte\u00a0: «\u00a0fin\u00a0»\u202f; vraiment\u202f?';

  it('Given every text of the draft typed with ordinary spaces When the content is built Then every text follows the French typography, ids and icons untouched', () => {
    const draft: ProfileDraft = {
      biographyTitle: TYPED,
      biographySummary: TYPED,
      leadEmphasis: TYPED,
      paragraphs: [{ key: 'paragraph-1', text: TYPED }],
      highlights: [{ id: 'highlight-1', title: TYPED, description: TYPED }],
      workSummary: TYPED,
      whatIDo: [{ id: 'work-1', title: TYPED, description: TYPED }],
      technologies: [{ id: 'tech-1', name: TYPED, category: TYPED, icon: 'angular' }],
      diplomasSummary: TYPED,
      diplomas: [
        {
          id: 'diploma-1',
          title: TYPED,
          provider: TYPED,
          level: TYPED,
          shortDescription: TYPED,
          skills: `${TYPED}\n${TYPED}`,
        },
      ],
      motivationTitle: TYPED,
      motivationStatement: TYPED,
      motivationDescription: TYPED,
    };

    expect(toProfileContent(draft)).toEqual({
      biography: {
        title: NORMALIZED,
        summary: NORMALIZED,
        leadEmphasis: NORMALIZED,
        paragraphs: [NORMALIZED],
      },
      highlights: [{ id: 'highlight-1', title: NORMALIZED, description: NORMALIZED }],
      workSummary: NORMALIZED,
      whatIDo: [{ id: 'work-1', title: NORMALIZED, description: NORMALIZED }],
      technologies: [{ id: 'tech-1', name: NORMALIZED, category: NORMALIZED, icon: 'angular' }],
      diplomasSummary: NORMALIZED,
      diplomas: [
        {
          id: 'diploma-1',
          title: NORMALIZED,
          provider: NORMALIZED,
          level: NORMALIZED,
          shortDescription: NORMALIZED,
          skills: [NORMALIZED, NORMALIZED],
        },
      ],
      motivation: { title: NORMALIZED, statement: NORMALIZED, description: NORMALIZED },
    });
  });

  it('Given a title with surrounding blanks and a spaced colon When the content is built Then it is trimmed and the colon gets its no-break space', () => {
    const draft = { ...toProfileDraft(aProfileContent()), biographyTitle: '  Prix : 890  ' };

    expect(toProfileContent(draft).biography.title).toBe('Prix\u00a0: 890');
  });
});
