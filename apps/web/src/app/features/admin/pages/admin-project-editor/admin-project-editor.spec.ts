import { Component } from '@angular/core';
import { Location } from '@angular/common';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Router, provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { NEVER, of, throwError, type Observable } from 'rxjs';
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
import { AdminProjectForm } from '../../application/components/admin-project-form';
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
      title: testIdText(editor.host, 'admin-page-title'),
      field: fieldValue(editor.host, 'admin-project-title'),
      headings: editor.host.querySelectorAll('h1').length,
      titleTabindex: byTestId(editor.host, 'admin-page-title')?.getAttribute('tabindex'),
    }).toEqual({
      crash: null,
      requested: [['p-1']],
      title: 'DashFlow',
      field: 'DashFlow',
      headings: 1,
      titleTabindex: '-1',
    });
  });

  it('Given /admin/projects/new When it is opened Then nothing is loaded, the title reads « Nouveau projet » and the form is empty', async () => {
    const editor = await openEditor('/admin/projects/new');

    expect({
      crash: editor.crash,
      requested: editor.getProjectById.mock.calls.length,
      title: testIdText(editor.host, 'admin-page-title'),
      field: fieldValue(editor.host, 'admin-project-title'),
      publicLink: byTestId(editor.host, 'admin-project-public-link'),
      galleryPending: byTestId(editor.host, 'admin-project-gallery-pending') !== null,
    }).toEqual({
      crash: null,
      requested: 0,
      title: 'Nouveau projet',
      field: '',
      publicLink: null,
      galleryPending: true,
    });
  });

  it.each([
    { url: '/admin/projects/p-1', current: 'DashFlow' },
    { url: '/admin/projects/new', current: 'Nouveau projet' },
  ])(
    'Given $url When the header renders Then the breadcrumb leads back to Projets and marks « $current » as the current page',
    async ({ url, current }) => {
      const editor = await openEditor(url);
      const breadcrumb = byTestId(editor.host, 'admin-breadcrumb');
      const back = byTestId(editor.host, 'admin-breadcrumb-parent');
      const here = byTestId(editor.host, 'admin-breadcrumb-current');

      expect({
        tag: breadcrumb?.tagName,
        label: breadcrumb?.getAttribute('aria-label'),
        back: { tag: back?.tagName, text: normalized(back), href: back?.getAttribute('href') },
        current: { text: normalized(here), ariaCurrent: here?.getAttribute('aria-current') },
      }).toEqual({
        tag: 'NAV',
        label: "Fil d'Ariane",
        back: { tag: 'A', text: 'Projets', href: '/admin/projects' },
        current: { text: current, ariaCurrent: 'page' },
      });
    },
  );

  it('Given the breadcrumb When « Projets » is followed Then the admin returns to the list', async () => {
    const editor = await openEditor('/admin/projects/p-1');

    byTestId(editor.host, 'admin-breadcrumb-parent')?.click();
    await settleBounded(editor.fixture);

    expect(TestBed.inject(Router).url).toBe('/admin/projects');
  });

  it('Given an existing project When the header renders Then a link opens its public page in a new tab', async () => {
    const editor = await openEditor('/admin/projects/p-1');
    const link = byTestId(editor.host, 'admin-project-public-link');

    expect({
      tag: link?.tagName,
      href: link?.getAttribute('href'),
      target: link?.getAttribute('target'),
      noopener: link?.getAttribute('rel')?.split(/\s+/).includes('noopener') ?? false,
      name: normalized(link),
    }).toEqual({
      tag: 'A',
      href: '/projects/dashflow',
      target: '_blank',
      noopener: true,
      name: 'Voir la fiche publique de DashFlow (nouvel onglet)',
    });
  });
});

describe('AdminProjectEditor: chargement, erreur et introuvable', () => {
  it('Given the project is loading When the page renders Then a status placeholder stands instead of the form', async () => {
    const editor = await openEditor('/admin/projects/p-1', {
      getProjectById: vi.fn((): Observable<Project> => NEVER),
    });
    const loading = byTestId(editor.host, 'admin-project-editor-loading');

    expect({
      crash: editor.crash,
      role: loading?.getAttribute('role'),
      form: byTestId(editor.host, 'admin-project-form'),
    }).toEqual({ crash: null, role: 'status', form: null });
  });

  it('Given the project failed to load When the page renders Then the error offers a retry and a way back, without form', async () => {
    const editor = await openEditor('/admin/projects/p-1', {
      getProjectById: vi.fn((): Observable<Project> => throwError(() => new Error('down'))),
    });
    const back = byTestId(editor.host, 'admin-project-editor-back');

    expect({
      crash: editor.crash,
      error: byTestId(editor.host, 'load-error') !== null,
      form: byTestId(editor.host, 'admin-project-form'),
      back: { tag: back?.tagName, href: back?.getAttribute('href') },
    }).toEqual({
      crash: null,
      error: true,
      form: null,
      back: { tag: 'A', href: '/admin/projects' },
    });
  });

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

  it('Given an id the API does not know When the page renders Then it says the project is not found and leads back, without form nor error', async () => {
    const editor = await openEditor('/admin/projects/p-404', {
      getProjectById: vi.fn((): Observable<Project | null> => of(null)),
    });
    const back = byTestId(editor.host, 'admin-project-editor-back');

    expect({
      crash: editor.crash,
      missing: testIdText(editor.host, 'admin-project-editor-missing'),
      error: byTestId(editor.host, 'load-error'),
      form: byTestId(editor.host, 'admin-project-form'),
      back: { tag: back?.tagName, href: back?.getAttribute('href') },
    }).toEqual({
      crash: null,
      missing: "Ce projet n'existe pas ou a été supprimé.",
      error: null,
      form: null,
      back: { tag: 'A', href: '/admin/projects' },
    });
  });
});

describe('AdminProjectEditor: enregistrer', () => {
  it('Given the form When it renders Then « Enregistrer » submits the project form', async () => {
    const editor = await openEditor('/admin/projects/p-1');
    const button = nativeButton(byTestId(editor.host, 'savebar-submit'));

    expect({
      type: button?.type,
      form: button?.getAttribute('form'),
      text: normalized(button),
      formExists: editor.host.querySelector('form#project-form') !== null,
    }).toEqual({ type: 'submit', form: 'project-form', text: 'Enregistrer', formExists: true });
  });

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
      updateProject: vi.fn(
        (): Observable<Project> => of(makeProject({ ...DASHFLOW, title: 'Après' })),
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

  it('Given a new cover picked in the dropzone for an existing project When the save succeeds Then the dropzone no longer shows the sent file', async () => {
    const editor = await openEditor('/admin/projects/p-1');
    const inZone = (selector: string): HTMLElement | null =>
      editor.host.querySelector(`[data-testid="admin-project-cover"] ${selector}`);
    const input = inZone('input[type="file"]') as HTMLInputElement | null;
    if (input) {
      Object.defineProperty(input, 'files', { value: [COVER], configurable: true });
      input.dispatchEvent(new Event('change'));
    }
    await settle(editor.fixture);
    const chosen = inZone('[data-testid="file-dropzone-replace"]') !== null;

    await save(editor);

    expect({
      chosen,
      replace: inZone('[data-testid="file-dropzone-replace"]'),
      trigger: inZone('[data-testid="file-dropzone-trigger"]') !== null,
    }).toEqual({ chosen: true, replace: null, trigger: true });
  });

  it('Given a new cover sent for an existing project When the save ends Then the project is requested again and the current cover and the preview show the uploaded image', async () => {
    const getProjectById = vi
      .fn<ProjectsGateway['getProjectById']>()
      .mockReturnValueOnce(of(makeProject({ ...DASHFLOW })))
      .mockReturnValue(
        of(makeProject({ ...DASHFLOW, image: 'https://cdn.test/projects/p-1.avif' })),
      );
    const editor = await openEditor('/admin/projects/p-1', { getProjectById });

    await chooseCover(editor, COVER);
    await save(editor);

    expect({
      requested: getProjectById.mock.calls.length,
      current: byTestId(editor.host, 'admin-project-cover-current')
        ?.querySelector('img')
        ?.getAttribute('src'),
      preview: byTestId(preview(editor), 'project-cover-image')?.getAttribute('src'),
      pending: byTestId(editor.host, 'admin-project-preview-pending-cover'),
      state: saveBarState(editor),
    }).toEqual({
      requested: 2,
      current: 'https://cdn.test/projects/p-1.avif',
      preview: 'https://cdn.test/projects/p-1.avif',
      pending: null,
      state: 'Aucune modification',
    });
  });

  it('Given the cover upload fails after the update When the project is saved Then a warning then the update are told, the new title stays and nothing is left to save', async () => {
    const editor = await openEditor('/admin/projects/p-1', {
      updateProject: vi.fn(
        (): Observable<Project> => of(makeProject({ ...DASHFLOW, title: 'Après' })),
      ),
      uploadImage: vi.fn((): Observable<string> => throwError(() => new Error('upload'))),
    });

    await typeIn(editor, 'admin-project-title', 'Après');
    await chooseCover(editor, COVER);
    await save(editor);

    expect({
      toasts: toasts(editor.toast),
      patches: editor.updateProject.mock.calls.length,
      title: testIdText(editor.host, 'admin-page-title'),
      state: saveBarState(editor),
      requested: editor.getProjectById.mock.calls.length,
    }).toEqual({
      toasts: [
        {
          severity: 'warn',
          detail: "Projet mis à jour, mais l'envoi de l'image a échoué. Réessayez.",
        },
        { severity: 'success', detail: 'Projet mis à jour' },
      ],
      patches: 1,
      title: 'Après',
      state: 'Aucune modification',
      requested: 1,
    });
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
        createProject: vi.fn(
          (): Observable<Project> => throwError(() => apiRejection(400, VALIDATION)),
        ),
      },
      expected: {
        severity: 'error',
        detail: `Erreur lors de la création du projet\u00a0: ${DETAIL}`,
      },
    },
    {
      given: 'the update refused with a 400',
      url: '/admin/projects/p-1',
      overrides: {
        updateProject: vi.fn(
          (): Observable<Project> => throwError(() => apiRejection(400, VALIDATION)),
        ),
      },
      expected: {
        severity: 'error',
        detail: `Erreur lors de la mise à jour du projet\u00a0: ${DETAIL}`,
      },
    },
    {
      given: 'the update refused with a 422',
      url: '/admin/projects/p-1',
      overrides: {
        updateProject: vi.fn(
          (): Observable<Project> => throwError(() => apiRejection(422, 'slug already exists')),
        ),
      },
      expected: {
        severity: 'error',
        detail: 'Erreur lors de la mise à jour du projet\u00a0: slug already exists',
      },
    },
    {
      given: 'the creation failing with a 500',
      url: '/admin/projects/new',
      overrides: {
        createProject: vi.fn(
          (): Observable<Project> => throwError(() => apiRejection(500, 'Internal server error')),
        ),
      },
      expected: { severity: 'error', detail: 'Erreur lors de la création du projet' },
    },
    {
      given: 'the update failing with a 500',
      url: '/admin/projects/p-1',
      overrides: {
        updateProject: vi.fn(
          (): Observable<Project> => throwError(() => apiRejection(500, 'Internal server error')),
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
      uploadImage: vi.fn(
        (): Observable<string> => throwError(() => apiRejection(400, 'file must be an image')),
      ),
    });

    await fillNewProject(editor);
    await chooseCover(editor, COVER);
    await save(editor);

    expect(toasts(editor.toast)[0]).toEqual({
      severity: 'warn',
      detail:
        "Projet créé, mais l'envoi de l'image a échoué. Réessayez depuis sa page. Détail\u00a0: file must be an image",
    });
  });

  it('Given the cover of a new project failing with a 500 When the project is saved Then the warning stays the fixed one', async () => {
    const editor = await openEditor('/admin/projects/new', {
      uploadImage: vi.fn(
        (): Observable<string> => throwError(() => apiRejection(500, 'Internal server error')),
      ),
    });

    await fillNewProject(editor);
    await chooseCover(editor, COVER);
    await save(editor);

    expect(toasts(editor.toast)[0]).toEqual({
      severity: 'warn',
      detail: "Projet créé, mais l'envoi de l'image a échoué. Réessayez depuis sa page.",
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
  const formComponentHost = (editor: Editor): HTMLElement | null =>
    (editor.fixture.debugElement.query(By.directive(AdminProjectForm))?.nativeElement as
      | HTMLElement
      | undefined) ?? null;

  const gallerySection = (editor: Editor): HTMLElement | null =>
    [...editor.host.querySelectorAll<HTMLElement>('[data-testid="form-section"]')].find(
      (section) => testIdText(section, 'form-section-title') === '05 · Galerie',
    ) ?? null;

  it('Given a saved project When the page renders Then the editor renders a fifth section « 05 · Galerie » after the form, outside any form, before the save bar, listing its captures', async () => {
    const editor = await openEditor('/admin/projects/p-1');
    const section = gallerySection(editor);
    const formHost = formComponentHost(editor);
    const submit = byTestId(editor.host, 'savebar-submit');

    expect({
      crash: editor.crash,
      fifth:
        testIdText(
          editor.host.querySelectorAll('[data-testid="form-section"]')[4] ?? editor.host,
          'form-section-title',
        ) === '05 · Galerie',
      renderedByForm: formHost?.contains(section ?? null) ?? true,
      afterForm:
        formHost && section
          ? formHost.compareDocumentPosition(section) & Node.DOCUMENT_POSITION_FOLLOWING
          : 0,
      inAForm: section?.closest('form') ?? null,
      beforeSaveBar:
        section && submit
          ? section.compareDocumentPosition(submit) & Node.DOCUMENT_POSITION_FOLLOWING
          : 0,
      items: section?.querySelectorAll('[data-testid="admin-gallery-item"]').length,
      headings: section?.querySelectorAll('h1, h2, h3, h4, h5, h6').length,
      pending: byTestId(editor.host, 'admin-project-gallery-pending'),
    }).toEqual({
      crash: null,
      fifth: true,
      renderedByForm: false,
      afterForm: Node.DOCUMENT_POSITION_FOLLOWING,
      inAForm: null,
      beforeSaveBar: Node.DOCUMENT_POSITION_FOLLOWING,
      items: 2,
      headings: 0,
      pending: null,
    });
  });

  it('Given a new project When the page renders Then the gallery section, rendered by the editor, asks to save first', async () => {
    const editor = await openEditor('/admin/projects/new');
    const section = gallerySection(editor);

    expect({
      renderedByForm: formComponentHost(editor)?.contains(section ?? null) ?? true,
      gallery: byTestId(editor.host, 'admin-project-gallery'),
      pending: section ? testIdText(section, 'admin-project-gallery-pending') : null,
    }).toEqual({
      renderedByForm: false,
      gallery: null,
      pending: 'Enregistrez le projet pour ajouter des captures.',
    });
  });

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

const preview = (editor: Editor): HTMLElement =>
  byTestId(editor.host, 'admin-project-preview-body') ?? editor.host;

async function chooseKind(editor: Editor, kind: string): Promise<void> {
  byTestId(editor.host, `admin-project-kind-${kind}`)?.click();
  await settle(editor.fixture);
}

describe('AdminProjectEditor: aperçu de la carte publique', () => {
  it('Given an existing production project When the page renders Then the preview shows its public case study', async () => {
    const editor = await openEditor('/admin/projects/p-1');

    expect({
      reference: normalized(byTestId(editor.host, 'admin-project-preview-reference')),
      overline: testIdText(preview(editor), 'project-case-study-overline'),
      title: testIdText(preview(editor), 'project-case-study-title'),
      pitch: testIdText(preview(editor), 'project-case-study-pitch'),
      inert: byTestId(editor.host, 'admin-project-preview-body')?.hasAttribute('inert') ?? false,
    }).toEqual({
      reference: 'Réalisations · En production',
      overline: '01 · Application Web',
      title: 'DashFlow',
      pitch: 'Budget et santé du foyer.',
      inert: true,
    });
  });

  it('Given the preview When the admin types a pitch Then the case study reads it at once', async () => {
    const editor = await openEditor('/admin/projects/p-1');

    await typeIn(editor, 'admin-project-pitch', 'Le foyer dans une seule app.');

    expect(testIdText(preview(editor), 'project-case-study-pitch')).toBe(
      'Le foyer dans une seule app.',
    );
  });

  it('Given the preview When the admin types a title Then the card follows the typing while the page title keeps the saved one', async () => {
    const editor = await openEditor('/admin/projects/p-1');

    await typeIn(editor, 'admin-project-title', 'DashFlow 2');

    expect({
      card: testIdText(preview(editor), 'project-case-study-title'),
      page: testIdText(editor.host, 'admin-page-title'),
    }).toEqual({ card: 'DashFlow 2', page: 'DashFlow' });
  });

  it('Given a production project When the admin chooses « Démo » Then the preview becomes the demo card', async () => {
    const editor = await openEditor('/admin/projects/p-1');

    await chooseKind(editor, 'demo');

    expect({
      reference: normalized(byTestId(editor.host, 'admin-project-preview-reference')),
      card: testIdText(preview(editor), 'project-grid-card-title'),
      caseStudy: byTestId(preview(editor), 'project-case-study'),
    }).toEqual({ reference: 'Réalisations · Démo', card: 'DashFlow', caseStudy: null });
  });

  it('Given a new project without nature When the page renders Then the preview asks for a nature, then shows the card once one is chosen', async () => {
    const editor = await openEditor('/admin/projects/new');
    const before = testIdText(editor.host, 'admin-project-preview-empty');

    await typeIn(editor, 'admin-project-title', 'Atelier');
    await chooseKind(editor, 'script');

    expect({
      before,
      after: byTestId(editor.host, 'admin-project-preview-empty'),
      card: testIdText(preview(editor), 'project-grid-card-title'),
    }).toEqual({
      before: 'Choisissez une nature pour voir la carte.',
      after: null,
      card: 'Atelier',
    });
  });

  it('Given a new cover chosen When the preview renders Then it says the cover shows after saving', async () => {
    const editor = await openEditor('/admin/projects/p-1');
    const before = byTestId(editor.host, 'admin-project-preview-pending-cover');

    await chooseCover(editor, COVER);

    expect({
      before,
      after: normalized(byTestId(editor.host, 'admin-project-preview-pending-cover')),
    }).toEqual({
      before: null,
      after: "Nouvelle couverture\u00a0: visible ici après l'enregistrement.",
    });
  });

  it('Given the page When it renders Then the preview and the section summary share a column that follows the form and sticks from lg', async () => {
    const editor = await openEditor('/admin/projects/p-1');
    const aside = byTestId(editor.host, 'admin-project-aside');
    const form = byTestId(editor.host, 'admin-project-form');

    expect({
      holdsPreview: aside?.contains(byTestId(editor.host, 'admin-project-preview')) ?? false,
      holdsSummary: aside?.contains(byTestId(editor.host, 'form-toc')) ?? false,
      afterForm:
        form && aside ? form.compareDocumentPosition(aside) & Node.DOCUMENT_POSITION_FOLLOWING : 0,
      sticky: ['2xl:sticky', '2xl:top-6'].filter((token) => !aside?.classList.contains(token)),
      grid:
        aside?.parentElement?.classList.contains('2xl:grid-cols-[minmax(0,1fr)_25rem]') ?? false,
    }).toEqual({
      holdsPreview: true,
      holdsSummary: true,
      afterForm: Node.DOCUMENT_POSITION_FOLLOWING,
      sticky: [],
      grid: true,
    });
  });

  it.each([
    { url: '/admin/projects/p-1', href: '/admin/projects/p-1#apercu' },
    { url: '/admin/projects/new', href: '/admin/projects/new#apercu' },
  ])(
    'Given $url When the header renders Then « Voir l’aperçu » leads to the preview below lg',
    async ({ url, href }) => {
      const editor = await openEditor(url);
      const link = byTestId(editor.host, 'admin-project-preview-link');
      const target = editor.host.querySelector('[id="apercu"]');

      expect({
        tag: link?.tagName,
        text: normalized(link),
        href: link?.getAttribute('href'),
        hiddenFromLg: link?.classList.contains('2xl:hidden') ?? false,
        targetHoldsPreview: target?.contains(byTestId(editor.host, 'admin-project-preview')),
      }).toEqual({
        tag: 'A',
        text: "Voir l'aperçu",
        href,
        hiddenFromLg: true,
        targetHoldsPreview: true,
      });
    },
  );
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

async function pickTag(editor: Editor, name: string): Promise<void> {
  [...editor.host.querySelectorAll<HTMLElement>('[data-testid="tag-chip"]')]
    .find((chip) => normalized(chip) === name)
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
      edit: 'the nature',
      act: (editor: Editor): Promise<void> => chooseKind(editor, 'script'),
      toc: ['modifié', '', '', '', ''],
    },
    {
      edit: 'the pitch',
      act: (editor: Editor): Promise<void> =>
        typeIn(editor, 'admin-project-pitch', 'Une accroche.'),
      toc: ['', 'modifié', '', '', ''],
    },
    {
      edit: 'the cover',
      act: (editor: Editor): Promise<void> => chooseCover(editor, COVER),
      toc: ['', 'modifié', '', '', ''],
    },
    {
      edit: 'a link',
      act: (editor: Editor): Promise<void> =>
        typeIn(editor, 'admin-project-live-url', 'https://x.test'),
      toc: ['', '', 'modifié', '', ''],
    },
    {
      edit: 'a tag',
      act: (editor: Editor): Promise<void> => pickTag(editor, 'TypeScript'),
      toc: ['', '', '', 'modifié', ''],
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

  it('Given the title and the pitch edited When the bar renders Then it reports two changes', async () => {
    const editor = await openWithRows();

    await typeIn(editor, 'admin-project-title', 'Après');
    await typeIn(editor, 'admin-project-pitch', 'Une accroche.');

    expect(saveBarState(editor)).toBe('2 modifications non enregistrées');
  });

  it('Given a title typed then restored When the bar renders Then nothing is reported as changed', async () => {
    const editor = await openWithRows();

    await typeIn(editor, 'admin-project-title', 'Après');
    await typeIn(editor, 'admin-project-title', 'DashFlow');

    expect({ state: saveBarState(editor), toc: tocStates(editor) }).toEqual({
      state: 'Aucune modification',
      toc: ['', '', '', '', ''],
    });
  });

  it('Given a project tagged Angular and TypeScript When Angular is unpicked then picked again Then nothing is reported as changed', async () => {
    const editor = await openEditor('/admin/projects/p-1', {
      getProjectById: vi.fn(
        (): Observable<Project> =>
          of(makeProject({ id: 'p-1', kind: 'production', tags: ['Angular', 'TypeScript'] })),
      ),
    });

    await pickTag(editor, 'Angular');
    await pickTag(editor, 'Angular');

    expect({ state: saveBarState(editor), toc: tocStates(editor) }).toEqual({
      state: 'Aucune modification',
      toc: ['', '', '', '', ''],
    });
  });

  it('Given the page When the section summary renders Then it lists the five sections and links each one in the page', async () => {
    const editor = await openEditor('/admin/projects/p-1');
    const toc = byTestId(editor.host, 'form-toc');
    const links = [...editor.host.querySelectorAll('[data-testid="form-toc-link"]')];

    expect({
      tag: toc?.tagName,
      label: toc?.getAttribute('aria-label'),
      links: links.map((link) => {
        const href = link.getAttribute('href') ?? '';
        const fragment = href.split('#')[1] ?? '';
        const target = fragment ? editor.host.querySelector(`[id="${fragment}"]`) : null;
        return {
          label: testIdText(link, 'form-toc-label'),
          href,
          target: target?.getAttribute('data-testid') ?? null,
        };
      }),
    }).toEqual({
      tag: 'NAV',
      label: 'Sections du formulaire',
      links: [
        { label: '01 · Identité', href: '/admin/projects/p-1#project-identity' },
        { label: '02 · Présentation', href: '/admin/projects/p-1#project-presentation' },
        { label: '03 · Liens', href: '/admin/projects/p-1#project-links' },
        { label: '04 · Choix techniques', href: '/admin/projects/p-1#project-stack' },
        { label: '05 · Galerie', href: '/admin/projects/p-1#project-gallery' },
      ].map((link) => ({ ...link, target: 'form-section' })),
    });
  });

  it('Given the save bar When « Annuler » is followed without change Then the admin is back on the list', async () => {
    const editor = await openEditor('/admin/projects/p-1');
    const cancel = byTestId(editor.host, 'savebar-cancel');

    cancel?.click();
    await settleBounded(editor.fixture);

    expect({
      href: cancel?.getAttribute('href'),
      url: TestBed.inject(Router).url,
    }).toEqual({ href: '/admin/projects', url: '/admin/projects' });
  });

  it('Given a save in progress When the bar renders Then « Enregistrer » is disabled until the answer', async () => {
    const editor = await openEditor('/admin/projects/p-1', {
      updateProject: vi.fn((): Observable<Project> => NEVER),
    });

    await typeIn(editor, 'admin-project-title', 'Après');
    await save(editor);

    expect(nativeButton(byTestId(editor.host, 'savebar-submit'))?.disabled).toBe(true);
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
      updateProject: vi.fn(
        (): Observable<Project> => of(makeProject({ ...DASHFLOW, title: 'Après' })),
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
