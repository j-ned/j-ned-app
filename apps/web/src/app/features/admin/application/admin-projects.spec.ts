import { TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { of, throwError } from 'rxjs';
import { AdminProjects } from './admin-projects';
import { ProjectsGateway, type Project, type ProjectInput } from '@features/projects/domain';
import { HomeGateway } from '@features/home/domain';
import { ToastStore } from '@shared/ui';

const project = (p: Partial<Project> = {}): Project => ({
  id: '1',
  title: 'Projet 1',
  slug: `p-${p.id ?? '1'}`,
  category: 'Web',
  tags: ['angular'],
  description: 'desc',
  image: '',
  featured: false,
  order: 0,
  ...p,
});

const input = (p: Partial<ProjectInput> = {}): ProjectInput => ({
  title: 'Nouveau',
  category: 'Web',
  tags: [],
  description: 'desc',
  featured: false,
  order: 0,
  ...p,
});

function makeProjectsGateway(overrides: Partial<ProjectsGateway> = {}): ProjectsGateway {
  return {
    getAllProjects: () => of([]),
    invalidateAllProjects: () => undefined,
    getFeaturedProjects: () => of([]),
    getCategories: () => of(['Tous']),
    filterProjects: () => of([]),
    getProjectById: () => of(project()),
    createProject: () => of(project()),
    updateProject: () => of(project()),
    deleteProject: () => of(undefined),
    uploadImage: () => of('uploaded-key'),
    ...overrides,
  } as ProjectsGateway;
}

function makeHomeGateway(): HomeGateway {
  return { invalidateBundle: vi.fn() } as unknown as HomeGateway;
}

async function setup(projects: ProjectsGateway = makeProjectsGateway()) {
  const toast = { add: vi.fn() };
  TestBed.configureTestingModule({
    providers: [
      { provide: ProjectsGateway, useValue: projects },
      { provide: HomeGateway, useValue: makeHomeGateway() },
      { provide: ToastStore, useValue: toast },
    ],
    schemas: [NO_ERRORS_SCHEMA],
  });
  const fixture = TestBed.createComponent(AdminProjects);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  return { component: fixture.componentInstance, toast };
}

describe('AdminProjects', () => {
  it('charge les projets et catégories depuis le gateway', async () => {
    const { component } = await setup(
      makeProjectsGateway({
        filterProjects: () => of([project({ id: '1' }), project({ id: '2' })]),
        getCategories: () => of(['Tous', 'Web', 'Mobile']),
      }),
    );
    expect(component.projects().map((p) => p.id)).toEqual(['1', '2']);
    expect(component.categories()).toContain('Mobile');
  });

  it('filteredProjects filtre par catégorie sélectionnée', async () => {
    const { component } = await setup(
      makeProjectsGateway({
        filterProjects: () =>
          of([project({ id: '1', category: 'Web' }), project({ id: '2', category: 'Mobile' })]),
      }),
    );
    component.selectedCategory.set('Mobile');
    expect(component.filteredProjects().map((p) => p.id)).toEqual(['2']);
  });

  describe('états de formulaire', () => {
    it('toggleNewForm ouvre le formulaire et ferme une édition en cours', async () => {
      const { component } = await setup();
      component.editingId.set('1');
      component.toggleNewForm();
      expect(component.showNewForm()).toBe(true);
      expect(component.editingId()).toBeNull();
    });

    it('toggleEdit ouvre l’édition et ferme le formulaire de création', async () => {
      const { component } = await setup();
      component.showNewForm.set(true);
      component.toggleEdit('7');
      expect(component.editingId()).toBe('7');
      expect(component.showNewForm()).toBe(false);
    });
  });

  describe('createProject', () => {
    it('ajoute le projet créé et notifie le succès (sans image)', async () => {
      const { component, toast } = await setup(
        makeProjectsGateway({ createProject: () => of(project({ id: '99', title: 'Créé' })) }),
      );
      await component.createProject({ data: input(), file: null });
      expect(component.projects().map((p) => p.id)).toContain('99');
      expect(component.showNewForm()).toBe(false);
      expect(toast.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'success' }));
    });

    it('notifie une erreur et n’ajoute rien si la création échoue', async () => {
      const { component, toast } = await setup(
        makeProjectsGateway({
          filterProjects: () => of([project({ id: '1' })]),
          createProject: () => throwError(() => new Error('boom')),
        }),
      );
      await component.createProject({ data: input(), file: null });
      expect(component.projects().map((p) => p.id)).toEqual(['1']);
      expect(toast.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error' }));
    });

    it('crée quand même le projet mais avertit si l’upload image échoue', async () => {
      const { component, toast } = await setup(
        makeProjectsGateway({
          createProject: () => of(project({ id: '99' })),
          uploadImage: () => throwError(() => new Error('upload')),
        }),
      );
      await component.createProject({ data: input(), file: new File([], 'img.png') });
      expect(component.projects().map((p) => p.id)).toContain('99');
      expect(toast.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'warn' }));
    });
  });

  describe('updateProject', () => {
    it('remplace le projet et notifie le succès', async () => {
      const { component, toast } = await setup(
        makeProjectsGateway({
          filterProjects: () => of([project({ id: '1', title: 'Avant' })]),
          updateProject: () => of(project({ id: '1', title: 'Après' })),
        }),
      );
      component.updateProject('1', { data: input({ title: 'Après' }), file: null });
      expect(component.projects().find((p) => p.id === '1')?.title).toBe('Après');
      expect(component.editingId()).toBeNull();
      expect(toast.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'success' }));
    });

    it('notifie une erreur si la mise à jour échoue', async () => {
      const { component, toast } = await setup(
        makeProjectsGateway({
          filterProjects: () => of([project({ id: '1' })]),
          updateProject: () => throwError(() => new Error('boom')),
        }),
      );
      component.updateProject('1', { data: input(), file: null });
      expect(toast.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error' }));
    });
  });

  describe('deleteProject', () => {
    it('retire le projet de façon optimiste et notifie le succès', async () => {
      const { component, toast } = await setup(
        makeProjectsGateway({
          filterProjects: () => of([project({ id: '1' }), project({ id: '2' })]),
          deleteProject: () => of(undefined),
        }),
      );
      component.deleteProject(project({ id: '1' }));
      expect(component.projects().map((p) => p.id)).toEqual(['2']);
      expect(toast.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'success' }));
    });

    it('restaure la liste et notifie une erreur si la suppression échoue', async () => {
      const { component, toast } = await setup(
        makeProjectsGateway({
          filterProjects: () => of([project({ id: '1' }), project({ id: '2' })]),
          deleteProject: () => throwError(() => new Error('boom')),
        }),
      );
      component.deleteProject(project({ id: '1' }));
      expect(component.projects().map((p) => p.id)).toEqual(['1', '2']);
      expect(toast.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error' }));
    });
  });
});
