import { inputBinding, signal, twoWayBinding, type WritableSignal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ProjectsGateway } from '@features/projects/domain/gateways/projects.gateway';
import {
  PROJECT_FACT_MAX_LENGTH,
  PROJECT_PITCH_MAX_LENGTH,
  type Project,
  type ProjectImage,
  type ProjectInput,
} from '@features/projects/domain/models/project.model';
import { makeProject, makeProjectImage } from '@features/projects/testing/project-builders';
import { stubProjectsGateway } from '@features/projects/testing/stub-projects-gateway';
import { byTestId, testIdText } from '@shared/testing/by-test-id';
import { pressTestId } from '@shared/testing/press-test-id';
import { settle, settleBounded } from '@shared/testing/settle';
import { ToastStore } from '@shared/ui/toast-store';
import { toProjectDraft, toProjectInput, type ProjectDraft } from '../project-draft';
import { AdminProjectForm } from './admin-project-form';

type FormOptions = {
  readonly project?: Project;
  readonly projectId?: string | null;
  readonly gallery?: readonly ProjectImage[];
  readonly persistedCover?: string;
};

type RenderedForm = {
  readonly fixture: ComponentFixture<AdminProjectForm>;
  readonly host: HTMLElement;
  readonly value: WritableSignal<ProjectDraft>;
  readonly tags: WritableSignal<ReadonlySet<string>>;
  readonly submitted: ProjectInput[];
  readonly covers: File[];
  readonly galleries: (readonly ProjectImage[])[];
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
  const tags = signal<ReadonlySet<string>>(new Set(project?.tags ?? []));
  TestBed.configureTestingModule({
    providers: [
      { provide: ProjectsGateway, useValue: stubProjectsGateway() },
      { provide: ToastStore, useValue: { add: vi.fn() } },
    ],
  });
  const fixture = TestBed.createComponent(AdminProjectForm, {
    bindings: [
      twoWayBinding('value', value),
      twoWayBinding('tags', tags),
      inputBinding('projectId', () => options.projectId ?? null),
      inputBinding('gallery', () => options.gallery ?? []),
      inputBinding('persistedCover', () => options.persistedCover ?? ''),
    ],
  });
  const submitted: ProjectInput[] = [];
  const covers: File[] = [];
  const galleries: (readonly ProjectImage[])[] = [];
  fixture.componentInstance.submitted.subscribe((payload) => submitted.push(payload));
  fixture.componentInstance.coverSelected.subscribe((file) => covers.push(file));
  fixture.componentInstance.galleryChange.subscribe((gallery) => galleries.push(gallery));
  await settle(fixture);
  return {
    fixture,
    host: fixture.nativeElement as HTMLElement,
    value,
    tags,
    submitted,
    covers,
    galleries,
  };
}

const normalized = (element: Element | null | undefined): string =>
  (element?.textContent ?? '').replace(/[ \t\n\r]+/g, ' ').replace(/^ | $/g, '');

const all = (host: ParentNode, testId: string): readonly HTMLElement[] => [
  ...host.querySelectorAll<HTMLElement>(`[data-testid="${testId}"]`),
];

const nativeButton = (element: Element | null): HTMLButtonElement | null =>
  element instanceof HTMLButtonElement ? element : (element?.querySelector('button') ?? null);

const accessibleName = (button: HTMLButtonElement | null): string =>
  button?.getAttribute('aria-label') ?? normalized(button);

const labelOf = (host: HTMLElement, control: HTMLElement | null | undefined): string | null => {
  if (!control?.id) return null;
  const labels = [...host.querySelectorAll('label')].filter(
    (label) => label.getAttribute('for') === control.id,
  );
  return labels.length === 1 ? normalized(labels[0]) : null;
};

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

describe('AdminProjectForm: sections numérotées', () => {
  const SECTION_CONTROLS = [
    {
      title: '01 · Identité',
      controls: [
        'admin-project-title',
        'admin-project-category',
        'admin-project-kind',
        'admin-project-order',
        'admin-project-featured-input',
      ],
    },
    {
      title: '02 · Présentation dans les Réalisations',
      controls: [
        'admin-project-pitch',
        'admin-project-highlight',
        'admin-project-scope',
        'admin-project-description',
        'admin-project-cover',
      ],
    },
    {
      title: '03 · Liens',
      controls: [
        'admin-project-live-url',
        'admin-project-repo-url',
        'admin-project-repo-url-front',
        'admin-project-repo-url-back',
      ],
    },
    {
      title: '04 · Choix techniques',
      controls: ['admin-project-tags', 'tech-choice-add', 'decision-add'],
    },
    { title: '05 · Galerie', controls: ['admin-project-gallery-pending'] },
  ] as const;

  it('Given the form When it renders Then five numbered fieldsets follow one another', async () => {
    const { host } = await renderForm();

    expect(
      all(host, 'form-section').map((section) => ({
        tag: section.tagName,
        title: testIdText(section, 'form-section-title'),
      })),
    ).toEqual(SECTION_CONTROLS.map(({ title }) => ({ tag: 'FIELDSET', title })));
  });

  it.each(SECTION_CONTROLS)(
    'Given a new project When the form renders Then the section $title holds its fields',
    async ({ title, controls }) => {
      const { host } = await renderForm();
      const section = all(host, 'form-section').find(
        (candidate) => testIdText(candidate, 'form-section-title') === title,
      );

      expect(controls.filter((testId) => !section || byTestId(section, testId) === null)).toEqual(
        [],
      );
    },
  );

  it('Given the form When it renders Then the four editing sections live in the form « project-form » and the gallery outside it', async () => {
    const { host } = await renderForm({ project: editableProject(), projectId: 'p1' });
    const form = byTestId(host, 'admin-project-form');

    expect({
      tag: form?.tagName,
      id: form?.id,
      inForm: all(host, 'form-section').map((section) => form?.contains(section) ?? false),
      galleryInAForm:
        byTestId(host, 'admin-project-gallery')?.parentElement?.closest('form') ?? null,
    }).toEqual({
      tag: 'FORM',
      id: 'project-form',
      inForm: [true, true, true, true, false],
      galleryInAForm: null,
    });
  });
});

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

  it('Given the tag chips When the admin selects TypeScript Then the page tag set and the payload hold it', async () => {
    const rendered = await renderForm({ project: editableProject({ kind: 'demo' }) });
    const chip = all(rendered.host, 'tag-chip').find(
      (element) => normalized(element) === 'TypeScript',
    );

    chip?.click();
    await settle(rendered.fixture);
    await submitForm(rendered);

    expect({
      tags: [...rendered.tags()],
      sent: rendered.submitted.map((payload) => payload.tags),
      chipsInTags: byTestId(rendered.host, 'admin-project-tags')?.contains(chip ?? null) ?? false,
    }).toEqual({
      tags: ['Angular', 'TypeScript'],
      sent: [['Angular', 'TypeScript']],
      chipsInTags: true,
    });
  });

  it('Given an edited project When it is submitted unchanged Then the payload is the draft converted with the page tags', async () => {
    const project = editableProject({ kind: 'script' });
    const rendered = await renderForm({ project });

    await submitForm(rendered);

    expect(rendered.submitted).toEqual([
      toProjectInput(toProjectDraft(project), new Set(project.tags), 'script'),
    ]);
  });
});

describe('AdminProjectForm: nature du projet', () => {
  it('Given the form When it renders Then the nature group offers three radio cards with their stamp and definition', async () => {
    const { host } = await renderForm();
    const group = byTestId(host, 'admin-project-kind');

    expect({
      group: group?.tagName,
      legend: testIdText(host, 'admin-project-kind-legend'),
      options: KINDS.map((kind) => {
        const radio = kindRadio(host, kind);
        const card = radio?.closest('label') ?? null;
        return {
          type: radio?.type,
          inGroup: group?.contains(radio) ?? false,
          stamp: card ? testIdText(card, 'admin-project-kind-stamp') : null,
          definition: card ? testIdText(card, 'admin-project-kind-definition') : null,
        };
      }),
    }).toEqual({
      group: 'FIELDSET',
      legend: 'Nature',
      options: [
        {
          type: 'radio',
          inGroup: true,
          stamp: 'En production',
          definition: 'Utilisé pour de vrai',
        },
        { type: 'radio', inGroup: true, stamp: 'Démo', definition: 'Entreprise fictive' },
        {
          type: 'radio',
          inGroup: true,
          stamp: 'Script',
          definition: 'Outil en ligne de commande',
        },
      ],
    });
  });

  it('Given the form When it renders Then the three radios form one required group', async () => {
    const { host } = await renderForm();
    const radios = KINDS.map((kind) => kindRadio(host, kind));
    const names = new Set(radios.map((radio) => radio?.name ?? ''));

    expect({
      oneGroup: names.size === 1 && !names.has(''),
      required: radios.map((radio) => radio?.required ?? false),
    }).toEqual({ oneGroup: true, required: [true, true, true] });
  });

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

const PRESENTATION_FIELDS = [
  {
    field: 'pitch',
    label: 'Accroche',
    tag: 'TEXTAREA',
    max: 160,
    hint: '160\u00a0caractères au plus',
    message: "L'accroche ne doit pas dépasser 160\u00a0caractères",
    existing: 'Le budget familial dans une seule app.',
  },
  {
    field: 'highlight',
    label: 'Point fort',
    tag: 'INPUT',
    max: 80,
    hint: '80\u00a0caractères au plus',
    message: 'Le point fort ne doit pas dépasser 80\u00a0caractères',
    existing: 'Chiffrement de bout en bout côté client',
  },
  {
    field: 'scope',
    label: 'Périmètre',
    tag: 'INPUT',
    max: 80,
    hint: '80\u00a0caractères au plus',
    message: 'Le périmètre ne doit pas dépasser 80\u00a0caractères',
    existing: 'Conception, développement, déploiement',
  },
] as const;

type TextControl = HTMLInputElement | HTMLTextAreaElement;

const presentationControl = (host: HTMLElement, field: string): TextControl | null =>
  byTestId(host, `admin-project-${field}`) as TextControl | null;

const describedTexts = (host: HTMLElement, control: TextControl | null): readonly string[] => {
  const ids = control?.getAttribute('aria-describedby')?.split(/\s+/).filter(Boolean) ?? [];
  return ids.map((id) => normalized(host.querySelector(`[id="${id}"]`)));
};

function presentedProject(): Project {
  return editableProject({
    kind: 'production',
    pitch: PRESENTATION_FIELDS[0].existing,
    highlight: PRESENTATION_FIELDS[1].existing,
    scope: PRESENTATION_FIELDS[2].existing,
  });
}

describe('AdminProjectForm: présentation dans les Réalisations', () => {
  it('Given the shared bounds When they are read Then the pitch allows 160 characters and each fact 80', () => {
    expect({ pitch: PROJECT_PITCH_MAX_LENGTH, fact: PROJECT_FACT_MAX_LENGTH }).toEqual({
      pitch: 160,
      fact: 80,
    });
  });

  it('Given the form When it renders Then the presentation block groups the pitch, the highlight and the scope in that order', async () => {
    const { host } = await renderForm();
    const block = byTestId(host, 'admin-project-presentation');

    expect(
      [...(block?.querySelectorAll('[data-testid^="admin-project-"]') ?? [])]
        .map((element) => element.getAttribute('data-testid'))
        .filter((id) => PRESENTATION_FIELDS.some(({ field }) => id === `admin-project-${field}`)),
    ).toEqual(['admin-project-pitch', 'admin-project-highlight', 'admin-project-scope']);
  });

  it('Given a project without presentation When it is edited Then the three fields are empty', async () => {
    const { host } = await renderForm({ project: editableProject({ kind: 'demo' }) });

    expect(PRESENTATION_FIELDS.map(({ field }) => presentationControl(host, field)?.value)).toEqual(
      ['', '', ''],
    );
  });

  describe.each(PRESENTATION_FIELDS)('$label', (spec) => {
    it('Given the form When it renders Then the field is labelled, optional and announces its limit', async () => {
      const { host } = await renderForm();
      const control = presentationControl(host, spec.field);

      expect({
        tag: control?.tagName,
        type: control instanceof HTMLInputElement ? control.type : 'textarea',
        label: labelOf(host, control),
        ariaRequired: control?.getAttribute('aria-required') ?? null,
        described: describedTexts(host, control),
      }).toEqual({
        tag: spec.tag,
        type: spec.tag === 'INPUT' ? 'text' : 'textarea',
        label: spec.label,
        ariaRequired: null,
        described: [spec.hint],
      });
    });

    it('Given a project with that text When the form renders Then the counter reads its length over the limit', async () => {
      const { host } = await renderForm({ project: presentedProject() });

      expect(testIdText(host, `admin-project-${spec.field}-count`)).toBe(
        `${spec.existing.length} / ${spec.max}`,
      );
    });

    it('Given the counter When the admin types Then it follows the typed length', async () => {
      const rendered = await renderForm({ project: presentedProject() });

      await typeIn(rendered, `admin-project-${spec.field}`, 'a'.repeat(spec.max + 3));

      expect(testIdText(rendered.host, `admin-project-${spec.field}-count`)).toBe(
        `${spec.max + 3} / ${spec.max}`,
      );
    });

    it('Given a project with that text When it is edited and submitted unchanged Then the field shows it and the payload keeps it', async () => {
      const rendered = await renderForm({ project: presentedProject() });
      const shown = presentationControl(rendered.host, spec.field)?.value;

      await submitForm(rendered);

      expect({ shown, sent: rendered.submitted.map((payload) => payload[spec.field]) }).toEqual({
        shown: spec.existing,
        sent: [spec.existing],
      });
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

  it('Given two technical choices and one decision When the form renders Then every repeated field has its own numbered label', async () => {
    const { host } = await renderForm({ project: withRepeatedRows() });
    const labels = (testId: string): readonly (string | null)[] =>
      all(host, testId).map((control) => labelOf(host, control));
    const ids = [
      'tech-choice-techno',
      'tech-choice-why',
      'decision-text',
      'decision-rationale',
    ].flatMap((testId) => all(host, testId).map((control) => control.id));

    expect({
      techno: labels('tech-choice-techno'),
      why: labels('tech-choice-why'),
      decision: labels('decision-text'),
      rationale: labels('decision-rationale'),
      uniqueIds: new Set(ids).size === ids.length && ids.every((id) => id !== ''),
    }).toEqual({
      techno: ['Outil 1', 'Outil 2'],
      why: ['Raison 1', 'Raison 2'],
      decision: ['Décision 1'],
      rationale: ['Justification 1'],
      uniqueIds: true,
    });
  });

  it('Given two technical choices and one decision When the form renders Then each remove action names its row and uses the error token', async () => {
    const { host } = await renderForm({ project: withRepeatedRows() });
    const removals = (testId: string): readonly { name: string; error: boolean }[] =>
      all(host, testId).map((element) => {
        const button = nativeButton(element);
        return {
          name: accessibleName(button),
          error: button?.classList.contains('text-status-error') ?? false,
        };
      });

    expect({
      tech: removals('tech-choice-remove'),
      decision: removals('decision-remove'),
    }).toEqual({
      tech: [
        { name: 'Supprimer le choix technique 1', error: true },
        { name: 'Supprimer le choix technique 2', error: true },
      ],
      decision: [{ name: 'Supprimer la décision 1', error: true }],
    });
  });

  it('Given two technical choices When the first one is removed Then the remaining row is renumbered', async () => {
    const rendered = await renderForm({ project: withRepeatedRows() });

    await pressTestId(rendered.fixture, 'tech-choice-remove', 0);

    expect({
      rows: rendered.value().techChoices.map((row) => ({ techno: row.techno, why: row.why })),
      techno: all(rendered.host, 'tech-choice-techno').map((control) =>
        labelOf(rendered.host, control),
      ),
      remove: all(rendered.host, 'tech-choice-remove').map((element) =>
        accessibleName(nativeButton(element)),
      ),
    }).toEqual({
      rows: [{ techno: 'NestJS', why: 'modules' }],
      techno: ['Outil 1'],
      remove: ['Supprimer le choix technique 1'],
    });
  });
});

describe('AdminProjectForm: étiquettes des champs', () => {
  const localFocusClasses = (control: HTMLElement | null): readonly string[] =>
    [...(control?.classList ?? [])].filter((token) => token.startsWith('focus:'));

  it('Given the form When it renders Then the featured box and the order field carry French labels', async () => {
    const { host } = await renderForm({ project: editableProject() });

    expect({
      featured: labelOf(host, byTestId(host, 'admin-project-featured-input')),
      order: labelOf(host, byTestId(host, 'admin-project-order')),
    }).toEqual({
      featured: "Mettre en avant sur l'accueil",
      order: 'Position dans la liste',
    });
  });

  it('Given the form When it renders Then the order field is a form input and neither field keeps a local focus style', async () => {
    const { host } = await renderForm({ project: editableProject() });
    const order = byTestId(host, 'admin-project-order');
    const featured = byTestId(host, 'admin-project-featured-input');

    expect({
      orderIsFormInput: order?.classList.contains('form-input') ?? false,
      featuredAccent: ['accent-primary-bg', 'size-5'].filter((token) =>
        featured?.classList.contains(token),
      ),
      localFocus: [...localFocusClasses(order), ...localFocusClasses(featured)],
    }).toEqual({
      orderIsFormInput: true,
      featuredAccent: ['accent-primary-bg', 'size-5'],
      localFocus: [],
    });
  });
});

describe('AdminProjectForm: couverture', () => {
  it('Given a persisted cover When the form renders Then the current cover stands beside the drop zone, in one group named « Couverture »', async () => {
    const { host } = await renderForm({
      project: editableProject(),
      persistedCover: 'https://cdn.test/projects/p1.avif',
    });
    const field = byTestId(host, 'admin-project-cover-field');
    const current = byTestId(host, 'admin-project-cover-current');
    const zone = byTestId(host, 'admin-project-cover');
    const image = current?.querySelector('img');
    const labelId = field?.getAttribute('aria-labelledby');

    expect({
      group: field?.getAttribute('role'),
      name: labelId ? normalized(host.querySelector(`[id="${labelId}"]`)) : null,
      currentFirst:
        current && zone
          ? current.compareDocumentPosition(zone) & Node.DOCUMENT_POSITION_FOLLOWING
          : 0,
      inField: [current, zone].map((element) => field?.contains(element ?? null) ?? false),
      image: { src: image?.getAttribute('src'), alt: image?.getAttribute('alt') },
      trigger: normalized(zone && byTestId(zone, 'file-dropzone-trigger')).startsWith(
        "Remplacer l'image",
      ),
      sideBySide: [...(field?.classList ?? [])].some((token) =>
        /(^|:)grid-cols-\[15rem_minmax\(0,1fr\)\]$/.test(token),
      ),
    }).toEqual({
      group: 'group',
      name: 'Couverture',
      currentFirst: Node.DOCUMENT_POSITION_FOLLOWING,
      inField: [true, true],
      image: { src: 'https://cdn.test/projects/p1.avif', alt: 'Couverture actuelle de Projet' },
      trigger: true,
      sideBySide: true,
    });
  });

  it('Given no persisted cover When the form renders Then the drop zone stands alone', async () => {
    const { host } = await renderForm();
    const zone = byTestId(host, 'admin-project-cover');

    expect({
      current: byTestId(host, 'admin-project-cover-current'),
      trigger: zone ? byTestId(zone, 'file-dropzone-trigger') !== null : false,
    }).toEqual({ current: null, trigger: true });
  });

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

describe('AdminProjectForm: galerie', () => {
  const GALLERY = [
    makeProjectImage({ id: 'img-a', alt: 'Vue globale' }),
    makeProjectImage({ id: 'img-b', alt: 'Transactions' }),
  ];

  it('Given a saved project When the form renders Then the gallery lists its captures and no pending notice', async () => {
    const { host } = await renderForm({
      project: editableProject(),
      projectId: 'p1',
      gallery: GALLERY,
    });

    expect({
      items: all(host, 'admin-gallery-item').length,
      pending: byTestId(host, 'admin-project-gallery-pending'),
    }).toEqual({ items: 2, pending: null });
  });

  it('Given a saved project When the gallery section renders Then its legend is its only title', async () => {
    const { host } = await renderForm({
      project: editableProject(),
      projectId: 'p1',
      gallery: GALLERY,
    });
    const section = all(host, 'form-section')[4];

    expect({
      title: section ? testIdText(section, 'form-section-title') : null,
      headings: section?.querySelectorAll('h1, h2, h3, h4, h5, h6').length,
    }).toEqual({ title: '05 · Galerie', headings: 0 });
  });

  it('Given a project not saved yet When the form renders Then the gallery section asks to save first', async () => {
    const { host } = await renderForm();

    expect({
      gallery: byTestId(host, 'admin-project-gallery'),
      pending: testIdText(host, 'admin-project-gallery-pending'),
    }).toEqual({
      gallery: null,
      pending: 'Enregistrez le projet pour ajouter des captures.',
    });
  });

  it('Given the gallery When a capture is deleted Then the new gallery is handed to the page', async () => {
    const rendered = await renderForm({
      project: editableProject(),
      projectId: 'p1',
      gallery: GALLERY,
    });
    const second = (): HTMLElement | null => all(rendered.host, 'admin-gallery-item')[1] ?? null;
    const press = async (testId: string): Promise<void> => {
      const element = second();
      nativeButton(element ? byTestId(element, testId) : null)?.click();
      await settleBounded(rendered.fixture);
    };

    await press('admin-gallery-item-remove');
    await press('admin-gallery-item-confirm-remove');

    expect(rendered.galleries.map((gallery) => gallery.map((image) => image.id))).toEqual([
      ['img-a'],
    ]);
  });
});
