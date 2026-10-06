import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { of, throwError, type Observable } from 'rxjs';
import { AdminProjects } from './admin-projects';
import { ProjectsGateway } from '@features/projects/domain/gateways/projects.gateway';
import {
  makeProject,
  makeProjectImage,
  makeProjectInput,
} from '@features/projects/testing/project-builders';
import { AdminProjectInlineForm } from './components/admin-project-inline-form';
import { HomeGateway } from '@features/home/domain/gateways/home.gateway';
import { ToastStore } from '@shared/ui/toast-store';

function makeProjectsGateway(overrides: Partial<ProjectsGateway> = {}): ProjectsGateway {
  return {
    getAllProjects: () => of([]),
    invalidateAllProjects: () => undefined,
    getFeaturedProjects: () => of([]),
    getCategories: () => of(['Tous']),
    filterProjects: () => of([]),
    getProjectById: () => of(makeProject()),
    createProject: () => of(makeProject()),
    updateProject: () => of(makeProject()),
    deleteProject: () => of(undefined),
    uploadImage: () => of('uploaded-key'),
    ...overrides,
  } as ProjectsGateway;
}

function makeHomeGateway(): HomeGateway {
  return { invalidateBundle: vi.fn() } as unknown as HomeGateway;
}

async function setup(
  projects: ProjectsGateway = makeProjectsGateway(),
): Promise<{ component: AdminProjects; toast: { add: ReturnType<typeof vi.fn> } }> {
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
        filterProjects: () => of([makeProject({ id: '1' }), makeProject({ id: '2' })]),
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
          of([
            makeProject({ id: '1', category: 'Web' }),
            makeProject({ id: '2', category: 'Mobile' }),
          ]),
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
        makeProjectsGateway({ createProject: () => of(makeProject({ id: '99', title: 'Créé' })) }),
      );
      await component.createProject({ data: makeProjectInput(), file: null });
      expect(component.projects().map((p) => p.id)).toContain('99');
      expect(component.showNewForm()).toBe(false);
      expect(toast.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'success' }));
    });

    it('notifie une erreur et n’ajoute rien si la création échoue', async () => {
      const { component, toast } = await setup(
        makeProjectsGateway({
          filterProjects: () => of([makeProject({ id: '1' })]),
          createProject: () => throwError(() => new Error('boom')),
        }),
      );
      await component.createProject({ data: makeProjectInput(), file: null });
      expect(component.projects().map((p) => p.id)).toEqual(['1']);
      expect(toast.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error' }));
    });

    it('crée quand même le projet mais avertit si l’upload image échoue', async () => {
      const { component, toast } = await setup(
        makeProjectsGateway({
          createProject: () => of(makeProject({ id: '99' })),
          uploadImage: () => throwError(() => new Error('upload')),
        }),
      );
      await component.createProject({ data: makeProjectInput(), file: new File([], 'img.png') });
      expect(component.projects().map((p) => p.id)).toContain('99');
      expect(toast.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'warn' }));
    });
  });

  describe('updateProject', () => {
    it('remplace le projet et notifie le succès', async () => {
      const { component, toast } = await setup(
        makeProjectsGateway({
          filterProjects: () => of([makeProject({ id: '1', title: 'Avant' })]),
          updateProject: () => of(makeProject({ id: '1', title: 'Après' })),
        }),
      );
      component.updateProject('1', { data: makeProjectInput({ title: 'Après' }), file: null });
      expect(component.projects().find((p) => p.id === '1')?.title).toBe('Après');
      expect(component.editingId()).toBeNull();
      expect(toast.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'success' }));
    });

    it('notifie une erreur si la mise à jour échoue', async () => {
      const { component, toast } = await setup(
        makeProjectsGateway({
          filterProjects: () => of([makeProject({ id: '1' })]),
          updateProject: () => throwError(() => new Error('boom')),
        }),
      );
      component.updateProject('1', { data: makeProjectInput(), file: null });
      expect(toast.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error' }));
    });
  });

  describe('deleteProject', () => {
    it('retire le projet de façon optimiste et notifie le succès', async () => {
      const { component, toast } = await setup(
        makeProjectsGateway({
          filterProjects: () => of([makeProject({ id: '1' }), makeProject({ id: '2' })]),
          deleteProject: () => of(undefined),
        }),
      );
      component.deleteProject(makeProject({ id: '1' }));
      expect(component.projects().map((p) => p.id)).toEqual(['2']);
      expect(toast.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'success' }));
    });

    it('restaure la liste et notifie une erreur si la suppression échoue', async () => {
      const { component, toast } = await setup(
        makeProjectsGateway({
          filterProjects: () => of([makeProject({ id: '1' }), makeProject({ id: '2' })]),
          deleteProject: () => throwError(() => new Error('boom')),
        }),
      );
      component.deleteProject(makeProject({ id: '1' }));
      expect(component.projects().map((p) => p.id)).toEqual(['1', '2']);
      expect(toast.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error' }));
    });
  });
});

describe('AdminProjects: galerie du projet en édition', () => {
  const GALLERY = [
    makeProjectImage({ id: 'img-a', alt: 'Vue globale' }),
    makeProjectImage({ id: 'img-b', alt: 'Transactions' }),
  ];

  async function renderEditing(editing: boolean): Promise<{
    fixture: ComponentFixture<AdminProjects>;
    host: HTMLElement;
    invalidateAllProjects: ReturnType<typeof vi.fn>;
    invalidateBundle: ReturnType<typeof vi.fn>;
  }> {
    const invalidateAllProjects = vi.fn();
    const invalidateBundle = vi.fn();
    TestBed.configureTestingModule({
      providers: [
        {
          provide: ProjectsGateway,
          useValue: {
            ...makeProjectsGateway({
              filterProjects: () => of([makeProject({ id: '1', gallery: GALLERY })]),
              invalidateAllProjects,
            }),
            deleteGalleryImage: (): Observable<void> => of(undefined),
          },
        },
        { provide: HomeGateway, useValue: { invalidateBundle } },
        { provide: ToastStore, useValue: { add: vi.fn() } },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    });
    const fixture = TestBed.createComponent(AdminProjects);
    fixture.detectChanges();
    await fixture.whenStable();
    if (editing) fixture.componentInstance.toggleEdit('1');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return {
      fixture,
      host: fixture.nativeElement as HTMLElement,
      invalidateAllProjects,
      invalidateBundle,
    };
  }

  async function deleteSecondCapture(fixture: ComponentFixture<AdminProjects>): Promise<void> {
    const host = fixture.nativeElement as HTMLElement;
    const second = (): Element | undefined =>
      host.querySelectorAll('[data-testid="admin-gallery-item"]')[1];
    const press = async (testId: string): Promise<void> => {
      const element = second()?.querySelector<HTMLElement>(`[data-testid="${testId}"]`);
      const button = element?.tagName === 'BUTTON' ? element : element?.querySelector('button');
      button?.click();
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
    };
    await press('admin-gallery-item-remove');
    await press('admin-gallery-item-confirm-remove');
  }

  it.each([
    { editing: true, galleries: 1 },
    { editing: false, galleries: 0 },
  ])(
    'Given the row editing is $editing When the list renders Then $galleries gallery block is shown, outside the project form',
    async ({ editing, galleries }) => {
      const { host } = await renderEditing(editing);
      const blocks = [...host.querySelectorAll('[data-testid="admin-project-gallery"]')];

      expect({
        galleries: blocks.length,
        insideForm: blocks.some((block) => block.parentElement?.closest('form') !== null),
      }).toEqual({ galleries, insideForm: false });
    },
  );

  it('Given the open gallery When a capture is deleted Then the project list holds the new gallery and the public caches are invalidated', async () => {
    const { fixture, invalidateAllProjects, invalidateBundle } = await renderEditing(true);

    await deleteSecondCapture(fixture);

    expect({
      gallery: fixture.componentInstance.projects()[0].gallery.map((image) => image.id),
      invalidateAllProjects: invalidateAllProjects.mock.calls.length,
      invalidateBundle: invalidateBundle.mock.calls.length,
    }).toEqual({ gallery: ['img-a'], invalidateAllProjects: 1, invalidateBundle: 1 });
  });

  it('Given an unsaved title in the project form When a capture is deleted Then the title typed so far is kept', async () => {
    const { fixture } = await renderEditing(true);
    const form = (): AdminProjectInlineForm | undefined =>
      fixture.debugElement.query(By.directive(AdminProjectInlineForm))?.componentInstance;
    form()?.form.title().value.set('Titre en cours');

    await deleteSecondCapture(fixture);

    expect({
      title: form()?.form.title().value(),
      gallery: fixture.componentInstance.projects()[0].gallery.map((image) => image.id),
    }).toEqual({ title: 'Titre en cours', gallery: ['img-a'] });
  });
});
