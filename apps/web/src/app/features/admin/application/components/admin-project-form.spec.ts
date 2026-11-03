import { inputBinding, signal, twoWayBinding, type WritableSignal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { type Project, type ProjectInput } from '@features/projects/domain/models/project.model';
import { makeProject } from '@features/projects/testing/project-builders';
import { byTestId, testIdText } from '@shared/testing/by-test-id';
import { pressTestId } from '@shared/testing/press-test-id';
import { settle, settleBounded } from '@shared/testing/settle';
import { toProjectDraft, type ProjectDraft } from '../project-draft';
import { AdminProjectForm } from './admin-project-form';

type FormOptions = {
  readonly project?: Project;
  readonly persistedCover?: string;
};

type RenderedForm = {
  readonly fixture: ComponentFixture<AdminProjectForm>;
  readonly host: HTMLElement;
  readonly value: WritableSignal<ProjectDraft>;
  readonly submitted: ProjectInput[];
  readonly covers: File[];
};

function editableProject(overrides: Partial<Project> = {}): Project {
  return makeProject({
    id: 'p1',
    title: 'Projet',
    slug: 'projet',
    category: 'Application Web',
    tags: ['Angular'],
    description: 'Une description suffisante',
    repoUrl: 'https://github.com/x/repo',
    ...overrides,
  });
}

async function renderForm(options: FormOptions = {}): Promise<RenderedForm> {
  const project = options.project ?? null;
  const value = signal(toProjectDraft(project));
  const fixture = TestBed.createComponent(AdminProjectForm, {
    bindings: [
      twoWayBinding('value', value),
      inputBinding('persistedCover', () => options.persistedCover ?? ''),
    ],
  });
  const submitted: ProjectInput[] = [];
  const covers: File[] = [];
  fixture.componentInstance.submitted.subscribe((payload) => submitted.push(payload));
  fixture.componentInstance.coverSelected.subscribe((file) => covers.push(file));
  await settle(fixture);
  return {
    fixture,
    host: fixture.nativeElement as HTMLElement,
    value,
    submitted,
    covers,
  };
}

const normalized = (element: Element | null | undefined): string =>
  (element?.textContent ?? '').replace(/[ \t\n\r]+/g, ' ').replace(/^ | $/g, '');

const all = (host: ParentNode, testId: string): readonly HTMLElement[] => [
  ...host.querySelectorAll<HTMLElement>(`[data-testid="${testId}"]`),
];

async function submitForm(rendered: RenderedForm): Promise<void> {
  byTestId(rendered.host, 'admin-project-form')?.dispatchEvent(
    new Event('submit', { bubbles: true, cancelable: true }),
  );
  await settleBounded(rendered.fixture);
}

async function typeIn(rendered: RenderedForm, testId: string, text: string): Promise<void> {
  const control = byTestId(rendered.host, testId) as HTMLInputElement | null;
  expect(control).toBeInstanceOf(HTMLElement);
  if (!control) return;
  control.value = text;
  control.dispatchEvent(new Event('input'));
  control.dispatchEvent(new Event('change'));
  await settle(rendered.fixture);
}

async function leave(rendered: RenderedForm, testId: string): Promise<void> {
  byTestId(rendered.host, testId)?.dispatchEvent(new Event('blur'));
  await settle(rendered.fixture);
}

async function chooseKind(rendered: RenderedForm, kind: string): Promise<void> {
  byTestId(rendered.host, `admin-project-kind-${kind}`)?.click();
  await settle(rendered.fixture);
}

const kindRadio = (host: HTMLElement, kind: string): HTMLInputElement | null => {
  const element = byTestId(host, `admin-project-kind-${kind}`);
  return element instanceof HTMLInputElement ? element : null;
};

const KINDS = ['production', 'demo', 'script'] as const;

async function fillRequiredFieldsOfNewProject(rendered: RenderedForm): Promise<void> {
  rendered.value.update((draft) => ({
    ...draft,
    title: 'X',
    category: 'Application Web',
    description: 'D',
  }));
  await settle(rendered.fixture);
}

describe('AdminProjectForm: brouillon possédé par la page', () => {
  it('Given a draft from the page When the form renders Then it shows the draft values', async () => {
    const { host } = await renderForm({ project: editableProject({ title: 'DashFlow' }) });

    expect({
      title: (byTestId(host, 'admin-project-title') as HTMLInputElement | null)?.value,
      category: (byTestId(host, 'admin-project-category') as HTMLSelectElement | null)?.value,
      repoUrl: (byTestId(host, 'admin-project-repo-url') as HTMLInputElement | null)?.value,
    }).toEqual({
      title: 'DashFlow',
      category: 'Application Web',
      repoUrl: 'https://github.com/x/repo',
    });
  });

  it('Given the form When the admin types a title Then the page draft holds it', async () => {
    const rendered = await renderForm({ project: editableProject() });

    await typeIn(rendered, 'admin-project-title', 'Titre en cours');

    expect(rendered.value().title).toBe('Titre en cours');
  });

  it('Given the form When the page replaces its draft Then the fields show the new values', async () => {
    const rendered = await renderForm({ project: editableProject() });

    rendered.value.set(toProjectDraft(editableProject({ title: 'Remplacé', kind: 'demo' })));
    await settle(rendered.fixture);

    expect({
      title: (byTestId(rendered.host, 'admin-project-title') as HTMLInputElement | null)?.value,
      demo: kindRadio(rendered.host, 'demo')?.checked,
    }).toEqual({ title: 'Remplacé', demo: true });
  });

  it('Given an edited project When the form renders Then only its tags are shown', async () => {
    const rendered = await renderForm({
      project: editableProject({ tags: ['Angular', 'NestJS'] }),
    });

    expect(
      all(byTestId(rendered.host, 'admin-project-tags') ?? rendered.host, 'tag-chip').map(
        normalized,
      ),
    ).toEqual(['Angular', 'NestJS']);
  });

  it('Given the tags field When the admin picks TypeScript among the suggestions Then the draft tags and the payload hold it, under the 20 tags of the API', async () => {
    const rendered = await renderForm({ project: editableProject({ kind: 'demo' }) });

    await typeIn(rendered, 'tags-input', 'typesc');
    const options = all(rendered.host, 'tag-option').map(normalized);
    all(rendered.host, 'tag-option')[0]?.click();
    await settle(rendered.fixture);
    await submitForm(rendered);

    expect({
      options,
      tags: rendered.value().tags,
      sent: rendered.submitted.map((payload) => payload.tags),
      hint: normalized(byTestId(rendered.host, 'tags-hint')),
    }).toEqual({
      options: ['TypeScript'],
      tags: ['Angular', 'TypeScript'],
      sent: [['Angular', 'TypeScript']],
      hint: 'Entrée ou virgule pour ajouter un tag. 20 tags au plus, 50 caractères chacun.',
    });
  });
});

describe('AdminProjectForm: nature du projet', () => {
  it('Given a new project When the form renders Then no nature is checked', async () => {
    const { host } = await renderForm();

    expect(KINDS.map((kind) => kindRadio(host, kind)?.checked ?? null)).toEqual([
      false,
      false,
      false,
    ]);
  });

  it('Given a new project without nature When it is submitted Then nothing is emitted and the group shows a required error', async () => {
    const rendered = await renderForm();
    await fillRequiredFieldsOfNewProject(rendered);

    await submitForm(rendered);
    const error = byTestId(rendered.host, 'admin-project-kind-error');

    expect({
      emitted: rendered.submitted.length,
      role: error?.getAttribute('role'),
      message: normalized(error),
    }).toEqual({ emitted: 0, role: 'alert', message: 'Ce champ est obligatoire' });
  });

  it.each(KINDS)(
    'Given a new project When the admin checks %s Then the page draft and the payload carry that nature',
    async (kind) => {
      const rendered = await renderForm();
      await fillRequiredFieldsOfNewProject(rendered);

      await chooseKind(rendered, kind);
      const drafted = rendered.value().kind;
      await submitForm(rendered);

      expect({ drafted, sent: rendered.submitted.map((payload) => payload.kind) }).toEqual({
        drafted: kind,
        sent: [kind],
      });
    },
  );

  it.each(KINDS)(
    'Given a project of nature %s When it is edited Then only its radio is checked and an unchanged submit keeps it',
    async (kind) => {
      const rendered = await renderForm({ project: editableProject({ kind }) });
      const checked = KINDS.filter((candidate) => kindRadio(rendered.host, candidate)?.checked);

      await submitForm(rendered);

      expect({ checked, sent: rendered.submitted.map((payload) => payload.kind) }).toEqual({
        checked: [kind],
        sent: [kind],
      });
    },
  );

  it('Given a project without nature When it is edited Then nothing is checked and the submit is blocked until a nature is chosen', async () => {
    const rendered = await renderForm({ project: editableProject({ kind: null }) });
    const checked = KINDS.filter((kind) => kindRadio(rendered.host, kind)?.checked);

    await submitForm(rendered);
    const blocked = rendered.submitted.length;
    await chooseKind(rendered, 'demo');
    await submitForm(rendered);

    expect({
      checked,
      blocked,
      sent: rendered.submitted.map((payload) => payload.kind),
    }).toEqual({ checked: [], blocked: 0, sent: ['demo'] });
  });
});

const PITCH = {
  field: 'pitch',
  max: 160,
  message: "L'accroche ne doit pas dépasser 160\u00a0caractères",
  existing: 'Le budget familial dans une seule app.',
} as const;

function presentedProject(): Project {
  return editableProject({
    kind: 'production',
    pitch: PITCH.existing,
  });
}

describe('AdminProjectForm: présentation dans les Réalisations', () => {
  describe('pitch', () => {
    const spec = PITCH;
    it('Given the counter When the admin types Then it follows the typed length', async () => {
      const rendered = await renderForm({ project: presentedProject() });

      await typeIn(rendered, `admin-project-${spec.field}`, 'a'.repeat(spec.max + 3));

      expect(testIdText(rendered.host, `admin-project-${spec.field}-count`)).toBe(
        `${spec.max + 3} / ${spec.max}`,
      );
    });

    it('Given a typed text with surrounding spaces When it is submitted Then the payload carries it trimmed', async () => {
      const rendered = await renderForm({ project: presentedProject() });

      await typeIn(rendered, `admin-project-${spec.field}`, '  Texte saisi  ');
      await submitForm(rendered);

      expect(rendered.submitted.map((payload) => payload[spec.field])).toEqual(['Texte saisi']);
    });

    it.each([
      ['emptied', ''],
      ['left with spaces only', '   '],
    ])(
      'Given a filled field When it is %s and submitted Then the payload sends null to erase it',
      async (_case, text) => {
        const rendered = await renderForm({ project: presentedProject() });

        await typeIn(rendered, `admin-project-${spec.field}`, text);
        await submitForm(rendered);

        expect(rendered.submitted.map((payload) => payload[spec.field])).toEqual([null]);
      },
    );

    it('Given a text over the limit When it is typed Then no error shows until the field is left, then a role=alert error gives the limit', async () => {
      const rendered = await renderForm({ project: presentedProject() });

      await typeIn(rendered, `admin-project-${spec.field}`, 'a'.repeat(spec.max + 1));
      const before = byTestId(rendered.host, `admin-project-${spec.field}-error`);
      await leave(rendered, `admin-project-${spec.field}`);
      const after = byTestId(rendered.host, `admin-project-${spec.field}-error`);

      expect({
        before,
        role: after?.getAttribute('role'),
        message: normalized(after),
      }).toEqual({ before: null, role: 'alert', message: spec.message });
    });

    it('Given a text exactly at the limit When it is submitted Then it is sent without error', async () => {
      const rendered = await renderForm({ project: presentedProject() });
      const atLimit = 'a'.repeat(spec.max);

      await typeIn(rendered, `admin-project-${spec.field}`, atLimit);
      await leave(rendered, `admin-project-${spec.field}`);
      await submitForm(rendered);

      expect({
        error: byTestId(rendered.host, `admin-project-${spec.field}-error`),
        sent: rendered.submitted.map((payload) => payload[spec.field]),
      }).toEqual({ error: null, sent: [atLimit] });
    });

    it('Given a text one character over the limit When it is submitted Then nothing is emitted and the error is revealed', async () => {
      const rendered = await renderForm({ project: presentedProject() });

      await typeIn(rendered, `admin-project-${spec.field}`, 'a'.repeat(spec.max + 1));
      await submitForm(rendered);

      expect({
        emitted: rendered.submitted.length,
        message: normalized(byTestId(rendered.host, `admin-project-${spec.field}-error`)),
      }).toEqual({ emitted: 0, message: spec.message });
    });
  });
});

describe('AdminProjectForm: lignes répétées', () => {
  const withRepeatedRows = (): Project =>
    editableProject({
      techChoices: [
        { techno: 'Angular', why: 'signals' },
        { techno: 'NestJS', why: 'modules' },
      ],
      architectureDecisions: [{ decision: 'Hexagonale', rationale: 'tests' }],
    });

  it('Given no technical choice When one is added then removed Then the rows follow', async () => {
    const rendered = await renderForm({ project: editableProject() });
    const rows = (): number => all(rendered.host, 'tech-choice-techno').length;

    const before = rows();
    await pressTestId(rendered.fixture, 'tech-choice-add');
    const added = rows();
    await pressTestId(rendered.fixture, 'tech-choice-remove');

    expect({ before, added, after: rows(), draft: rendered.value().techChoices }).toEqual({
      before: 0,
      added: 1,
      after: 0,
      draft: [],
    });
  });

  it('Given a typed choice and decision When the form is submitted Then the payload carries them', async () => {
    const rendered = await renderForm({ project: editableProject({ kind: 'demo' }) });

    await pressTestId(rendered.fixture, 'tech-choice-add');
    await typeIn(rendered, 'tech-choice-techno', 'NestJS');
    await typeIn(rendered, 'tech-choice-why', 'modulaire');
    await pressTestId(rendered.fixture, 'decision-add');
    await typeIn(rendered, 'decision-text', 'hexagonale');
    await typeIn(rendered, 'decision-rationale', 'testable');
    await submitForm(rendered);

    expect(
      rendered.submitted.map(({ techChoices, architectureDecisions }) => ({
        techChoices,
        architectureDecisions,
      })),
    ).toEqual([
      {
        techChoices: [{ techno: 'NestJS', why: 'modulaire' }],
        architectureDecisions: [{ decision: 'hexagonale', rationale: 'testable' }],
      },
    ]);
  });

  it('Given two technical choices When the first one is removed Then the draft keeps the other row', async () => {
    const rendered = await renderForm({ project: withRepeatedRows() });

    await pressTestId(rendered.fixture, 'tech-choice-remove', 0);

    expect(
      rendered.value().techChoices.map((row) => ({ techno: row.techno, why: row.why })),
    ).toEqual([{ techno: 'NestJS', why: 'modules' }]);
  });
});

describe('AdminProjectForm: couverture', () => {
  it.each([
    { file: new File(['x'], 'cover.png', { type: 'image/png' }), emitted: 1 },
    { file: new File(['x'], 'notes.pdf', { type: 'application/pdf' }), emitted: 0 },
  ])(
    'Given the cover field When $file.name is chosen Then $emitted cover is handed to the page',
    async ({ file, emitted }) => {
      const rendered = await renderForm({ project: editableProject() });

      rendered.fixture.debugElement
        .query(By.css('[data-testid="admin-project-cover"]'))
        ?.triggerEventHandler('fileSelected', file);
      await settle(rendered.fixture);

      expect(rendered.covers).toEqual(emitted === 1 ? [file] : []);
    },
  );
});

const focusedTestId = (): string | null =>
  document.activeElement?.getAttribute('data-testid') ?? null;

const describedIds = (control: HTMLElement | null): readonly string[] =>
  control?.getAttribute('aria-describedby')?.split(/\s+/).filter(Boolean) ?? [];

const elementWithId = (host: HTMLElement, id: string): HTMLElement | null =>
  host.querySelector<HTMLElement>(`[id="${id}"]`);

const announcedError = (
  host: HTMLElement,
  id: string,
): { testId: string | null; role: string | null; text: string } | null => {
  const error = elementWithId(host, id);
  return error
    ? {
        testId: error.getAttribute('data-testid'),
        role: error.getAttribute('role'),
        text: normalized(error),
      }
    : null;
};

describe('AdminProjectForm: soumission invalide', () => {
  it.each([
    {
      given: 'nothing filled in',
      filled: {},
      kind: null,
      row: false,
      focused: 'admin-project-title',
    },
    {
      given: 'only the title',
      filled: { title: 'X' },
      kind: null,
      row: false,
      focused: 'admin-project-category',
    },
    {
      given: 'the title, the category and the description',
      filled: { title: 'X', category: 'Application Web', description: 'D' },
      kind: null,
      row: false,
      focused: 'admin-project-kind-production',
    },
    {
      given: 'a complete identity and an empty technical choice',
      filled: { title: 'X', category: 'Application Web', description: 'D' },
      kind: 'demo',
      row: true,
      focused: 'tech-choice-techno',
    },
  ])(
    'Given a new project with $given When the form is submitted Then the focus lands on $focused and nothing is emitted',
    async ({ filled, kind, row, focused }) => {
      const rendered = await renderForm();
      rendered.value.update((draft) => ({ ...draft, ...filled }));
      await settle(rendered.fixture);
      if (kind) await chooseKind(rendered, kind);
      if (row) await pressTestId(rendered.fixture, 'tech-choice-add');

      await submitForm(rendered);

      expect({ focused: focusedTestId(), submitted: rendered.submitted.length }).toEqual({
        focused,
        submitted: 0,
      });
    },
  );
});

describe('AdminProjectForm: cellules de rangée vides', () => {
  it('Given an empty technical choice added When the form is submitted Then both cells show their error and nothing is emitted', async () => {
    const rendered = await renderForm({ project: editableProject({ kind: 'demo' }) });
    await pressTestId(rendered.fixture, 'tech-choice-add');

    await submitForm(rendered);

    expect({
      submitted: rendered.submitted.length,
      errors: ['tech-choice-techno-error', 'tech-choice-why-error'].map((testId) => {
        const error = byTestId(rendered.host, testId);
        return { id: error?.id, role: error?.getAttribute('role'), text: normalized(error) };
      }),
    }).toEqual({
      submitted: 0,
      errors: [
        { id: 'tech-1-techno-error', role: 'alert', text: 'Ce champ est obligatoire' },
        { id: 'tech-1-why-error', role: 'alert', text: 'Ce champ est obligatoire' },
      ],
    });
  });
});

describe('AdminProjectForm: identité, erreur annoncée et reliée', () => {
  const IDENTITY_FIELDS = [
    { testId: 'admin-project-title', errorId: 'project-title-error' },
    { testId: 'admin-project-category', errorId: 'project-category-error' },
  ] as const;

  it.each(IDENTITY_FIELDS)(
    'Given a new project When $testId is left empty Then it is invalid and described by its error « Ce champ est obligatoire »',
    async ({ testId, errorId }) => {
      const rendered = await renderForm();

      await leave(rendered, testId);
      const control = byTestId(rendered.host, testId);

      expect({
        invalid: control?.getAttribute('aria-invalid'),
        describedBy: describedIds(control),
        error: announcedError(rendered.host, errorId),
      }).toEqual({
        invalid: 'true',
        describedBy: [errorId],
        error: { testId: `${testId}-error`, role: 'alert', text: 'Ce champ est obligatoire' },
      });
    },
  );

  it('Given a new project without nature When it is submitted Then the nature group is an invalid radio group described by its error', async () => {
    const rendered = await renderForm();
    await fillRequiredFieldsOfNewProject(rendered);

    await submitForm(rendered);
    const group = byTestId(rendered.host, 'admin-project-kind');

    expect({
      role: group?.getAttribute('role'),
      invalid: group?.getAttribute('aria-invalid'),
      describedBy: describedIds(group),
      errorId: byTestId(rendered.host, 'admin-project-kind-error')?.id,
    }).toEqual({
      role: 'radiogroup',
      invalid: 'true',
      describedBy: ['project-kind-error'],
      errorId: 'project-kind-error',
    });
  });
});

describe('AdminProjectForm: description, erreur annoncée et reliée', () => {
  it('Given an edited project When the description is emptied then left Then it is invalid and described by its hint then its error', async () => {
    const rendered = await renderForm({ project: editableProject() });

    await typeIn(rendered, 'admin-project-description', '');
    await leave(rendered, 'admin-project-description');
    const control = byTestId(rendered.host, 'admin-project-description');

    expect({
      invalid: control?.getAttribute('aria-invalid'),
      describedBy: describedIds(control),
      error: announcedError(rendered.host, 'project-description-error'),
    }).toEqual({
      invalid: 'true',
      describedBy: ['project-description-hint', 'project-description-error'],
      error: {
        testId: 'admin-project-description-error',
        role: 'alert',
        text: 'Ce champ est obligatoire',
      },
    });
  });

  it('Given the description showing its error When it is filled again Then the error disappears', async () => {
    const rendered = await renderForm({ project: editableProject() });
    await typeIn(rendered, 'admin-project-description', '');
    await leave(rendered, 'admin-project-description');

    await typeIn(rendered, 'admin-project-description', 'Reprise');
    const control = byTestId(rendered.host, 'admin-project-description');

    expect({
      invalid: control?.getAttribute('aria-invalid'),
      error: elementWithId(rendered.host, 'project-description-error'),
    }).toEqual({ invalid: 'false', error: null });
  });
});
