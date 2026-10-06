import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { AdminProjectInlineForm } from './admin-project-inline-form';
import type { Project, ProjectInput } from '@features/projects/domain/models/project.model';
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
      },
    ]);
  });
});
