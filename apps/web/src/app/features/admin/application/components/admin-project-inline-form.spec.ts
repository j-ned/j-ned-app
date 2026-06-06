import { TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { AdminProjectInlineForm } from './admin-project-inline-form';
import type { Project, ProjectInput } from '@features/projects/domain';

function makeProject(overrides: Partial<Project> = {}): Project {
  return {
    id: 'p1',
    title: 'Projet',
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

function mount(project?: Project) {
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
