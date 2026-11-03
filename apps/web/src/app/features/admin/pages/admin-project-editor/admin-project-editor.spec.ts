import { Component } from '@angular/core';
import { Location } from '@angular/common';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Router, provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { of, throwError, type Observable } from 'rxjs';
import type { Mock } from 'vitest';
import { HomeGateway } from '@features/home/domain/gateways/home.gateway';
import { ProjectsGateway } from '@features/projects/domain/gateways/projects.gateway';
import type { Project, ProjectInput } from '@features/projects/domain/models/project.model';
import { makeProject, makeProjectImage } from '@features/projects/testing/project-builders';
import { stubProjectsGateway } from '@features/projects/testing/stub-projects-gateway';
import { apiRejection } from '@shared/testing/api-rejection';
import { byTestId, testIdText } from '@shared/testing/by-test-id';
import { captureCrash } from '@shared/testing/capture-crash';
import { pressTestId } from '@shared/testing/press-test-id';
import { settle, settleBounded } from '@shared/testing/settle';
import { FileDropzone } from '@shared/ui/file-dropzone';
import { ToastStore } from '@core/notifications/toast-store';
import type { ToastMessage } from '@shared/ui/toast.types';
import { answerConfirmDialog, readConfirmDialog } from '@shared/ui/testing/confirm-dialog-page';
import { AdminProjectEditor } from './admin-project-editor';
import { unsavedChangesGuard } from '../../application/unsaved-changes-guard';

@Component({ template: '' })
class BlankPage {}

const DASHFLOW = makeProject({
  id: 'p-1',
  title: 'DashFlow',
  slug: 'dashflow',
  category: 'Application Web',
  tags: ['Angular'],
  description: 'Budget et santé du foyer.',
  kind: 'production',
  image: '',
  gallery: [
    makeProjectImage({ id: 'img-a', alt: 'Vue globale' }),
    makeProjectImage({ id: 'img-b', alt: 'Transactions' }),
  ],
});

type Spies = {
  readonly getProjectById: Mock<ProjectsGateway['getProjectById']>;
  readonly createProject: Mock<ProjectsGateway['createProject']>;
  readonly updateProject: Mock<ProjectsGateway['updateProject']>;
  readonly uploadImage: Mock<ProjectsGateway['uploadImage']>;
  readonly invalidateAllProjects: Mock<ProjectsGateway['invalidateAllProjects']>;
  readonly invalidateBundle: Mock<() => void>;
  readonly toast: Mock<ToastStore['add']>;
};

type Editor = Spies & {
  readonly harness: RouterTestingHarness;
  readonly fixture: ComponentFixture<unknown>;
  readonly host: HTMLElement;
  readonly crash: unknown;
};

type Overrides = Partial<Omit<Spies, 'invalidateBundle' | 'toast'>>;

async function openEditor(url: string, overrides: Overrides = {}): Promise<Editor> {
  const spies: Spies = {
    getProjectById: vi.fn((): Observable<Project> => of(DASHFLOW)),
    createProject: vi.fn((): Observable<Project> => of(makeProject({ id: 'p-9', title: 'X' }))),
    updateProject: vi.fn((): Observable<Project> => of(DASHFLOW)),
    uploadImage: vi.fn((): Observable<string> => of('projects/p-9.avif')),
    invalidateAllProjects: vi.fn(),
    invalidateBundle: vi.fn(),
    toast: vi.fn(),
    ...overrides,
  };
  TestBed.configureTestingModule({
    providers: [
      provideRouter(
        [
          {
            path: 'admin/projects/new',
            component: AdminProjectEditor,
            canDeactivate: [unsavedChangesGuard],
          },
          {
            path: 'admin/projects/:id',
            component: AdminProjectEditor,
            canDeactivate: [unsavedChangesGuard],
          },
          { path: 'admin/projects', component: BlankPage },
          { path: 'projects/:slug', component: BlankPage },
        ],
        withComponentInputBinding(),
      ),
      {
        provide: ProjectsGateway,
        useValue: stubProjectsGateway({
          getProjectById: spies.getProjectById,
          createProject: spies.createProject,
          updateProject: spies.updateProject,
          uploadImage: spies.uploadImage,
          invalidateAllProjects: spies.invalidateAllProjects,
        }),
      },
      { provide: HomeGateway, useValue: { invalidateBundle: spies.invalidateBundle } },
      { provide: ToastStore, useValue: { add: spies.toast } },
    ],
  });
  const harness = await RouterTestingHarness.create();
  const crash = await captureCrash(async () => {
    await harness.navigateByUrl(url);
    await settleBounded(harness.fixture);
  });
  return {
    ...spies,
    harness,
    fixture: harness.fixture,
    host: harness.fixture.nativeElement as HTMLElement,
    crash,
  };
}

const normalized = (element: Element | null | undefined): string =>
  (element?.textContent ?? '').replace(/[ \t\n\r]+/g, ' ').replace(/^ | $/g, '');

const nativeButton = (element: Element | null): HTMLButtonElement | null =>
  element instanceof HTMLButtonElement ? element : (element?.querySelector('button') ?? null);

const fieldValue = (host: HTMLElement, testId: string): string | undefined =>
  (byTestId(host, testId) as HTMLInputElement | null)?.value;

async function typeIn(editor: Editor, testId: string, text: string): Promise<void> {
  const control = byTestId(editor.host, testId) as HTMLInputElement | HTMLSelectElement | null;
  if (!control) return;
  control.value = text;
  control.dispatchEvent(new Event('input'));
  control.dispatchEvent(new Event('change'));
  await settle(editor.fixture);
}

async function fillNewProject(editor: Editor): Promise<void> {
  await typeIn(editor, 'admin-project-title', 'Nouveau');
  await typeIn(editor, 'admin-project-category', 'Application Web');
  await typeIn(editor, 'admin-project-description', 'Une description.');
  byTestId(editor.host, 'admin-project-kind-demo')?.click();
  await settle(editor.fixture);
}

async function chooseCover(editor: Editor, file: File): Promise<void> {
  editor.fixture.debugElement
    .query(By.directive(FileDropzone))
    ?.triggerEventHandler('fileSelected', file);
  await settle(editor.fixture);
}

async function save(editor: Editor): Promise<void> {
  await pressTestId(editor.fixture, 'savebar-submit');
  await settleBounded(editor.fixture);
}

const COVER = new File(['x'], 'cover.png', { type: 'image/png' });

const toasts = (toast: Spies['toast']): readonly ToastMessage[] =>
  toast.mock.calls.map(([message]) => message);

describe('AdminProjectEditor: ouverture', () => {
  it('Given an existing project When /admin/projects/p-1 is opened Then the project is loaded and its form filled', async () => {
    const editor = await openEditor('/admin/projects/p-1');

    expect({
      crash: editor.crash,
      requested: editor.getProjectById.mock.calls,
      field: fieldValue(editor.host, 'admin-project-title'),
    }).toEqual({
      crash: null,
      requested: [['p-1']],
      field: 'DashFlow',
    });
  });

  it('Given /admin/projects/new When it is opened Then nothing is loaded, the form is empty', async () => {
    const editor = await openEditor('/admin/projects/new');

    expect({
      crash: editor.crash,
      requested: editor.getProjectById.mock.calls.length,
      field: fieldValue(editor.host, 'admin-project-title'),
      publicLink: byTestId(editor.host, 'admin-project-public-link'),
      galleryPending: byTestId(editor.host, 'admin-project-gallery-pending') !== null,
    }).toEqual({
      crash: null,
      requested: 0,
      field: '',
      publicLink: null,
      galleryPending: true,
    });
  });
});

describe('AdminProjectEditor: chargement, erreur et introuvable', () => {
  it('Given the project failed to load When Réessayer is pressed Then it is requested again and the form shows', async () => {
    const getProjectById = vi
      .fn<ProjectsGateway['getProjectById']>()
      .mockReturnValueOnce(throwError(() => new Error('down')))
      .mockReturnValue(of(DASHFLOW));
    const editor = await openEditor('/admin/projects/p-1', { getProjectById });

    const crash = await captureCrash(() => pressTestId(editor.fixture, 'load-error-retry'));

    expect({
      crash,
      calls: getProjectById.mock.calls.length,
      field: fieldValue(editor.host, 'admin-project-title'),
    }).toEqual({ crash: null, calls: 2, field: 'DashFlow' });
  });
});

describe('AdminProjectEditor: enregistrer', () => {
  it('Given a pitch over the limit shown in error When the page is read Then « Enregistrer » stays enabled', async () => {
    const editor = await openEditor('/admin/projects/p-1');

    await typeIn(editor, 'admin-project-pitch', 'a'.repeat(161));
    byTestId(editor.host, 'admin-project-pitch')?.dispatchEvent(new Event('blur'));
    await settle(editor.fixture);

    expect({
      error: normalized(byTestId(editor.host, 'admin-project-pitch-error')),
      disabled: nativeButton(byTestId(editor.host, 'savebar-submit'))?.disabled,
    }).toEqual({
      error: "L'accroche ne doit pas dépasser 160\u00a0caractères",
      disabled: false,
    });
  });

  it('Given an empty new project When « Enregistrer » is pressed Then nothing is created', async () => {
    const editor = await openEditor('/admin/projects/new');

    await save(editor);

    expect(editor.createProject.mock.calls.length).toBe(0);
  });
});

describe('AdminProjectEditor: création', () => {
  it('Given a filled new project When it is saved Then the project is created with the typed payload', async () => {
    const editor = await openEditor('/admin/projects/new');

    await fillNewProject(editor);
    await save(editor);

    expect(editor.createProject.mock.calls).toEqual([
      [
        {
          title: 'Nouveau',
          category: 'Application Web',
          tags: [],
          description: 'Une description.',
          liveUrl: null,
          repoUrl: null,
          repoUrlFront: null,
          repoUrlBack: null,
          featured: false,
          order: 0,
          techChoices: [],
          architectureDecisions: [],
          kind: 'demo',
          pitch: null,
          highlight: null,
          scope: null,
        } satisfies ProjectInput,
      ],
    ]);
  });

  it('Given a created project When the save ends Then the caches are invalidated, success is told and the page moves to its address in place of /new', async () => {
    const editor = await openEditor('/admin/projects/new');
    const replaceState = vi.spyOn(TestBed.inject(Location), 'replaceState');

    await fillNewProject(editor);
    await save(editor);

    expect({
      invalidateAllProjects: editor.invalidateAllProjects.mock.calls.length,
      invalidateBundle: editor.invalidateBundle.mock.calls.length,
      toasts: toasts(editor.toast),
      url: TestBed.inject(Router).url,
      replaced: replaceState.mock.calls.map(([path]) => path),
    }).toEqual({
      invalidateAllProjects: 1,
      invalidateBundle: 1,
      toasts: [{ severity: 'success', detail: 'Projet créé' }],
      url: '/admin/projects/p-9',
      replaced: ['/admin/projects/p-9'],
    });
  });

  it('Given a cover chosen for a new project When it is saved Then the cover is uploaded for the created id, after the creation', async () => {
    const editor = await openEditor('/admin/projects/new');

    await fillNewProject(editor);
    await chooseCover(editor, COVER);
    await save(editor);

    expect({
      uploads: editor.uploadImage.mock.calls,
      afterCreation:
        (editor.uploadImage.mock.invocationCallOrder[0] ?? 0) >
        (editor.createProject.mock.invocationCallOrder[0] ?? Infinity),
    }).toEqual({ uploads: [[COVER, 'p-9']], afterCreation: true });
  });

  it('Given the creation fails When the project is saved Then an error is told and the page stays on /new', async () => {
    const editor = await openEditor('/admin/projects/new', {
      createProject: vi.fn((): Observable<Project> => throwError(() => new Error('boom'))),
    });

    await fillNewProject(editor);
    await save(editor);

    expect({
      toasts: toasts(editor.toast),
      url: TestBed.inject(Router).url,
      invalidateAllProjects: editor.invalidateAllProjects.mock.calls.length,
    }).toEqual({
      toasts: [{ severity: 'error', detail: 'Erreur lors de la création du projet' }],
      url: '/admin/projects/new',
      invalidateAllProjects: 0,
    });
  });

  it('Given the cover upload fails after the creation When the project is saved Then a warning then the creation are told and the page still moves to the created project', async () => {
    const editor = await openEditor('/admin/projects/new', {
      uploadImage: vi.fn((): Observable<string> => throwError(() => new Error('upload'))),
    });

    await fillNewProject(editor);
    await chooseCover(editor, COVER);
    await save(editor);

    expect({
      severities: toasts(editor.toast).map((toast) => toast.severity),
      url: TestBed.inject(Router).url,
    }).toEqual({ severities: ['warn', 'success'], url: '/admin/projects/p-9' });
  });
});

describe('AdminProjectEditor: mise à jour', () => {
  it('Given an edited title When the project is saved Then it is patched, success is told, the caches invalidated and the title follows', async () => {
    const editor = await openEditor('/admin/projects/p-1', {
      updateProject: vi.fn((): Observable<Project> =>
        of(makeProject({ ...DASHFLOW, title: 'Après' })),
      ),
    });

    await typeIn(editor, 'admin-project-title', 'Après');
    await save(editor);

    expect({
      patched: editor.updateProject.mock.calls.map(([id, payload]) => [id, payload.title]),
      uploads: editor.uploadImage.mock.calls.length,
      toasts: toasts(editor.toast),
      invalidateAllProjects: editor.invalidateAllProjects.mock.calls.length,
      invalidateBundle: editor.invalidateBundle.mock.calls.length,
      title: testIdText(editor.host, 'admin-page-title'),
      url: TestBed.inject(Router).url,
    }).toEqual({
      patched: [['p-1', 'Après']],
      uploads: 0,
      toasts: [{ severity: 'success', detail: 'Projet mis à jour' }],
      invalidateAllProjects: 1,
      invalidateBundle: 1,
      title: 'Après',
      url: '/admin/projects/p-1',
    });
  });

  it('Given a new cover for an existing project When it is saved Then the project is patched first, then the cover uploaded for its id', async () => {
    const editor = await openEditor('/admin/projects/p-1');

    await chooseCover(editor, COVER);
    await save(editor);

    expect({
      uploads: editor.uploadImage.mock.calls,
      patches: editor.updateProject.mock.calls.length,
      patchFirst:
        (editor.updateProject.mock.invocationCallOrder[0] ?? Infinity) <
        (editor.uploadImage.mock.invocationCallOrder[0] ?? 0),
    }).toEqual({ uploads: [[COVER, 'p-1']], patches: 1, patchFirst: true });
  });

  it('Given the patch fails When the project is saved Then an error is told and the title is unchanged', async () => {
    const editor = await openEditor('/admin/projects/p-1', {
      updateProject: vi.fn((): Observable<Project> => throwError(() => new Error('boom'))),
    });

    await typeIn(editor, 'admin-project-title', 'Après');
    await save(editor);

    expect({
      toasts: toasts(editor.toast),
      title: testIdText(editor.host, 'admin-page-title'),
    }).toEqual({
      toasts: [{ severity: 'error', detail: 'Erreur lors de la mise à jour du projet' }],
      title: 'DashFlow',
    });
  });
});

describe('AdminProjectEditor: détail du refus de l’API', () => {
  const VALIDATION = [
    'pitch must be shorter than or equal to 160 characters',
    'title should not be empty',
    'pitch must be shorter than or equal to 160 characters',
  ];
  const DETAIL = 'pitch must be shorter than or equal to 160 characters; title should not be empty';

  it.each([
    {
      given: 'the creation refused with a 400',
      url: '/admin/projects/new',
      overrides: {
        createProject: vi.fn((): Observable<Project> =>
          throwError(() => apiRejection(400, VALIDATION)),
        ),
      },
      expected: {
        severity: 'error',
        detail: `Erreur lors de la création du projet\u00a0: ${DETAIL}`,
      },
    },
    {
      given: 'the update failing with a 500',
      url: '/admin/projects/p-1',
      overrides: {
        updateProject: vi.fn((): Observable<Project> =>
          throwError(() => apiRejection(500, 'Internal server error')),
        ),
      },
      expected: { severity: 'error', detail: 'Erreur lors de la mise à jour du projet' },
    },
  ])(
    'Given $given When the project is saved Then the toast reads the label and only a validation detail',
    async ({ url, overrides, expected }) => {
      const editor = await openEditor(url, overrides);

      if (url.endsWith('/new')) await fillNewProject(editor);
      else await typeIn(editor, 'admin-project-title', 'Après');
      await save(editor);

      expect(toasts(editor.toast)).toEqual([expected]);
    },
  );

  it('Given the cover of a new project refused with a 400 When the project is saved Then the warning names the refusal', async () => {
    const editor = await openEditor('/admin/projects/new', {
      uploadImage: vi.fn((): Observable<string> =>
        throwError(() => apiRejection(400, 'file must be an image')),
      ),
    });

    await fillNewProject(editor);
    await chooseCover(editor, COVER);
    await save(editor);

    expect(toasts(editor.toast)[0]).toEqual({
      severity: 'warn',
      detail:
        "Projet créé, mais l'image de couverture n'a pas été envoyée\u00a0: renvoyez-la depuis sa page. file must be an image.",
    });
  });
});

describe('AdminProjectEditor: couverture retirée ou refusée', () => {
  async function pickInZone(editor: Editor, file: File): Promise<void> {
    const input = editor.host.querySelector<HTMLInputElement>(
      '[data-testid="admin-project-cover"] input[type="file"]',
    );
    if (input) {
      Object.defineProperty(input, 'files', { value: [file], configurable: true });
      input.dispatchEvent(new Event('change'));
    }
    await settle(editor.fixture);
  }

  const inZone = (editor: Editor, testId: string): HTMLElement | null =>
    editor.host.querySelector(`[data-testid="admin-project-cover"] [data-testid="${testId}"]`);

  it('Given a cover chosen then removed from the dropzone When the project is saved Then no cover is sent', async () => {
    const editor = await openEditor('/admin/projects/p-1');
    await pickInZone(editor, COVER);
    const chosen = inZone(editor, 'file-dropzone-replace') !== null;

    inZone(editor, 'file-dropzone-clear')?.click();
    await settle(editor.fixture);
    await save(editor);

    expect({ chosen, uploads: editor.uploadImage.mock.calls.length }).toEqual({
      chosen: true,
      uploads: 0,
    });
  });

  it('Given a file that is not an image When it is dropped in the cover zone Then the page says so and the zone empties', async () => {
    const editor = await openEditor('/admin/projects/p-1');

    await pickInZone(editor, new File(['%PDF'], 'notes.pdf', { type: 'application/pdf' }));

    expect({
      toasts: toasts(editor.toast),
      replace: inZone(editor, 'file-dropzone-replace'),
      trigger: inZone(editor, 'file-dropzone-trigger') !== null,
      name: normalized(editor.host).includes('notes.pdf'),
    }).toEqual({
      toasts: [{ severity: 'error', detail: 'Seules les images sont acceptées.' }],
      replace: null,
      trigger: true,
      name: false,
    });
  });

  it('Given a cover chosen then a refused file When the project is saved Then the earlier cover is not sent', async () => {
    const editor = await openEditor('/admin/projects/p-1');
    await pickInZone(editor, COVER);

    await pickInZone(editor, new File(['%PDF'], 'notes.pdf', { type: 'application/pdf' }));
    await save(editor);

    expect(editor.uploadImage.mock.calls.length).toBe(0);
  });
});

describe('AdminProjectEditor: galerie', () => {
  async function deleteSecondCapture(editor: Editor): Promise<void> {
    const second = (): HTMLElement | null =>
      editor.host.querySelectorAll<HTMLElement>('[data-testid="admin-gallery-item"]')[1] ?? null;
    const press = async (testId: string): Promise<void> => {
      const item = second();
      nativeButton(item ? byTestId(item, testId) : null)?.click();
      await settleBounded(editor.fixture);
    };
    await press('admin-gallery-item-remove');
    await press('admin-gallery-item-confirm-remove');
  }

  it('Given the gallery of the project When a capture is deleted Then one capture remains and the public caches are invalidated', async () => {
    const editor = await openEditor('/admin/projects/p-1');

    await deleteSecondCapture(editor);

    expect({
      items: editor.host.querySelectorAll('[data-testid="admin-gallery-item"]').length,
      invalidateAllProjects: editor.invalidateAllProjects.mock.calls.length,
      invalidateBundle: editor.invalidateBundle.mock.calls.length,
    }).toEqual({ items: 1, invalidateAllProjects: 1, invalidateBundle: 1 });
  });

  it('Given an unsaved title When a capture is deleted Then the title typed so far is kept', async () => {
    const editor = await openEditor('/admin/projects/p-1');

    await typeIn(editor, 'admin-project-title', 'Titre en cours');
    await deleteSecondCapture(editor);

    expect({
      field: fieldValue(editor.host, 'admin-project-title'),
      items: editor.host.querySelectorAll('[data-testid="admin-gallery-item"]').length,
    }).toEqual({ field: 'Titre en cours', items: 1 });
  });
});

const WITH_ROWS = makeProject({
  ...DASHFLOW,
  techChoices: [{ techno: 'NestJS', why: 'modules' }],
  architectureDecisions: [{ decision: 'Chiffrement client', rationale: 'santé' }],
});

const openWithRows = (): Promise<Editor> =>
  openEditor('/admin/projects/p-1', {
    getProjectById: vi.fn((): Observable<Project> => of(WITH_ROWS)),
  });

const saveBarState = (editor: Editor): string => normalized(byTestId(editor.host, 'savebar-state'));

const tocStates = (editor: Editor): readonly string[] =>
  [...editor.host.querySelectorAll('[data-testid="form-toc-link"]')].map((link) =>
    normalized(byTestId(link, 'form-toc-state')),
  );

async function addTag(editor: Editor, name: string): Promise<void> {
  const input = byTestId(editor.host, 'tags-input') as HTMLInputElement;
  input.value = name;
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(
    new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }),
  );
  await settle(editor.fixture);
}

async function removeTag(editor: Editor, name: string): Promise<void> {
  [...editor.host.querySelectorAll<HTMLElement>('[data-testid="tag-chip"]')]
    .find((chip) => normalized(chip) === name)
    ?.querySelector<HTMLButtonElement>('[data-testid="tag-remove"]')
    ?.click();
  await settle(editor.fixture);
}

async function followBreadcrumb(editor: Editor): Promise<void> {
  byTestId(editor.host, 'admin-breadcrumb-parent')?.click();
  await settleBounded(editor.fixture);
}

describe('AdminProjectEditor: modifications non enregistrées', () => {
  it('Given a project with repeated rows When it is opened untouched Then nothing is reported as changed', async () => {
    const editor = await openWithRows();

    expect({ state: saveBarState(editor), toc: tocStates(editor) }).toEqual({
      state: 'Aucune modification',
      toc: ['', '', '', '', ''],
    });
  });

  it.each([
    {
      edit: 'the title',
      act: (editor: Editor): Promise<void> => typeIn(editor, 'admin-project-title', 'Après'),
      toc: ['modifié', '', '', '', ''],
    },
    {
      edit: 'a technical choice row added',
      act: (editor: Editor): Promise<void> => pressTestId(editor.fixture, 'tech-choice-add'),
      toc: ['', '', '', 'modifié', ''],
    },
  ])(
    'Given an opened project When $edit is changed Then one change is reported and its section is marked',
    async ({ act, toc }) => {
      const editor = await openWithRows();

      await act(editor);

      expect({ state: saveBarState(editor), toc: tocStates(editor) }).toEqual({
        state: '1 modification non enregistrée',
        toc,
      });
    },
  );

  it('Given a title typed then restored When the bar renders Then nothing is reported as changed', async () => {
    const editor = await openWithRows();

    await typeIn(editor, 'admin-project-title', 'Après');
    await typeIn(editor, 'admin-project-title', 'DashFlow');

    expect({ state: saveBarState(editor), toc: tocStates(editor) }).toEqual({
      state: 'Aucune modification',
      toc: ['', '', '', '', ''],
    });
  });

  it('Given a project tagged Angular and TypeScript When Angular is removed then added again Then nothing is reported as changed', async () => {
    const editor = await openEditor('/admin/projects/p-1', {
      getProjectById: vi.fn((): Observable<Project> =>
        of(makeProject({ id: 'p-1', kind: 'production', tags: ['Angular', 'TypeScript'] })),
      ),
    });

    await removeTag(editor, 'Angular');
    await addTag(editor, 'Angular');

    expect({ state: saveBarState(editor), toc: tocStates(editor) }).toEqual({
      state: 'Aucune modification',
      toc: ['', '', '', '', ''],
    });
  });

  it('Given a failed save When the error is told Then « Enregistrer » is enabled again and the change still counted', async () => {
    const editor = await openEditor('/admin/projects/p-1', {
      updateProject: vi.fn((): Observable<Project> => throwError(() => new Error('boom'))),
    });

    await typeIn(editor, 'admin-project-title', 'Après');
    await save(editor);

    expect({
      disabled: nativeButton(byTestId(editor.host, 'savebar-submit'))?.disabled,
      state: saveBarState(editor),
    }).toEqual({ disabled: false, state: '1 modification non enregistrée' });
  });

  it('Given an edited project saved When the answer comes back Then nothing is reported as changed and leaving asks nothing', async () => {
    const editor = await openEditor('/admin/projects/p-1', {
      updateProject: vi.fn((): Observable<Project> =>
        of(makeProject({ ...DASHFLOW, title: 'Après' })),
      ),
    });

    await typeIn(editor, 'admin-project-title', 'Après');
    await save(editor);
    const state = saveBarState(editor);
    await followBreadcrumb(editor);

    expect({
      state,
      dialog: readConfirmDialog(editor.host).open,
      url: TestBed.inject(Router).url,
    }).toEqual({ state: 'Aucune modification', dialog: false, url: '/admin/projects' });
  });
});

describe('AdminProjectEditor: quitter la page', () => {
  it('Given no change When the admin leaves Then the list opens without question', async () => {
    const editor = await openEditor('/admin/projects/p-1');

    await followBreadcrumb(editor);

    expect({
      dialog: readConfirmDialog(editor.host).open,
      url: TestBed.inject(Router).url,
    }).toEqual({ dialog: false, url: '/admin/projects' });
  });

  it('Given an unsaved change When the admin leaves Then a dialog asks to confirm and the page stays meanwhile', async () => {
    const editor = await openEditor('/admin/projects/p-1');

    await typeIn(editor, 'admin-project-title', 'Après');
    await followBreadcrumb(editor);
    const dialog = readConfirmDialog(editor.host);

    expect({
      open: dialog.open,
      heading: dialog.heading,
      confirm: dialog.confirm,
      cancel: dialog.cancel,
      url: TestBed.inject(Router).url,
    }).toEqual({
      open: true,
      heading: 'Quitter sans enregistrer\u202f?',
      confirm: 'Quitter sans enregistrer',
      cancel: "Continuer l'édition",
      url: '/admin/projects/p-1',
    });
  });

  it.each([
    { answer: 'confirm', url: '/admin/projects' },
    { answer: 'cancel', url: '/admin/projects/p-1' },
    { answer: 'escape', url: '/admin/projects/p-1' },
  ] as const)(
    'Given the leave dialog When the admin answers $answer Then the address is $url',
    async ({ answer, url }) => {
      const editor = await openEditor('/admin/projects/p-1');

      await typeIn(editor, 'admin-project-title', 'Après');
      await followBreadcrumb(editor);
      await answerConfirmDialog(editor.fixture, answer);
      await settleBounded(editor.fixture);

      expect({
        url: TestBed.inject(Router).url,
        open: readConfirmDialog(editor.host).open,
      }).toEqual({ url, open: false });
    },
  );

  it('Given the leave dialog dismissed When the admin goes on Then the typed title is still there', async () => {
    const editor = await openEditor('/admin/projects/p-1');

    await typeIn(editor, 'admin-project-title', 'Après');
    await followBreadcrumb(editor);
    await answerConfirmDialog(editor.fixture, 'cancel');

    expect({
      field: fieldValue(editor.host, 'admin-project-title'),
      state: saveBarState(editor),
    }).toEqual({ field: 'Après', state: '1 modification non enregistrée' });
  });

  it('Given a new project created When the page moves to its address Then no leave dialog is asked', async () => {
    const editor = await openEditor('/admin/projects/new');

    await fillNewProject(editor);
    await save(editor);

    expect({
      dialog: readConfirmDialog(editor.host).open,
      url: TestBed.inject(Router).url,
    }).toEqual({ dialog: false, url: '/admin/projects/p-9' });
  });

  it.each([
    { edited: true, prevented: true },
    { edited: false, prevented: false },
  ])(
    'Given unsaved changes $edited When the tab is about to close Then the browser warning is requested: $prevented',
    async ({ edited, prevented }) => {
      const editor = await openEditor('/admin/projects/p-1');
      if (edited) await typeIn(editor, 'admin-project-title', 'Après');
      const event = new Event('beforeunload', { cancelable: true });

      window.dispatchEvent(event);

      expect(event.defaultPrevented).toBe(prevented);
    },
  );
});
