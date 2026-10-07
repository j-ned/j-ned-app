import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { NEVER, map, of, throwError, type Observable } from 'rxjs';
import { AdminProjects } from './admin-projects';
import { ProjectsGateway } from '@features/projects/domain/gateways/projects.gateway';
import type { Project } from '@features/projects/domain/models/project.model';
import {
  makeProject,
  makeProjectImage,
  makeProjectInput,
} from '@features/projects/testing/project-builders';
import { AdminProjectInlineForm } from './components/admin-project-inline-form';
import { HomeGateway } from '@features/home/domain/gateways/home.gateway';
import { ToastStore } from '@shared/ui/toast-store';
import { byTestId, testIdText } from '@shared/testing/by-test-id';
import { captureCrash } from '@shared/testing/capture-crash';
import { pressTestId } from '@shared/testing/press-test-id';
import { settle, settleBounded } from '@shared/testing/settle';
import { answerConfirmDialog, readConfirmDialog } from '@shared/ui/testing/confirm-dialog-page';

function makeProjectsGateway(overrides: Partial<ProjectsGateway> = {}): ProjectsGateway {
  const getAllProjects = overrides.getAllProjects ?? ((): Observable<readonly Project[]> => of([]));
  return {
    invalidateAllProjects: () => undefined,
    getFeaturedProjects: () => of([]),
    getCategories: () => of(['Tous']),
    getProjectById: () => of(makeProject()),
    createProject: () => of(makeProject()),
    updateProject: () => of(makeProject()),
    deleteProject: () => of(undefined),
    uploadImage: () => of('uploaded-key'),
    ...overrides,
    getAllProjects,
  } as ProjectsGateway;
}

function makeHomeGateway(): HomeGateway {
  return { invalidateBundle: vi.fn() } as unknown as HomeGateway;
}

async function setup(projects: ProjectsGateway = makeProjectsGateway()): Promise<{
  component: AdminProjects;
  toast: { add: ReturnType<typeof vi.fn> };
  fixture: ComponentFixture<AdminProjects>;
}> {
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
  return { component: fixture.componentInstance, toast, fixture };
}

describe('AdminProjects', () => {
  it('charge les projets et catégories depuis le gateway', async () => {
    const { component } = await setup(
      makeProjectsGateway({
        getAllProjects: () => of([makeProject({ id: '1' }), makeProject({ id: '2' })]),
        getCategories: () => of(['Tous', 'Web', 'Mobile']),
      }),
    );
    expect(component.projects().map((p) => p.id)).toEqual(['1', '2']);
    expect(component.categories()).toContain('Mobile');
  });

  it('filteredProjects filtre par catégorie sélectionnée', async () => {
    const { component } = await setup(
      makeProjectsGateway({
        getAllProjects: () =>
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
          getAllProjects: () => of([makeProject({ id: '1' })]),
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
          getAllProjects: () => of([makeProject({ id: '1', title: 'Avant' })]),
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
          getAllProjects: () => of([makeProject({ id: '1' })]),
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
          getAllProjects: () => of([makeProject({ id: '1' }), makeProject({ id: '2' })]),
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
          getAllProjects: () => of([makeProject({ id: '1' }), makeProject({ id: '2' })]),
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
              getAllProjects: () => of([makeProject({ id: '1', gallery: GALLERY })]),
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

describe('AdminProjects: suppression confirmée', () => {
  const DASHFLOW = makeProject({ id: 'p-1', title: 'DashFlow' });
  const CANDIDASH = makeProject({ id: 'p-2', title: 'CandiDash' });

  async function renderList(): Promise<{
    fixture: ComponentFixture<AdminProjects>;
    host: HTMLElement;
    deleteProject: ReturnType<typeof vi.fn>;
  }> {
    const deleteProject = vi.fn((): Observable<void> => of(undefined));
    TestBed.configureTestingModule({
      providers: [
        {
          provide: ProjectsGateway,
          useValue: makeProjectsGateway({
            getAllProjects: () => of([DASHFLOW, CANDIDASH]),
            deleteProject,
          }),
        },
        { provide: HomeGateway, useValue: makeHomeGateway() },
        { provide: ToastStore, useValue: { add: vi.fn() } },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    });
    const fixture = TestBed.createComponent(AdminProjects);
    await settle(fixture);
    return { fixture, host: fixture.nativeElement as HTMLElement, deleteProject };
  }

  it('Given the list When the trash of DashFlow is pressed Then the dialog asks to confirm and nothing is deleted yet', async () => {
    const { fixture, host, deleteProject } = await renderList();

    await pressTestId(fixture, 'admin-project-delete', 0);

    expect({
      dialog: readConfirmDialog(host),
      deleteCalls: deleteProject.mock.calls.length,
      projects: fixture.componentInstance.projects().map((project) => project.id),
    }).toEqual({
      dialog: {
        open: true,
        heading: 'Supprimer le projet DashFlow\u202f?',
        description:
          "Le projet disparaît des Réalisations et de l'accueil au prochain déploiement, avec ses captures. Cette action est définitive.",
        confirm: 'Supprimer DashFlow',
        cancel: 'Annuler',
      },
      deleteCalls: 0,
      projects: ['p-1', 'p-2'],
    });
  });

  it.each([
    { answer: 'confirm' as const, deleted: [['p-1']], projects: ['p-2'] },
    { answer: 'cancel' as const, deleted: [], projects: ['p-1', 'p-2'] },
    { answer: 'escape' as const, deleted: [], projects: ['p-1', 'p-2'] },
  ])(
    'Given the dialog asks about DashFlow When the user answers $answer Then the gateway deletes $deleted and the dialog closes',
    async ({ answer, deleted, projects }) => {
      const { fixture, host, deleteProject } = await renderList();
      await pressTestId(fixture, 'admin-project-delete', 0);

      await answerConfirmDialog(fixture, answer);

      expect({
        open: readConfirmDialog(host).open,
        deleted: deleteProject.mock.calls,
        projects: fixture.componentInstance.projects().map((project) => project.id),
      }).toEqual({ open: false, deleted, projects });
    },
  );

  it('Given a confirmed deletion When the row disappears Then the focus lands on the page title', async () => {
    const { fixture, host } = await renderList();
    await pressTestId(fixture, 'admin-project-delete', 0);

    await answerConfirmDialog(fixture, 'confirm');
    const title = byTestId(host, 'admin-page-title');

    expect({
      tag: title?.tagName,
      tabindex: title?.getAttribute('tabindex'),
      focused: title !== null && host.ownerDocument.activeElement === title,
    }).toEqual({ tag: 'H1', tabindex: '-1', focused: true });
  });
});

describe('AdminProjects: chargement, erreur et vide', () => {
  const STATE_TEST_IDS = [
    'admin-projects-loading',
    'load-error',
    'admin-projects-empty',
    'admin-projects-list',
  ] as const;

  async function renderWith(getAllProjects: ProjectsGateway['getAllProjects']): Promise<{
    fixture: ComponentFixture<AdminProjects>;
    host: HTMLElement;
    crash: unknown;
  }> {
    TestBed.configureTestingModule({
      providers: [
        { provide: ProjectsGateway, useValue: makeProjectsGateway({ getAllProjects }) },
        { provide: HomeGateway, useValue: makeHomeGateway() },
        { provide: ToastStore, useValue: { add: vi.fn() } },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    });
    const fixture = TestBed.createComponent(AdminProjects);
    const crash = await captureCrash(() => settleBounded(fixture));
    return { fixture, host: fixture.nativeElement as HTMLElement, crash };
  }

  const present = (host: HTMLElement): readonly string[] =>
    STATE_TEST_IDS.filter((testId) => byTestId(host, testId) !== null);

  it.each([
    { state: 'loading', stream: NEVER, shown: 'admin-projects-loading' },
    {
      state: 'failed',
      stream: throwError(() => new Error('down')),
      shown: 'load-error',
    },
    { state: 'empty', stream: of([]), shown: 'admin-projects-empty' },
    { state: 'loaded', stream: of([makeProject()]), shown: 'admin-projects-list' },
  ])(
    'Given the project list is $state When the page renders Then only $shown is shown',
    async ({ stream, shown }) => {
      const { host, crash } = await renderWith(() => stream);

      expect({ crash, present: present(host) }).toEqual({ crash: null, present: [shown] });
    },
  );

  it('Given the project list is loading Then the placeholder is announced as a status', async () => {
    const { host } = await renderWith(() => NEVER);

    expect(byTestId(host, 'admin-projects-loading')?.getAttribute('role')).toBe('status');
  });

  it('Given the project list failed When Réessayer is pressed Then the list is requested again and shown', async () => {
    const getAllProjects = vi
      .fn<ProjectsGateway['getAllProjects']>()
      .mockReturnValueOnce(throwError(() => new Error('down')))
      .mockReturnValue(of([makeProject({ id: 'p-1' })]));
    const { fixture, host } = await renderWith(getAllProjects);

    const crash = await captureCrash(() => pressTestId(fixture, 'load-error-retry'));

    expect({ crash, calls: getAllProjects.mock.calls.length, present: present(host) }).toEqual({
      crash: null,
      calls: 2,
      present: ['admin-projects-list'],
    });
  });
});

describe('AdminProjects: liste et catégories en erreur ensemble', () => {
  it('Given the list and the categories failed When Réessayer is pressed Then the categories are requested again and offered', async () => {
    const getAllProjects = vi
      .fn<ProjectsGateway['getAllProjects']>()
      .mockReturnValueOnce(throwError(() => new Error('down')))
      .mockReturnValue(of([makeProject({ id: 'p-1', category: 'Mobile' })]));
    const getCategories = vi
      .fn<ProjectsGateway['getCategories']>()
      .mockReturnValueOnce(throwError(() => new Error('down')))
      .mockReturnValue(of(['Tous', 'Mobile']));
    TestBed.configureTestingModule({
      providers: [
        {
          provide: ProjectsGateway,
          useValue: makeProjectsGateway({ getAllProjects, getCategories }),
        },
        { provide: HomeGateway, useValue: makeHomeGateway() },
        { provide: ToastStore, useValue: { add: vi.fn() } },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    });
    const fixture = TestBed.createComponent(AdminProjects);
    await settleBounded(fixture);

    const crash = await captureCrash(() => pressTestId(fixture, 'load-error-retry'));

    expect({
      crash,
      calls: getCategories.mock.calls.length,
      categories: fixture.componentInstance.categories(),
    }).toEqual({ crash: null, calls: 2, categories: ['Tous', 'Mobile'] });
  });

  it('Given the project list fails and the categories derive from that failure When the page renders Then the error state is shown instead of a frozen loading state', async () => {
    const failing = (): Observable<readonly Project[]> => throwError(() => new Error('down'));
    TestBed.configureTestingModule({
      providers: [
        {
          provide: ProjectsGateway,
          useValue: makeProjectsGateway({
            getAllProjects: failing,
            getCategories: () =>
              failing().pipe(map((projects) => projects.map((project) => project.category))),
          }),
        },
        { provide: HomeGateway, useValue: makeHomeGateway() },
        { provide: ToastStore, useValue: { add: vi.fn() } },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    });
    const fixture = TestBed.createComponent(AdminProjects);
    const crash = await captureCrash(() => settleBounded(fixture));
    const host = fixture.nativeElement as HTMLElement;

    expect({
      crash,
      present: [
        'admin-projects-loading',
        'load-error',
        'admin-projects-empty',
        'admin-projects-list',
      ].filter((testId) => byTestId(host, testId) !== null),
    }).toEqual({ crash: null, present: ['load-error'] });
  });
});

describe('AdminProjects: lignes en français, tampon et édition annoncée', () => {
  const DASHFLOW = makeProject({ id: 'p-1', title: 'DashFlow', featured: true });
  const CANDIDASH = makeProject({ id: 'p-2', title: 'CandiDash', featured: false });

  const normalized = (element: Element | null | undefined): string =>
    (element?.textContent ?? '').replace(/[ \t\n\r]+/g, ' ').replace(/^ | $/g, '');

  const nativeButton = (element: Element | null): HTMLButtonElement | null =>
    element instanceof HTMLButtonElement ? element : (element?.querySelector('button') ?? null);

  const accessibleName = (button: HTMLButtonElement | null): string =>
    button?.getAttribute('aria-label') ?? normalized(button);

  const all = (host: HTMLElement, testId: string): readonly HTMLElement[] => [
    ...host.querySelectorAll<HTMLElement>(`[data-testid="${testId}"]`),
  ];

  async function renderRows(): Promise<{
    fixture: ComponentFixture<AdminProjects>;
    host: HTMLElement;
  }> {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: ProjectsGateway,
          useValue: makeProjectsGateway({ getAllProjects: () => of([DASHFLOW, CANDIDASH]) }),
        },
        { provide: HomeGateway, useValue: makeHomeGateway() },
        { provide: ToastStore, useValue: { add: vi.fn() } },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    });
    const fixture = TestBed.createComponent(AdminProjects);
    await settle(fixture);
    return { fixture, host: fixture.nativeElement as HTMLElement };
  }

  it('Given a featured project When the list renders Then only its row says « Mis en avant »', async () => {
    const { host } = await renderRows();

    expect(all(host, 'admin-project-featured').map((mark) => normalized(mark))).toEqual([
      'Mis en avant',
    ]);
  });

  it('Given a featured project When the list renders Then its mark is a stamp', async () => {
    const { host } = await renderRows();

    expect(all(host, 'admin-project-featured').map((mark) => mark.tagName)).toEqual(['APP-STAMP']);
  });

  it('Given the list When it renders Then each row names its project in its edit and delete actions, editing collapsed', async () => {
    const { host } = await renderRows();

    expect({
      edit: all(host, 'admin-project-edit-toggle').map((el) => {
        const button = nativeButton(el);
        return { name: accessibleName(button), expanded: button?.getAttribute('aria-expanded') };
      }),
      delete: all(host, 'admin-project-delete').map((el) => accessibleName(nativeButton(el))),
    }).toEqual({
      edit: [
        { name: 'Modifier\u00a0: DashFlow', expanded: 'false' },
        { name: 'Modifier\u00a0: CandiDash', expanded: 'false' },
      ],
      delete: ['Supprimer\u00a0: DashFlow', 'Supprimer\u00a0: CandiDash'],
    });
  });

  it('Given the list When the edit toggle of DashFlow is pressed Then it is expanded, renamed to close, and controls the editing panel now shown', async () => {
    const { fixture, host } = await renderRows();

    await pressTestId(fixture, 'admin-project-edit-toggle', 0);
    const button = nativeButton(all(host, 'admin-project-edit-toggle')[0] ?? null);
    const controls = button?.getAttribute('aria-controls') ?? '';
    const panel = controls === '' ? null : host.ownerDocument.getElementById(controls);

    expect({
      name: accessibleName(button),
      expanded: button?.getAttribute('aria-expanded'),
      panelInPage: panel !== null && host.contains(panel),
      panelHoldsForm: panel?.querySelector('app-admin-project-inline-form') != null,
      editingId: fixture.componentInstance.editingId(),
    }).toEqual({
      name: "Fermer l'édition\u00a0: DashFlow",
      expanded: 'true',
      panelInPage: true,
      panelHoldsForm: true,
      editingId: 'p-1',
    });
  });
});

describe('AdminProjects: en-tête de page', () => {
  it('Given two projects of which one is featured When the page renders Then its single h1 is « Projets » under the overline « 2 réalisations · 1 mise en avant »', async () => {
    const { fixture } = await setup(
      makeProjectsGateway({
        getAllProjects: () =>
          of([
            makeProject({ id: 'p-1', featured: true }),
            makeProject({ id: 'p-2', featured: false }),
          ]),
      }),
    );
    const host = fixture.nativeElement as HTMLElement;

    expect({
      overline: testIdText(host, 'admin-page-overline'),
      title: testIdText(host, 'admin-page-title'),
      headings: host.querySelectorAll('h1').length,
    }).toEqual({ overline: '2 réalisations · 1 mise en avant', title: 'Projets', headings: 1 });
  });
});
