import { Component } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError, type Observable } from 'rxjs';
import { AdminProjects } from './admin-projects';
import { ProjectsGateway } from '@features/projects/domain/gateways/projects.gateway';
import type { Project } from '@features/projects/domain/models/project.model';
import { makeProject } from '@features/projects/testing/project-builders';
import { stubProjectsGateway } from '@features/projects/testing/stub-projects-gateway';
import { HomeGateway } from '@features/home/domain/gateways/home.gateway';
import { ToastStore } from '@core/notifications/toast-store';
import { byTestId, testIdText } from '@shared/testing/by-test-id';
import { captureCrash } from '@shared/testing/capture-crash';
import { pressTestId } from '@shared/testing/press-test-id';
import { settleBounded } from '@shared/testing/settle';
import { answerConfirmDialog, readConfirmDialog } from '@shared/ui/testing/confirm-dialog-page';

@Component({ template: '' })
class BlankPage {}

const DASHFLOW = makeProject({
  id: 'p-1',
  title: 'DashFlow',
  slug: 'dashflow',
  category: 'Application Web',
  kind: 'production',
  featured: true,
  tags: ['Angular', 'TypeScript', 'NestJS', 'Docker', 'PostgreSQL'],
  pitch: 'Le foyer dans une seule app.',
});

const CANDIDASH = makeProject({
  id: 'p-2',
  title: 'CandiDash',
  slug: 'candidash',
  category: 'Application Web',
  kind: 'production',
  featured: false,
  tags: ['Angular'],
  pitch: null,
});

const COMPTOIR = makeProject({
  id: 'p-3',
  title: 'Le Vieux Comptoir',
  slug: 'le-vieux-comptoir',
  category: 'Site vitrine',
  kind: 'demo',
  featured: false,
  tags: ['Astro'],
  pitch: 'Un restaurant fictif.',
});

type Rendered = {
  readonly fixture: ComponentFixture<AdminProjects>;
  readonly host: HTMLElement;
  readonly component: AdminProjects;
  readonly toast: { add: ReturnType<typeof vi.fn> };
  readonly crash: unknown;
};

async function renderProjects(gateway: ProjectsGateway = stubProjectsGateway()): Promise<Rendered> {
  const toast = { add: vi.fn() };
  TestBed.configureTestingModule({
    providers: [
      provideRouter([{ path: '**', component: BlankPage }]),
      { provide: ProjectsGateway, useValue: gateway },
      { provide: HomeGateway, useValue: { invalidateBundle: vi.fn() } },
      { provide: ToastStore, useValue: toast },
    ],
  });
  const fixture = TestBed.createComponent(AdminProjects);
  const crash = await captureCrash(() => settleBounded(fixture));
  return {
    fixture,
    host: fixture.nativeElement as HTMLElement,
    component: fixture.componentInstance,
    toast,
    crash,
  };
}

const withProjects = (projects: readonly Project[]): ProjectsGateway =>
  stubProjectsGateway({ getAllProjects: () => of(projects) });

const all = (host: ParentNode, testId: string): readonly HTMLElement[] => [
  ...host.querySelectorAll<HTMLElement>(`[data-testid="${testId}"]`),
];

const rowTitles = (host: HTMLElement): readonly string[] =>
  all(host, 'admin-project-row').map((row) => testIdText(row, 'admin-project-row-title'));

describe('AdminProjects', () => {
  describe('deleteProject', () => {
    it('retire le projet de façon optimiste et notifie le succès', async () => {
      const { component, toast } = await renderProjects(
        stubProjectsGateway({
          getAllProjects: () => of([makeProject({ id: '1' }), makeProject({ id: '2' })]),
          deleteProject: () => of(undefined),
        }),
      );
      component.deleteProject(makeProject({ id: '1' }));
      expect(component.projects().map((p) => p.id)).toEqual(['2']);
      expect(toast.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'success' }));
    });

    it('restaure la liste et notifie une erreur si la suppression échoue', async () => {
      const { component, toast } = await renderProjects(
        stubProjectsGateway({
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

describe('AdminProjects: suppression confirmée', () => {
  const FIRST = makeProject({ id: 'p-1', title: 'DashFlow' });
  const SECOND = makeProject({ id: 'p-2', title: 'CandiDash' });

  async function renderList(): Promise<Rendered & { deleteProject: ReturnType<typeof vi.fn> }> {
    const deleteProject = vi.fn((): Observable<void> => of(undefined));
    const rendered = await renderProjects(
      stubProjectsGateway({ getAllProjects: () => of([FIRST, SECOND]), deleteProject }),
    );
    return { ...rendered, deleteProject };
  }

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
  const STATE_TEST_IDS = ['load-error', 'admin-projects-empty', 'admin-projects-list'] as const;

  const renderWith = (getAllProjects: ProjectsGateway['getAllProjects']): Promise<Rendered> =>
    renderProjects(stubProjectsGateway({ getAllProjects }));

  const present = (host: HTMLElement): readonly string[] =>
    STATE_TEST_IDS.filter((testId) => byTestId(host, testId) !== null);

  it.each([
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

describe('AdminProjects: filtre par nature', () => {
  it.each([{ index: 1, filter: 'En production', titles: ['DashFlow', 'CandiDash'] }])(
    'Given the full list When « $filter » is pressed Then only its projects remain',
    async ({ index, titles }) => {
      const { fixture, host } = await renderProjects(withProjects([DASHFLOW, CANDIDASH, COMPTOIR]));

      await pressTestId(fixture, 'filter-option', index);

      expect({
        titles: rowTitles(host),
        pressed: all(host, 'filter-option').map((option) => option.getAttribute('aria-pressed')),
      }).toEqual({
        titles,
        pressed: [0, 1, 2, 3].map((position) => (position === index ? 'true' : 'false')),
      });
    },
  );
});
