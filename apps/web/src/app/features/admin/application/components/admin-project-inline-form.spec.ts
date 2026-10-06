import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { AdminProjectInlineForm } from './admin-project-inline-form';
import {
  PROJECT_FACT_MAX_LENGTH,
  PROJECT_PITCH_MAX_LENGTH,
  type Project,
  type ProjectInput,
} from '@features/projects/domain/models/project.model';
import { makeProject } from '@features/projects/testing/project-builders';

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

function mount(project?: Project): {
  cmp: AdminProjectInlineForm;
  getEmitted: () => { data: ProjectInput; file: File | null };
} {
  TestBed.configureTestingModule({
    imports: [AdminProjectInlineForm],
    schemas: [NO_ERRORS_SCHEMA],
  });
  const fixture = TestBed.createComponent(AdminProjectInlineForm);
  if (project) fixture.componentRef.setInput('project', project);
  fixture.detectChanges();
  const cmp = fixture.componentInstance;
  let emitted: { data: ProjectInput; file: File | null } | null = null;
  cmp.saved.subscribe((e) => (emitted = e));
  return { cmp, getEmitted: (): { data: ProjectInput; file: File | null } => emitted! };
}

type Saved = { data: ProjectInput; file: File | null };

async function render(project?: Project): Promise<{
  fixture: ComponentFixture<AdminProjectInlineForm>;
  cmp: AdminProjectInlineForm;
  emitted: Saved[];
}> {
  TestBed.configureTestingModule({
    imports: [AdminProjectInlineForm],
    schemas: [NO_ERRORS_SCHEMA],
  });
  const fixture = TestBed.createComponent(AdminProjectInlineForm);
  if (project) fixture.componentRef.setInput('project', project);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  const emitted: Saved[] = [];
  fixture.componentInstance.saved.subscribe((e) => emitted.push(e));
  return { fixture, cmp: fixture.componentInstance, emitted };
}

function kindSelect(fixture: ComponentFixture<AdminProjectInlineForm>): HTMLSelectElement | null {
  return fixture.nativeElement.querySelector('[data-testid="admin-project-kind"]');
}

function chooseKind(fixture: ComponentFixture<AdminProjectInlineForm>, value: string): void {
  const select = kindSelect(fixture);
  if (!select) return;
  select.value = value;
  select.dispatchEvent(new Event('input'));
  select.dispatchEvent(new Event('change'));
  fixture.detectChanges();
}

function fillRequiredFieldsOfNewProject(cmp: AdminProjectInlineForm): void {
  cmp
    .form()
    .value.update((m) => ({ ...m, title: 'X', category: 'Application Web', description: 'D' }));
}

async function submitAndRender(fixture: ComponentFixture<AdminProjectInlineForm>): Promise<void> {
  await fixture.componentInstance.submitProject();
  fixture.detectChanges();
  await fixture.whenStable();
}

describe('AdminProjectInlineForm: soumission', () => {
  it('vider un lien de dépôt émet null (intention d’effacement) et non undefined', async () => {
    const { cmp, getEmitted } = mount(editableProject({ repoUrl: 'https://github.com/x/repo' }));

    cmp.form.repoUrl().value.set(''); // l'utilisateur efface le lien
    await cmp.submitProject();

    // null est sérialisé dans le PATCH (effacement) ; undefined serait supprimé par JSON.stringify.
    expect(getEmitted().data.repoUrl).toBeNull();
  });

  it('conserve un lien de dépôt renseigné', async () => {
    const { cmp, getEmitted } = mount(editableProject({ repoUrl: '' }));

    cmp.form.repoUrl().value.set('https://github.com/y/repo');
    await cmp.submitProject();

    expect(getEmitted().data.repoUrl).toBe('https://github.com/y/repo');
  });

  it('un champ URL laissé vide émet null (pas de clé manquante dans le PATCH)', async () => {
    const { cmp, getEmitted } = mount(editableProject({ liveUrl: undefined, repoUrl: undefined }));

    await cmp.submitProject();

    expect(getEmitted().data.liveUrl).toBeNull();
    expect(getEmitted().data.repoUrl).toBeNull();
  });
});

describe('listes détail (techChoices / architectureDecisions)', () => {
  it('ajoute et retire une ligne de choix technique', () => {
    const fixture = TestBed.createComponent(AdminProjectInlineForm);
    const cmp = fixture.componentInstance;
    fixture.detectChanges();

    expect(cmp.form.techChoices.length).toBe(0);
    cmp.addTechChoice();
    expect(cmp.form.techChoices.length).toBe(1);
    cmp.removeTechChoice(0);
    expect(cmp.form.techChoices.length).toBe(0);
  });

  it('émet techChoices et architectureDecisions à la soumission', async () => {
    const fixture = TestBed.createComponent(AdminProjectInlineForm);
    const cmp = fixture.componentInstance;
    fixture.detectChanges();

    cmp
      .form()
      .value.update((m) => ({ ...m, title: 'X', category: 'Application Web', description: 'D' }));
    chooseKind(fixture, 'demo');
    cmp.addTechChoice();
    cmp.form.techChoices[0]().value.set({ techno: 'NestJS', why: 'modulaire' });
    cmp.addArchitectureDecision();
    cmp.form.architectureDecisions[0]().value.set({
      decision: 'hexagonale',
      rationale: 'testable',
    });

    let emitted: { data: { techChoices?: unknown; architectureDecisions?: unknown } } | undefined;
    cmp.saved.subscribe((e) => (emitted = e));
    await cmp.submitProject();

    expect(emitted?.data.techChoices).toEqual([{ techno: 'NestJS', why: 'modulaire' }]);
    expect(emitted?.data.architectureDecisions).toEqual([
      { decision: 'hexagonale', rationale: 'testable' },
    ]);
  });
});

describe('AdminProjectInlineForm: nature du projet', () => {
  it('Given the form When it renders Then the nature select offers a disabled prompt then the three natures', async () => {
    const { fixture } = await render();

    const options = [...(kindSelect(fixture)?.options ?? [])].map((option) => ({
      value: option.value,
      label: option.textContent?.trim(),
      disabled: option.disabled,
    }));

    expect(options).toEqual([
      { value: '', label: 'Choisir une nature', disabled: true },
      { value: 'production', label: 'En production', disabled: false },
      { value: 'demo', label: 'Démo', disabled: false },
      { value: 'script', label: 'Script', disabled: false },
    ]);
  });

  it('Given the form When it renders Then the nature select is labelled « Nature » and marked required', async () => {
    const { fixture } = await render();
    const select = kindSelect(fixture);
    const label = select?.id
      ? (fixture.nativeElement as HTMLElement).querySelector(`label[for="${select.id}"]`)
      : null;

    expect({
      label: label?.textContent?.trim(),
      ariaRequired: select?.getAttribute('aria-required'),
    }).toEqual({ label: 'Nature', ariaRequired: 'true' });
  });

  it('Given a new project When the form renders Then no nature is preselected', async () => {
    const { fixture } = await render();

    expect(kindSelect(fixture)?.value).toBe('');
  });

  it('Given a new project without nature When it is submitted Then nothing is emitted and the select shows a required error', async () => {
    const { fixture, cmp, emitted } = await render();
    fillRequiredFieldsOfNewProject(cmp);

    await submitAndRender(fixture);
    const error = (fixture.nativeElement as HTMLElement).querySelector(
      '[data-testid="admin-project-kind-error"]',
    );

    expect({
      emitted: emitted.length,
      role: error?.getAttribute('role'),
      message: error?.textContent?.trim(),
    }).toEqual({ emitted: 0, role: 'alert', message: 'Ce champ est obligatoire' });
  });

  it.each(['production', 'demo', 'script'] as const)(
    'Given a new project When the admin chooses %s Then the payload carries that nature',
    async (kind) => {
      const { fixture, cmp, emitted } = await render();
      fillRequiredFieldsOfNewProject(cmp);

      chooseKind(fixture, kind);
      await submitAndRender(fixture);

      expect(emitted.map((e) => e.data.kind)).toEqual([kind]);
    },
  );

  it.each(['production', 'demo', 'script'] as const)(
    'Given a project of nature %s When it is edited Then the select shows it and an unchanged submit keeps it',
    async (kind) => {
      const { fixture, emitted } = await render(editableProject({ kind }));
      const selected = kindSelect(fixture)?.value;

      await submitAndRender(fixture);

      expect({ selected, emitted: emitted.map((e) => e.data.kind) }).toEqual({
        selected: kind,
        emitted: [kind],
      });
    },
  );

  it('Given a project without nature When it is edited Then the select is empty and the submit is blocked until a nature is chosen', async () => {
    const { fixture, emitted } = await render(editableProject({ kind: null }));
    const selected = kindSelect(fixture)?.value;

    await submitAndRender(fixture);
    const blocked = emitted.length;
    chooseKind(fixture, 'demo');
    await submitAndRender(fixture);

    expect({ selected, blocked, emitted: emitted.map((e) => e.data.kind) }).toEqual({
      selected: '',
      blocked: 0,
      emitted: ['demo'],
    });
  });

  it('Given an edited project When it is submitted Then the payload is exactly the writable fields, nature included', async () => {
    const { fixture, emitted } = await render(editableProject({ kind: 'script' }));

    await submitAndRender(fixture);

    expect(emitted.map((e) => e.data)).toEqual([
      {
        title: 'Projet',
        category: 'Application Web',
        tags: ['Angular'],
        description: 'Une description suffisante',
        liveUrl: null,
        repoUrl: 'https://github.com/x/repo',
        repoUrlFront: null,
        repoUrlBack: null,
        featured: false,
        order: 0,
        techChoices: [],
        architectureDecisions: [],
        kind: 'script',
        pitch: null,
        highlight: null,
        scope: null,
      },
    ]);
  });
});

const PRESENTATION_FIELDS = [
  {
    field: 'pitch',
    label: 'Accroche',
    tag: 'TEXTAREA',
    max: 160,
    hint: '160 caractères au plus',
    message: "L'accroche ne doit pas dépasser 160 caractères",
    existing: 'Le budget familial dans une seule app.',
  },
  {
    field: 'highlight',
    label: 'Point fort',
    tag: 'INPUT',
    max: 80,
    hint: '80 caractères au plus',
    message: 'Le point fort ne doit pas dépasser 80 caractères',
    existing: 'Chiffrement de bout en bout côté client',
  },
  {
    field: 'scope',
    label: 'Périmètre',
    tag: 'INPUT',
    max: 80,
    hint: '80 caractères au plus',
    message: 'Le périmètre ne doit pas dépasser 80 caractères',
    existing: 'Conception, développement, déploiement',
  },
] as const;

type PresentationField = (typeof PRESENTATION_FIELDS)[number]['field'];
type TextControl = HTMLInputElement | HTMLTextAreaElement;

function root(fixture: ComponentFixture<AdminProjectInlineForm>): HTMLElement {
  return fixture.nativeElement as HTMLElement;
}

function normalized(text: string | null | undefined): string | undefined {
  return text?.replace(/\s+/g, ' ').trim();
}

function presentationControl(
  fixture: ComponentFixture<AdminProjectInlineForm>,
  field: PresentationField,
): TextControl | null {
  return root(fixture).querySelector(`[data-testid="admin-project-${field}"]`);
}

function presentationError(
  fixture: ComponentFixture<AdminProjectInlineForm>,
  field: PresentationField,
): HTMLElement | null {
  return root(fixture).querySelector(`[data-testid="admin-project-${field}-error"]`);
}

function existingControl(
  fixture: ComponentFixture<AdminProjectInlineForm>,
  field: PresentationField,
): TextControl {
  const control = presentationControl(fixture, field);
  expect(control).toBeInstanceOf(HTMLElement);
  return control as TextControl;
}

async function typeIn(
  fixture: ComponentFixture<AdminProjectInlineForm>,
  field: PresentationField,
  value: string,
): Promise<void> {
  const control = existingControl(fixture, field);
  control.value = value;
  control.dispatchEvent(new Event('input'));
  fixture.detectChanges();
  await fixture.whenStable();
}

async function leave(
  fixture: ComponentFixture<AdminProjectInlineForm>,
  field: PresentationField,
): Promise<void> {
  existingControl(fixture, field).dispatchEvent(new Event('blur'));
  fixture.detectChanges();
  await fixture.whenStable();
}

function describedTexts(
  fixture: ComponentFixture<AdminProjectInlineForm>,
  control: TextControl | null,
): (string | undefined)[] {
  const ids = control?.getAttribute('aria-describedby')?.split(/\s+/).filter(Boolean) ?? [];
  return ids.map((id) => normalized(root(fixture).querySelector(`[id="${id}"]`)?.textContent));
}

function presentedProject(): Project {
  return editableProject({
    kind: 'production',
    pitch: PRESENTATION_FIELDS[0].existing,
    highlight: PRESENTATION_FIELDS[1].existing,
    scope: PRESENTATION_FIELDS[2].existing,
  });
}

describe('AdminProjectInlineForm: présentation dans les Réalisations', () => {
  it('Given the shared bounds When they are read Then the pitch allows 160 characters and each fact 80', () => {
    expect({ pitch: PROJECT_PITCH_MAX_LENGTH, fact: PROJECT_FACT_MAX_LENGTH }).toEqual({
      pitch: 160,
      fact: 80,
    });
  });

  it('Given the form When it renders Then a fieldset after the description groups the pitch, the highlight and the scope', async () => {
    const { fixture } = await render();
    const fieldset = root(fixture).querySelector('[data-testid="admin-project-presentation"]');
    const description = root(fixture).querySelector('#description');
    const follows =
      !!description &&
      !!fieldset &&
      (description.compareDocumentPosition(fieldset) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0;

    expect({
      tag: fieldset?.tagName,
      legend: normalized(fieldset?.querySelector('legend')?.textContent),
      controls: [...(fieldset?.querySelectorAll('[data-testid^="admin-project-"]') ?? [])]
        .map((el) => el.getAttribute('data-testid'))
        .filter((id) => PRESENTATION_FIELDS.some(({ field }) => id === `admin-project-${field}`)),
      follows,
    }).toEqual({
      tag: 'FIELDSET',
      legend: 'Présentation dans les Réalisations',
      controls: ['admin-project-pitch', 'admin-project-highlight', 'admin-project-scope'],
      follows: true,
    });
  });

  it('Given a project without presentation When it is edited Then the three fields are empty', async () => {
    const { fixture } = await render(editableProject({ kind: 'demo' }));

    expect(
      PRESENTATION_FIELDS.map(({ field }) => presentationControl(fixture, field)?.value),
    ).toEqual(['', '', '']);
  });

  it('Given a pitch over the limit shown in error When the form is read Then the submit button stays enabled', async () => {
    const { fixture } = await render(presentedProject());

    await typeIn(fixture, 'pitch', 'a'.repeat(161));
    await leave(fixture, 'pitch');
    const button = root(fixture).querySelector<HTMLButtonElement>('button[type="submit"]');

    expect({
      error: normalized(presentationError(fixture, 'pitch')?.textContent),
      disabled: button?.disabled,
    }).toEqual({ error: "L'accroche ne doit pas dépasser 160 caractères", disabled: false });
  });

  describe.each(PRESENTATION_FIELDS)('$label', (spec) => {
    it('Given the form When it renders Then the field is labelled, optional and announces its limit', async () => {
      const { fixture } = await render();
      const control = presentationControl(fixture, spec.field);
      const label = control?.id ? root(fixture).querySelector(`label[for="${control.id}"]`) : null;

      expect({
        tag: control?.tagName,
        type: control instanceof HTMLInputElement ? control.type : 'textarea',
        label: normalized(label?.textContent),
        ariaRequired: control?.getAttribute('aria-required') ?? null,
        described: describedTexts(fixture, control),
      }).toEqual({
        tag: spec.tag,
        type: spec.tag === 'INPUT' ? 'text' : 'textarea',
        label: spec.label,
        ariaRequired: null,
        described: [spec.hint],
      });
    });

    it('Given a project with that text When it is edited and submitted unchanged Then the field shows it and the payload keeps it', async () => {
      const { fixture, emitted } = await render(presentedProject());
      const shown = presentationControl(fixture, spec.field)?.value;

      await submitAndRender(fixture);

      expect({ shown, sent: emitted.map((e) => e.data[spec.field]) }).toEqual({
        shown: spec.existing,
        sent: [spec.existing],
      });
    });

    it('Given a typed text with surrounding spaces When it is submitted Then the payload carries it trimmed', async () => {
      const { fixture, emitted } = await render(presentedProject());

      await typeIn(fixture, spec.field, '  Texte saisi  ');
      await submitAndRender(fixture);

      expect(emitted.map((e) => e.data[spec.field])).toEqual(['Texte saisi']);
    });

    it.each([
      ['emptied', ''],
      ['left with spaces only', '   '],
    ])(
      'Given a filled field When it is %s and submitted Then the payload sends null to erase it',
      async (_case, value) => {
        const { fixture, emitted } = await render(presentedProject());

        await typeIn(fixture, spec.field, value);
        await submitAndRender(fixture);

        expect(emitted.map((e) => e.data[spec.field])).toEqual([null]);
      },
    );

    it('Given a text over the limit When it is typed Then no error shows until the field is left, then a role=alert error gives the limit', async () => {
      const { fixture } = await render(presentedProject());

      await typeIn(fixture, spec.field, 'a'.repeat(spec.max + 1));
      const before = presentationError(fixture, spec.field);
      await leave(fixture, spec.field);
      const after = presentationError(fixture, spec.field);

      expect({
        before,
        role: after?.getAttribute('role'),
        message: normalized(after?.textContent),
      }).toEqual({ before: null, role: 'alert', message: spec.message });
    });

    it('Given a text exactly at the limit When it is submitted Then it is sent without error', async () => {
      const { fixture, emitted } = await render(presentedProject());
      const atLimit = 'a'.repeat(spec.max);

      await typeIn(fixture, spec.field, atLimit);
      await leave(fixture, spec.field);
      await submitAndRender(fixture);

      expect({
        error: presentationError(fixture, spec.field),
        sent: emitted.map((e) => e.data[spec.field]),
      }).toEqual({ error: null, sent: [atLimit] });
    });

    it('Given a text one character over the limit When it is submitted Then nothing is emitted and the error is revealed', async () => {
      const { fixture, emitted } = await render(presentedProject());

      await typeIn(fixture, spec.field, 'a'.repeat(spec.max + 1));
      await submitAndRender(fixture);

      expect({
        emitted: emitted.length,
        message: normalized(presentationError(fixture, spec.field)?.textContent),
      }).toEqual({ emitted: 0, message: spec.message });
    });
  });
});
