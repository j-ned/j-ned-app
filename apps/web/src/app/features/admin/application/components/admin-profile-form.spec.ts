import { signal, twoWayBinding, type WritableSignal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import type { ProfileContent } from '@features/profile/domain/models/profile-content.model';
import {
  aHighlight,
  aProfileContent,
  aTechnology,
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
  readonly limit: number;
  readonly tooLong: string;
};

const TEXT_FIELDS: readonly TextField[] = [
  {
    key: 'biography-title',
    draftKey: 'biographyTitle',
    limit: 80,
    tooLong: 'Le titre ne doit pas dépasser 80\u00a0caractères',
  },
  {
    key: 'motivation-description',
    draftKey: 'motivationDescription',
    limit: 600,
    tooLong: 'La description ne doit pas dépasser 600\u00a0caractères',
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
    HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null;

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

describe('AdminProfileForm: listes ordonnables (paragraphes, traits, activités)', () => {
  afterEach(() => {
    vi.restoreAllMocks();
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

  it.each([{ testId: 'paragraph-text' }])(
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

describe('AdminProfileForm: stack et formations', () => {
  afterEach(() => {
    vi.restoreAllMocks();
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

  it.each([{ testId: 'technology-name' }, { testId: 'diploma-description' }])(
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
