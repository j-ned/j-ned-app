import { TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { AdminProjectInlineForm } from './admin-project-inline-form';
import type { Project, ProjectInput } from '@features/projects/domain/models/project.model';

function makeProject(overrides: Partial<Project> = {}): Project {
  return {
    id: 'p1',
    title: 'Projet',
    slug: 'projet',
    category: 'Application Web',
    tags: ['Angular'],
    description: 'Une description suffisante',
    image: '',
    featured: false,
    order: 0,
    repoUrl: 'https://github.com/x/repo',
    ...overrides,
  };
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

describe('AdminProjectInlineForm — soumission', () => {
  it('vider un lien de dépôt émet null (intention d’effacement) et non undefined', () => {
    const { cmp, getEmitted } = mount(makeProject({ repoUrl: 'https://github.com/x/repo' }));

    cmp.form.controls.repoUrl.setValue(''); // l'utilisateur efface le lien
    cmp.submitProject();

    // null est sérialisé dans le PATCH (effacement) ; undefined serait supprimé par JSON.stringify.
    expect(getEmitted().data.repoUrl).toBeNull();
  });

  it('conserve un lien de dépôt renseigné', () => {
    const { cmp, getEmitted } = mount(makeProject({ repoUrl: '' }));

    cmp.form.controls.repoUrl.setValue('https://github.com/y/repo');
    cmp.submitProject();

    expect(getEmitted().data.repoUrl).toBe('https://github.com/y/repo');
  });

  it('un champ URL laissé vide émet null (pas de clé manquante dans le PATCH)', () => {
    const { cmp, getEmitted } = mount(makeProject({ liveUrl: undefined, repoUrl: undefined }));

    cmp.submitProject();

    expect(getEmitted().data.liveUrl).toBeNull();
    expect(getEmitted().data.repoUrl).toBeNull();
  });
});

describe('listes détail (techChoices / architectureDecisions)', () => {
  it('ajoute et retire une ligne de choix technique', () => {
    const fixture = TestBed.createComponent(AdminProjectInlineForm);
    const cmp = fixture.componentInstance;
    fixture.detectChanges();

    expect(cmp.form.controls.techChoices.length).toBe(0);
    cmp.addTechChoice();
    expect(cmp.form.controls.techChoices.length).toBe(1);
    cmp.removeTechChoice(0);
    expect(cmp.form.controls.techChoices.length).toBe(0);
  });

  it('émet techChoices et architectureDecisions à la soumission', () => {
    const fixture = TestBed.createComponent(AdminProjectInlineForm);
    const cmp = fixture.componentInstance;
    fixture.detectChanges();

    cmp.form.patchValue({ title: 'X', category: 'Application Web', description: 'D' });
    cmp.addTechChoice();
    cmp.form.controls.techChoices.at(0).setValue({ techno: 'NestJS', why: 'modulaire' });
    cmp.addArchitectureDecision();
    cmp.form.controls.architectureDecisions
      .at(0)
      .setValue({ decision: 'hexagonale', rationale: 'testable' });

    let emitted: { data: { techChoices?: unknown; architectureDecisions?: unknown } } | undefined;
    cmp.saved.subscribe((e) => (emitted = e));
    cmp.submitProject();

    expect(emitted?.data.techChoices).toEqual([{ techno: 'NestJS', why: 'modulaire' }]);
    expect(emitted?.data.architectureDecisions).toEqual([
      { decision: 'hexagonale', rationale: 'testable' },
    ]);
  });
});
