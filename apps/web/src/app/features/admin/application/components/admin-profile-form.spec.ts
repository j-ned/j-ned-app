import { signal, twoWayBinding, type WritableSignal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import type { ProfileContent } from '@features/profile/domain/models/profile-content.model';
import { TECHNOLOGY_ICONS } from '@features/profile/domain/models/technology-icon';
import {
  aDiploma,
  aHighlight,
  aProfileContent,
  aTechnology,
  aWhatIDo,
} from '@features/profile/testing/profile-builders';
import { byTestId } from '@shared/testing/by-test-id';
import { settle, settleBounded } from '@shared/testing/settle';
import { toProfileDraft, type ProfileDraft } from '../profile-draft';
import { AdminProfileForm } from './admin-profile-form';
import { REQUIRED_MESSAGE } from './required-message';

type RenderedForm = {
  readonly fixture: ComponentFixture<AdminProfileForm>;
  readonly host: HTMLElement;
  readonly value: WritableSignal<ProfileDraft>;
  readonly submitted: ProfileContent[];
};

type TextField = {
  readonly key: string;
  readonly draftKey: keyof ProfileDraft;
  readonly label: string;
  readonly section: string;
  readonly limit: number;
  readonly tooLong: string;
  readonly initial: string;
};

const WITNESS = aProfileContent();

const TEXT_FIELDS: readonly TextField[] = [
  {
    key: 'biography-title',
    draftKey: 'biographyTitle',
    label: 'Titre',
    section: 'profile-biography',
    limit: 80,
    tooLong: 'Le titre ne doit pas dépasser 80\u00a0caractères',
    initial: WITNESS.biography.title,
  },
  {
    key: 'biography-summary',
    draftKey: 'biographySummary',
    label: 'Résumé',
    section: 'profile-biography',
    limit: 200,
    tooLong: 'Le résumé ne doit pas dépasser 200\u00a0caractères',
    initial: WITNESS.biography.summary,
  },
  {
    key: 'lead-emphasis',
    draftKey: 'leadEmphasis',
    label: "Suite de l'accroche",
    section: 'profile-biography',
    limit: 160,
    tooLong: "La suite de l'accroche ne doit pas dépasser 160\u00a0caractères",
    initial: WITNESS.biography.leadEmphasis,
  },
  {
    key: 'work-summary',
    draftKey: 'workSummary',
    label: 'Résumé',
    section: 'profile-work',
    limit: 200,
    tooLong: 'Le résumé ne doit pas dépasser 200\u00a0caractères',
    initial: WITNESS.workSummary,
  },
  {
    key: 'diplomas-summary',
    draftKey: 'diplomasSummary',
    label: 'Résumé',
    section: 'profile-diplomas',
    limit: 200,
    tooLong: 'Le résumé ne doit pas dépasser 200\u00a0caractères',
    initial: WITNESS.diplomasSummary,
  },
  {
    key: 'motivation-title',
    draftKey: 'motivationTitle',
    label: 'Titre',
    section: 'profile-motivation',
    limit: 60,
    tooLong: 'Le titre ne doit pas dépasser 60\u00a0caractères',
    initial: WITNESS.motivation.title,
  },
  {
    key: 'motivation-statement',
    draftKey: 'motivationStatement',
    label: 'Énoncé',
    section: 'profile-motivation',
    limit: 240,
    tooLong: "L'énoncé ne doit pas dépasser 240\u00a0caractères",
    initial: WITNESS.motivation.statement,
  },
  {
    key: 'motivation-description',
    draftKey: 'motivationDescription',
    label: 'Description',
    section: 'profile-motivation',
    limit: 600,
    tooLong: 'La description ne doit pas dépasser 600\u00a0caractères',
    initial: WITNESS.motivation.description,
  },
];

async function renderForm(content: ProfileContent = aProfileContent()): Promise<RenderedForm> {
  const value = signal(toProfileDraft(content));
  const fixture = TestBed.createComponent(AdminProfileForm, {
    bindings: [twoWayBinding('value', value)],
  });
  const submitted: ProfileContent[] = [];
  fixture.componentInstance.submitted.subscribe((payload) => submitted.push(payload));
  await settle(fixture);
  return { fixture, host: fixture.nativeElement as HTMLElement, value, submitted };
}

const normalized = (element: Element | null | undefined): string =>
  (element?.textContent ?? '').replace(/[ \t\n\r]+/g, ' ').replace(/^ | $/g, '');

const control = (host: HTMLElement, key: string): HTMLInputElement | HTMLTextAreaElement | null =>
  byTestId(host, `admin-profile-${key}`) as HTMLInputElement | HTMLTextAreaElement | null;

const labelOf = (host: HTMLElement, element: HTMLElement | null): string | null => {
  if (!element?.id) return null;
  const labels = [...host.querySelectorAll('label')].filter(
    (label) => label.getAttribute('for') === element.id,
  );
  return labels.length === 1 ? normalized(labels[0]) : null;
};

const describedIds = (element: HTMLElement | null): readonly string[] =>
  element?.getAttribute('aria-describedby')?.split(/\s+/).filter(Boolean) ?? [];

const focusedTestId = (): string | null =>
  document.activeElement?.getAttribute('data-testid') ?? null;

async function typeIn(rendered: RenderedForm, key: string, text: string): Promise<void> {
  const field = control(rendered.host, key);
  expect(field).toBeInstanceOf(HTMLElement);
  if (!field) return;
  field.value = text;
  field.dispatchEvent(new Event('input'));
  field.dispatchEvent(new Event('change'));
  await settle(rendered.fixture);
}

async function submitForm(rendered: RenderedForm): Promise<void> {
  byTestId(rendered.host, 'admin-profile-form')?.dispatchEvent(
    new Event('submit', { bubbles: true, cancelable: true }),
  );
  await settleBounded(rendered.fixture);
}

const announcedError = (
  host: HTMLElement,
  key: string,
): { id: string; role: string | null; text: string } | null => {
  const error = byTestId(host, `admin-profile-${key}-error`);
  return error ? { id: error.id, role: error.getAttribute('role'), text: normalized(error) } : null;
};

describe('AdminProfileForm: champs du parcours', () => {
  it('Given the form When it renders Then it is the form « profile-form », free of the native validation', async () => {
    const { host } = await renderForm();
    const element = byTestId(host, 'admin-profile-form');

    expect({
      tag: element?.tagName,
      id: element?.id,
      novalidate: element?.hasAttribute('novalidate'),
    }).toEqual({ tag: 'FORM', id: 'profile-form', novalidate: true });
  });

  it.each(TEXT_FIELDS)(
    'Given the form When it renders Then $key stands in the section $section, labelled « $label » and marked as required',
    async ({ key, label, section }) => {
      const { host } = await renderForm();
      const field = control(host, key);

      expect({
        id: field?.id,
        section: field?.closest('fieldset')?.id ?? null,
        inForm: field?.closest('form')?.id ?? null,
        label: labelOf(host, field),
        required: field?.getAttribute('aria-required'),
      }).toEqual({
        id: `profile-${key}`,
        section,
        inForm: 'profile-form',
        label: `${label} obligatoire`,
        required: 'true',
      });
    },
  );

  it.each(TEXT_FIELDS)(
    'Given a draft from the page When the form renders Then $key shows its value',
    async ({ key, initial }) => {
      const { host } = await renderForm();

      expect(control(host, key)?.value).toBe(initial);
    },
  );

  it.each(TEXT_FIELDS)(
    'Given the form When the admin types in $key Then the page draft holds the text',
    async ({ key, draftKey }) => {
      const rendered = await renderForm();

      await typeIn(rendered, key, 'Texte saisi');

      expect(rendered.value()[draftKey]).toBe('Texte saisi');
    },
  );
});

describe('AdminProfileForm: soumission', () => {
  it('Given an untouched draft When it is submitted Then the document content is emitted unchanged', async () => {
    const rendered = await renderForm();

    await submitForm(rendered);

    expect(rendered.submitted).toEqual([aProfileContent()]);
  });

  it('Given an edited biography title and motivation statement When the form is submitted Then the emitted content carries both edits', async () => {
    const rendered = await renderForm();
    const witness = aProfileContent();

    await typeIn(rendered, 'biography-title', 'Nouveau parcours');
    await typeIn(rendered, 'motivation-statement', 'Nouvel énoncé.');
    await submitForm(rendered);

    expect(rendered.submitted).toEqual([
      aProfileContent({
        biography: { ...witness.biography, title: 'Nouveau parcours' },
        motivation: { ...witness.motivation, statement: 'Nouvel énoncé.' },
      }),
    ]);
  });

  it.each(TEXT_FIELDS)(
    'Given $key emptied When the form is submitted Then nothing is emitted and a role=alert error under the field says it is required',
    async ({ key }) => {
      const rendered = await renderForm();

      await typeIn(rendered, key, '');
      await submitForm(rendered);
      const field = control(rendered.host, key);

      expect({
        submitted: rendered.submitted.length,
        invalid: field?.getAttribute('aria-invalid'),
        describedBy: describedIds(field),
        error: announcedError(rendered.host, key),
      }).toEqual({
        submitted: 0,
        invalid: 'true',
        describedBy: [`profile-${key}-error`],
        error: { id: `profile-${key}-error`, role: 'alert', text: REQUIRED_MESSAGE },
      });
    },
  );

  it('Given a title made of blanks only When the form is submitted Then it counts as empty: nothing is emitted and the required error shows', async () => {
    const rendered = await renderForm();

    await typeIn(rendered, 'biography-title', ' \n\t ');
    await submitForm(rendered);

    expect({
      submitted: rendered.submitted.length,
      error: announcedError(rendered.host, 'biography-title')?.text,
    }).toEqual({ submitted: 0, error: REQUIRED_MESSAGE });
  });

  it.each(TEXT_FIELDS)(
    'Given $key one character over $limit When the form is submitted Then nothing is emitted and the error gives the limit',
    async ({ key, limit, tooLong }) => {
      const rendered = await renderForm();

      await typeIn(rendered, key, 'a'.repeat(limit + 1));
      await submitForm(rendered);

      expect({
        submitted: rendered.submitted.length,
        error: announcedError(rendered.host, key)?.text,
      }).toEqual({ submitted: 0, error: tooLong });
    },
  );

  it.each(
    TEXT_FIELDS.filter(({ key }) => ['biography-title', 'motivation-description'].includes(key)),
  )(
    'Given $key exactly at $limit characters When the form is submitted Then the content is emitted without error',
    async ({ key, limit }) => {
      const rendered = await renderForm();

      await typeIn(rendered, key, 'a'.repeat(limit));
      await submitForm(rendered);

      expect({
        submitted: rendered.submitted.length,
        error: announcedError(rendered.host, key),
      }).toEqual({ submitted: 1, error: null });
    },
  );

  it('Given the work summary and the motivation title emptied When the form is submitted Then the focus lands on the first invalid field, the work summary', async () => {
    const rendered = await renderForm();

    await typeIn(rendered, 'motivation-title', '');
    await typeIn(rendered, 'work-summary', '');
    await submitForm(rendered);

    expect({ focused: focusedTestId(), submitted: rendered.submitted.length }).toEqual({
      focused: 'admin-profile-work-summary',
      submitted: 0,
    });
  });
});

const NEW_ID = '6f1c2a4e-8b3d-4c5e-9f70-1a2b3c4d5e6f';

const rowsOf = (host: HTMLElement, prefix: string): readonly HTMLElement[] => [
  ...host.querySelectorAll<HTMLElement>(`[data-testid="admin-profile-${prefix}-row"]`),
];

const rowField = (
  host: HTMLElement,
  testId: string,
  index: number,
): HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null =>
  byTestId(host, `admin-profile-${testId}`, index) as
    | HTMLInputElement
    | HTMLTextAreaElement
    | HTMLSelectElement
    | null;

async function typeInRow(
  rendered: RenderedForm,
  testId: string,
  index: number,
  text: string,
): Promise<void> {
  const field = rowField(rendered.host, testId, index);
  expect(field).toBeInstanceOf(HTMLElement);
  if (!field) return;
  field.value = text;
  field.dispatchEvent(new Event('input'));
  field.dispatchEvent(new Event('change'));
  await settle(rendered.fixture);
}

async function pressInRow(
  rendered: RenderedForm,
  prefix: string,
  action: 'up' | 'down' | 'remove',
  index: number,
): Promise<void> {
  const row = rowsOf(rendered.host, prefix)[index];
  const element = row ? byTestId(row, `admin-profile-${prefix}-${action}`) : null;
  const button =
    element instanceof HTMLButtonElement ? element : (element?.querySelector('button') ?? null);
  button?.click();
  await settleBounded(rendered.fixture);
}

const addButton = (host: HTMLElement, prefix: string): HTMLButtonElement | null => {
  const element = byTestId(host, `admin-profile-${prefix}-add`);
  return element instanceof HTMLButtonElement
    ? element
    : (element?.querySelector('button') ?? null);
};

async function addRow(rendered: RenderedForm, prefix: string): Promise<void> {
  addButton(rendered.host, prefix)?.click();
  await settleBounded(rendered.fixture);
}

const rowError = (host: HTMLElement, testId: string, index = 0): string | null => {
  const error = byTestId(host, `admin-profile-${testId}-error`, index);
  return error ? normalized(error) : null;
};

const ORDERED_LISTS = [
  {
    prefix: 'paragraph',
    section: 'profile-biography',
    rows: 2,
    add: 'Ajouter un paragraphe',
    actions: ['Descendre le paragraphe 1', 'Supprimer le paragraphe 1'],
    max: 8,
    full: (count: number): ProfileContent =>
      aProfileContent({
        biography: {
          ...aProfileContent().biography,
          paragraphs: Array.from({ length: count }, (_, i) => `Paragraphe ${i + 1}.`),
        },
      }),
  },
  {
    prefix: 'highlight',
    section: 'profile-traits',
    rows: 1,
    add: 'Ajouter un trait',
    actions: ['Supprimer le trait 1'],
    max: 6,
    full: (count: number): ProfileContent =>
      aProfileContent({
        highlights: Array.from({ length: count }, (_, i) => aHighlight({ id: `highlight-${i}` })),
      }),
  },
  {
    prefix: 'activity',
    section: 'profile-work',
    rows: 1,
    add: 'Ajouter une activité',
    actions: ["Supprimer l'activité 1"],
    max: 6,
    full: (count: number): ProfileContent =>
      aProfileContent({
        whatIDo: Array.from({ length: count }, (_, i) => aWhatIDo({ id: `work-${i}` })),
      }),
  },
] as const;

describe('AdminProfileForm: listes ordonnables (paragraphes, traits, activités)', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it.each(ORDERED_LISTS)(
    'Given the witness content When the form renders Then the $prefix rows stand in $section, with their actions and the add button « $add »',
    async ({ prefix, section, rows, add, actions }) => {
      const { host } = await renderForm();
      const rendered = rowsOf(host, prefix);

      expect({
        rows: rendered.length,
        sections: [...new Set(rendered.map((row) => row.closest('fieldset[id^="profile-"]')?.id))],
        actions: [...(rendered[0]?.querySelectorAll('button') ?? [])].map(
          (button) => button.getAttribute('aria-label') ?? '',
        ),
        add: normalized(addButton(host, prefix)),
      }).toEqual({ rows, sections: [section], actions: [...actions], add });
    },
  );

  it('Given the witness content When the form renders Then each row field shows its value under its own numbered label', async () => {
    const { host } = await renderForm();
    const read = (
      testId: string,
      index = 0,
    ): { value: string | undefined; label: string | null } => {
      const field = rowField(host, testId, index);
      return { value: field?.value, label: labelOf(host, field) };
    };

    expect({
      paragraphs: [read('paragraph-text', 0), read('paragraph-text', 1)],
      highlight: [read('highlight-title'), read('highlight-description')],
      activity: [read('activity-title'), read('activity-description')],
    }).toEqual({
      paragraphs: [
        { value: 'Premier paragraphe témoin.', label: 'Paragraphe 1' },
        { value: 'Second paragraphe témoin.', label: 'Paragraphe 2' },
      ],
      highlight: [
        { value: 'Trait témoin', label: 'Titre du trait 1' },
        { value: 'Description du trait témoin.', label: 'Description du trait 1' },
      ],
      activity: [
        { value: 'Activité témoin', label: "Titre de l'activité 1" },
        { value: 'Description de l’activité témoin.', label: "Description de l'activité 1" },
      ],
    });
  });

  it('Given two paragraphs When the second is moved up and the form submitted Then the content carries them in the new order', async () => {
    const rendered = await renderForm();

    await pressInRow(rendered, 'paragraph', 'up', 1);
    await submitForm(rendered);

    expect(rendered.submitted.map((content) => content.biography.paragraphs)).toEqual([
      ['Second paragraphe témoin.', 'Premier paragraphe témoin.'],
    ]);
  });

  it('Given a trait added and filled When the form is submitted Then the new trait ends the list with an id drawn from crypto.randomUUID', async () => {
    const uuid = vi.spyOn(crypto, 'randomUUID').mockReturnValue(NEW_ID);
    const rendered = await renderForm();

    await addRow(rendered, 'highlight');
    await typeInRow(rendered, 'highlight-title', 1, 'Nouveau trait');
    await typeInRow(rendered, 'highlight-description', 1, 'Sa description.');
    await submitForm(rendered);

    expect({
      drawn: uuid.mock.calls.length,
      highlights: rendered.submitted.map((content) => content.highlights),
    }).toEqual({
      drawn: 1,
      highlights: [
        [aHighlight(), { id: NEW_ID, title: 'Nouveau trait', description: 'Sa description.' }],
      ],
    });
  });

  it('Given an activity added When the form is submitted unfilled Then nothing is emitted and both of its fields are required', async () => {
    vi.spyOn(crypto, 'randomUUID').mockReturnValue(NEW_ID);
    const rendered = await renderForm();

    await addRow(rendered, 'activity');
    await submitForm(rendered);

    expect({
      submitted: rendered.submitted.length,
      title: rowError(rendered.host, 'activity-title'),
      description: rowError(rendered.host, 'activity-description'),
    }).toEqual({ submitted: 0, title: REQUIRED_MESSAGE, description: REQUIRED_MESSAGE });
  });

  it.each([
    { prefix: 'paragraph', message: 'Ajoutez au moins un paragraphe.', count: 2 },
    { prefix: 'highlight', message: 'Ajoutez au moins un trait.', count: 1 },
    { prefix: 'activity', message: 'Ajoutez au moins une activité.', count: 1 },
  ])(
    'Given every $prefix removed When the form is submitted Then nothing is emitted and the list says one is needed',
    async ({ prefix, message, count }) => {
      const rendered = await renderForm();

      for (let removed = 0; removed < count; removed++) {
        await pressInRow(rendered, prefix, 'remove', 0);
      }
      await submitForm(rendered);
      const error = byTestId(rendered.host, `admin-profile-${prefix}-error`);

      expect({
        rows: rowsOf(rendered.host, prefix).length,
        submitted: rendered.submitted.length,
        error: error ? { role: error.getAttribute('role'), text: normalized(error) } : null,
      }).toEqual({ rows: 0, submitted: 0, error: { role: 'alert', text: message } });
    },
  );

  it.each([
    {
      testId: 'paragraph-text',
      limit: 1200,
      message: 'Le paragraphe ne doit pas dépasser 1200\u00a0caractères',
    },
    {
      testId: 'highlight-title',
      limit: 60,
      message: 'Le titre ne doit pas dépasser 60\u00a0caractères',
    },
    {
      testId: 'highlight-description',
      limit: 400,
      message: 'La description ne doit pas dépasser 400\u00a0caractères',
    },
    {
      testId: 'activity-title',
      limit: 60,
      message: 'Le titre ne doit pas dépasser 60\u00a0caractères',
    },
    {
      testId: 'activity-description',
      limit: 600,
      message: 'La description ne doit pas dépasser 600\u00a0caractères',
    },
  ])(
    'Given $testId one character over $limit When the form is submitted Then nothing is emitted and its error gives the limit',
    async ({ testId, limit, message }) => {
      const rendered = await renderForm();

      await typeInRow(rendered, testId, 0, 'a'.repeat(limit + 1));
      await submitForm(rendered);

      expect({
        submitted: rendered.submitted.length,
        error: rowError(rendered.host, testId),
      }).toEqual({ submitted: 0, error: message });
    },
  );

  it.each([
    { testId: 'paragraph-text' },
    { testId: 'highlight-description' },
    { testId: 'activity-title' },
  ])(
    'Given $testId made of blanks only When the form is submitted Then nothing is emitted and it is required',
    async ({ testId }) => {
      const rendered = await renderForm();

      await typeInRow(rendered, testId, 0, '  \n ');
      await submitForm(rendered);

      expect({
        submitted: rendered.submitted.length,
        error: rowError(rendered.host, testId),
      }).toEqual({ submitted: 0, error: REQUIRED_MESSAGE });
    },
  );

  it.each(ORDERED_LISTS)(
    'Given $max $prefix rows When the add button renders Then it is announced as unavailable and adds nothing',
    async ({ prefix, max, full }) => {
      const rendered = await renderForm(full(max));

      await addRow(rendered, prefix);

      expect({
        ariaDisabled: addButton(rendered.host, prefix)?.getAttribute('aria-disabled'),
        rows: rowsOf(rendered.host, prefix).length,
      }).toEqual({ ariaDisabled: 'true', rows: max });
    },
  );
});

async function chooseInRow(
  rendered: RenderedForm,
  testId: string,
  index: number,
  value: string,
): Promise<void> {
  const field = rowField(rendered.host, testId, index);
  expect(field).toBeInstanceOf(HTMLSelectElement);
  if (!(field instanceof HTMLSelectElement)) return;
  field.value = value;
  field.dispatchEvent(new Event('input'));
  field.dispatchEvent(new Event('change'));
  await settle(rendered.fixture);
}

const STACK_AND_DIPLOMAS = [
  {
    prefix: 'technology',
    section: 'profile-work',
    add: 'Ajouter une technologie',
    remove: 'Supprimer la technologie 1',
    max: 18,
    full: (count: number): ProfileContent =>
      aProfileContent({
        technologies: Array.from({ length: count }, (_, i) => aTechnology({ id: `tech-${i}` })),
      }),
  },
  {
    prefix: 'diploma',
    section: 'profile-diplomas',
    add: 'Ajouter une formation',
    remove: 'Supprimer la formation 1',
    max: 8,
    full: (count: number): ProfileContent =>
      aProfileContent({
        diplomas: Array.from({ length: count }, (_, i) => aDiploma({ id: `diploma-${i}` })),
      }),
  },
] as const;

describe('AdminProfileForm: stack et formations', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it.each(STACK_AND_DIPLOMAS)(
    'Given the witness content When the form renders Then the $prefix rows stand in $section, with « $remove » and « $add »',
    async ({ prefix, section, add, remove }) => {
      const { host } = await renderForm();
      const rows = rowsOf(host, prefix);

      expect({
        rows: rows.length,
        section: rows[0]?.closest('fieldset[id^="profile-"]')?.id ?? null,
        actions: [...(rows[0]?.querySelectorAll('button') ?? [])].map(
          (button) => button.getAttribute('aria-label') ?? '',
        ),
        add: normalized(addButton(host, prefix)),
      }).toEqual({ rows: 1, section, actions: [remove], add });
    },
  );

  it('Given the witness content When the form renders Then each technology and diploma field shows its value under its numbered label, skills one per line', async () => {
    const { host } = await renderForm();
    const read = (testId: string): { value: string | undefined; label: string | null } => {
      const field = rowField(host, testId, 0);
      return { value: field?.value, label: labelOf(host, field) };
    };

    expect({
      technology: ['technology-name', 'technology-category', 'technology-icon'].map(read),
      diploma: [
        'diploma-title',
        'diploma-provider',
        'diploma-level',
        'diploma-description',
        'diploma-skills',
      ].map(read),
    }).toEqual({
      technology: [
        { value: 'Techno témoin', label: 'Nom de la technologie 1' },
        { value: 'Catégorie témoin', label: 'Catégorie de la technologie 1' },
        { value: 'angular', label: 'Icône de la technologie 1' },
      ],
      diploma: [
        { value: 'Formation témoin', label: 'Intitulé de la formation 1' },
        { value: 'Organisme témoin', label: 'Organisme de la formation 1' },
        { value: 'Niveau témoin', label: 'Niveau de la formation 1' },
        { value: 'Description de la formation témoin.', label: 'Description de la formation 1' },
        { value: 'Compétence A\nCompétence B', label: 'Compétences de la formation 1' },
      ],
    });
  });

  it('Given the icon field When it renders Then it is a select offering a disabled prompt then exactly the closed list of icons', async () => {
    const { host } = await renderForm();
    const select = rowField(host, 'technology-icon', 0);
    const options = select instanceof HTMLSelectElement ? [...select.options] : [];

    expect({
      tag: select?.tagName,
      values: options.map((option) => option.value),
      promptDisabled: options[0]?.disabled,
    }).toEqual({
      tag: 'SELECT',
      values: ['', ...TECHNOLOGY_ICONS],
      promptDisabled: true,
    });
  });

  it('Given a technology added and named but without icon When the form is submitted Then nothing is emitted and the icon is required', async () => {
    vi.spyOn(crypto, 'randomUUID').mockReturnValue(NEW_ID);
    const rendered = await renderForm();

    await addRow(rendered, 'technology');
    await typeInRow(rendered, 'technology-name', 1, 'Docker');
    await typeInRow(rendered, 'technology-category', 1, 'Conteneurs');
    await submitForm(rendered);

    expect({
      selected: rowField(rendered.host, 'technology-icon', 1)?.value,
      submitted: rendered.submitted.length,
      error: rowError(rendered.host, 'technology-icon'),
    }).toEqual({ selected: '', submitted: 0, error: REQUIRED_MESSAGE });
  });

  it('Given a technology added, named and given the docker icon When the form is submitted Then it ends the stack with a drawn id', async () => {
    vi.spyOn(crypto, 'randomUUID').mockReturnValue(NEW_ID);
    const rendered = await renderForm();

    await addRow(rendered, 'technology');
    await typeInRow(rendered, 'technology-name', 1, 'Docker');
    await typeInRow(rendered, 'technology-category', 1, 'Conteneurs');
    await chooseInRow(rendered, 'technology-icon', 1, 'docker');
    await submitForm(rendered);

    expect(rendered.submitted.map((content) => content.technologies)).toEqual([
      [aTechnology(), { id: NEW_ID, name: 'Docker', category: 'Conteneurs', icon: 'docker' }],
    ]);
  });

  it('Given a stored technology whose icon left the closed list When the form is submitted Then nothing is emitted until an icon is chosen', async () => {
    const rendered = await renderForm(
      aProfileContent({ technologies: [aTechnology({ icon: 'vue' })] }),
    );

    await submitForm(rendered);
    const blocked = rendered.submitted.length;
    await chooseInRow(rendered, 'technology-icon', 0, 'typescript');
    await submitForm(rendered);

    expect({
      blocked,
      error: rowError(rendered.host, 'technology-icon'),
      icons: rendered.submitted.map((content) => content.technologies.map((tech) => tech.icon)),
    }).toEqual({ blocked: 0, error: null, icons: [['typescript']] });
  });

  it('Given skills typed with blank lines and surrounding spaces When the form is submitted Then each non-empty line is one trimmed skill', async () => {
    const rendered = await renderForm();

    await typeInRow(rendered, 'diploma-skills', 0, '  Rigueur \n\n Méthode\n\t\n');
    await submitForm(rendered);

    expect(rendered.submitted.map((content) => content.diplomas[0]?.skills)).toEqual([
      ['Rigueur', 'Méthode'],
    ]);
  });

  it.each([
    { given: 'only blank lines', skills: ' \n\n\t', error: REQUIRED_MESSAGE },
    {
      given: 'a skill of 81 characters',
      skills: `Rigueur\n${'a'.repeat(81)}`,
      error: 'Chaque compétence ne doit pas dépasser 80\u00a0caractères',
    },
    {
      given: '13 skills',
      skills: Array.from({ length: 13 }, (_, i) => `Compétence ${i + 1}`).join('\n'),
      error: '12 compétences au plus',
    },
  ])(
    'Given $given in the skills When the form is submitted Then nothing is emitted and the skills field says why',
    async ({ skills, error }) => {
      const rendered = await renderForm();

      await typeInRow(rendered, 'diploma-skills', 0, skills);
      await submitForm(rendered);

      expect({
        submitted: rendered.submitted.length,
        error: rowError(rendered.host, 'diploma-skills'),
      }).toEqual({ submitted: 0, error });
    },
  );

  it('Given exactly 12 skills of 80 characters When the form is submitted Then they are all sent', async () => {
    const rendered = await renderForm();
    const skills = Array.from({ length: 12 }, (_, i) => `${i}`.padEnd(80, 'a'));

    await typeInRow(rendered, 'diploma-skills', 0, skills.join('\n'));
    await submitForm(rendered);

    expect(rendered.submitted.map((content) => content.diplomas[0]?.skills)).toEqual([skills]);
  });

  it.each([
    {
      testId: 'technology-name',
      limit: 40,
      message: 'Le nom ne doit pas dépasser 40\u00a0caractères',
    },
    {
      testId: 'technology-category',
      limit: 40,
      message: 'La catégorie ne doit pas dépasser 40\u00a0caractères',
    },
    {
      testId: 'diploma-title',
      limit: 120,
      message: "L'intitulé ne doit pas dépasser 120\u00a0caractères",
    },
    {
      testId: 'diploma-provider',
      limit: 80,
      message: "L'organisme ne doit pas dépasser 80\u00a0caractères",
    },
    {
      testId: 'diploma-level',
      limit: 80,
      message: 'Le niveau ne doit pas dépasser 80\u00a0caractères',
    },
    {
      testId: 'diploma-description',
      limit: 600,
      message: 'La description ne doit pas dépasser 600\u00a0caractères',
    },
  ])(
    'Given $testId one character over $limit When the form is submitted Then nothing is emitted and its error gives the limit',
    async ({ testId, limit, message }) => {
      const rendered = await renderForm();

      await typeInRow(rendered, testId, 0, 'a'.repeat(limit + 1));
      await submitForm(rendered);

      expect({
        submitted: rendered.submitted.length,
        error: rowError(rendered.host, testId),
      }).toEqual({ submitted: 0, error: message });
    },
  );

  it.each([
    { testId: 'technology-name' },
    { testId: 'technology-category' },
    { testId: 'diploma-title' },
    { testId: 'diploma-provider' },
    { testId: 'diploma-level' },
    { testId: 'diploma-description' },
  ])(
    'Given $testId emptied When the form is submitted Then nothing is emitted and it is required',
    async ({ testId }) => {
      const rendered = await renderForm();

      await typeInRow(rendered, testId, 0, ' ');
      await submitForm(rendered);

      expect({
        submitted: rendered.submitted.length,
        error: rowError(rendered.host, testId),
      }).toEqual({ submitted: 0, error: REQUIRED_MESSAGE });
    },
  );

  it.each([
    { prefix: 'technology', message: 'Ajoutez au moins une technologie.' },
    { prefix: 'diploma', message: 'Ajoutez au moins une formation.' },
  ])(
    'Given the only $prefix removed When the form is submitted Then nothing is emitted and the list says one is needed',
    async ({ prefix, message }) => {
      const rendered = await renderForm();

      await pressInRow(rendered, prefix, 'remove', 0);
      await submitForm(rendered);
      const error = byTestId(rendered.host, `admin-profile-${prefix}-error`);

      expect({
        submitted: rendered.submitted.length,
        error: error ? { role: error.getAttribute('role'), text: normalized(error) } : null,
      }).toEqual({ submitted: 0, error: { role: 'alert', text: message } });
    },
  );

  it.each(STACK_AND_DIPLOMAS)(
    'Given $max $prefix rows When the add button is pressed Then it is announced as unavailable and adds nothing',
    async ({ prefix, max, full }) => {
      const rendered = await renderForm(full(max));

      await addRow(rendered, prefix);

      expect({
        ariaDisabled: addButton(rendered.host, prefix)?.getAttribute('aria-disabled'),
        rows: rowsOf(rendered.host, prefix).length,
      }).toEqual({ ariaDisabled: 'true', rows: max });
    },
  );
});

describe('AdminProfileForm: typographie française', () => {
  it('Given a title typed with an ordinary space before a colon When the form is submitted Then the draft keeps the typing and only the emitted content is normalized', async () => {
    const rendered = await renderForm();

    await typeIn(rendered, 'biography-title', 'Prix : 890');
    await submitForm(rendered);

    expect({
      draft: rendered.value().biographyTitle,
      field: control(rendered.host, 'biography-title')?.value,
      sent: rendered.submitted.map((content) => content.biography.title),
    }).toEqual({ draft: 'Prix : 890', field: 'Prix : 890', sent: ['Prix\u00a0: 890'] });
  });
});

describe('AdminProfileForm: nom des listes (revue F2-F7)', () => {
  it.each([
    { prefix: 'paragraph', name: 'Paragraphes' },
    { prefix: 'highlight', name: 'Traits' },
    { prefix: 'activity', name: 'Activités' },
    { prefix: 'technology', name: 'Stack technique' },
    { prefix: 'diploma', name: 'Formations' },
  ])(
    'Given the $prefix list When the form renders Then its ordered list is named « $name », without adding a heading',
    async ({ prefix, name }) => {
      const { host } = await renderForm();
      const list = rowsOf(host, prefix)[0]?.closest('ol') ?? null;
      const labelledBy = list?.getAttribute('aria-labelledby');
      const label = labelledBy ? host.querySelector(`[id="${labelledBy}"]`) : null;

      expect({
        name: list?.getAttribute('aria-label') ?? normalized(label),
        headings: host.querySelectorAll('h2, h3, h4').length,
      }).toEqual({ name, headings: 0 });
    },
  );
});
