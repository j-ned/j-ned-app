import { Component } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { NEVER, of, throwError, type Observable } from 'rxjs';
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

const normalized = (element: Element | null | undefined): string =>
  (element?.textContent ?? '').replace(/[ \t\n\r]+/g, ' ').replace(/^ | $/g, '');

const nativeButton = (element: Element | null): HTMLButtonElement | null =>
  element instanceof HTMLButtonElement ? element : (element?.querySelector('button') ?? null);

const accessibleName = (element: Element | null): string =>
  element?.getAttribute('aria-label') ?? normalized(element);

const all = (host: ParentNode, testId: string): readonly HTMLElement[] => [
  ...host.querySelectorAll<HTMLElement>(`[data-testid="${testId}"]`),
];

const rowTitles = (host: HTMLElement): readonly string[] =>
  all(host, 'admin-project-row').map((row) => testIdText(row, 'admin-project-row-title'));

describe('AdminProjects', () => {
  it('charge les projets depuis le gateway', async () => {
    const { component } = await renderProjects(
      withProjects([makeProject({ id: '1' }), makeProject({ id: '2' })]),
    );

    expect(component.projects().map((p) => p.id)).toEqual(['1', '2']);
  });

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
          "Le projet disparaît des Réalisations et de l'accueil dans la seconde, avec ses captures. Cette action est définitive.",
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

  const renderWith = (getAllProjects: ProjectsGateway['getAllProjects']): Promise<Rendered> =>
    renderProjects(stubProjectsGateway({ getAllProjects }));

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

describe('AdminProjects: en-tête de page', () => {
  it('Given two projects of which one is featured When the page renders Then its single h1 is « Projets » under the overline « 2 réalisations · 1 mise en avant »', async () => {
    const { host } = await renderProjects(
      withProjects([
        makeProject({ id: 'p-1', featured: true }),
        makeProject({ id: 'p-2', featured: false }),
      ]),
    );

    expect({
      overline: testIdText(host, 'admin-page-overline'),
      title: testIdText(host, 'admin-page-title'),
      headings: host.querySelectorAll('h1').length,
    }).toEqual({ overline: '2 réalisations · 1 mise en avant', title: 'Projets', headings: 1 });
  });
});

describe('AdminProjects: créer et modifier mènent aux pages d’édition', () => {
  it('Given the page When « Nouveau projet » is followed Then the creation page opens', async () => {
    const { fixture, host } = await renderProjects(withProjects([DASHFLOW]));
    const link = byTestId(host, 'admin-project-new');
    const before = {
      tag: link?.tagName,
      text: normalized(link),
      href: link?.getAttribute('href'),
    };

    link?.click();
    await settleBounded(fixture);

    expect({ ...before, url: TestBed.inject(Router).url }).toEqual({
      tag: 'A',
      text: 'Nouveau projet',
      href: '/admin/projects/new',
      url: '/admin/projects/new',
    });
  });

  it('Given the list When it renders Then each row names its project in an edit link and a delete action', async () => {
    const { host } = await renderProjects(withProjects([DASHFLOW, CANDIDASH]));

    expect({
      edit: all(host, 'admin-project-edit').map((link) => ({
        tag: link.tagName,
        name: accessibleName(link),
        href: link.getAttribute('href'),
        expanded: link.getAttribute('aria-expanded'),
      })),
      delete: all(host, 'admin-project-delete').map((element) =>
        accessibleName(nativeButton(element)),
      ),
    }).toEqual({
      edit: [
        {
          tag: 'A',
          name: 'Modifier\u00a0: DashFlow',
          href: '/admin/projects/p-1',
          expanded: null,
        },
        {
          tag: 'A',
          name: 'Modifier\u00a0: CandiDash',
          href: '/admin/projects/p-2',
          expanded: null,
        },
      ],
      delete: ['Supprimer\u00a0: DashFlow', 'Supprimer\u00a0: CandiDash'],
    });
  });

  it('Given the list When the edit link of CandiDash is followed Then its editing page opens', async () => {
    const { fixture, host } = await renderProjects(withProjects([DASHFLOW, CANDIDASH]));

    all(host, 'admin-project-edit')[1]?.click();
    await settleBounded(fixture);

    expect(TestBed.inject(Router).url).toBe('/admin/projects/p-2');
  });
});

describe('AdminProjects: lignes éditoriales', () => {
  it('Given three projects When the list renders Then each row reads its rank and category, its title as h2 and its pitch, or says the pitch is empty', async () => {
    const { host } = await renderProjects(withProjects([DASHFLOW, CANDIDASH, COMPTOIR]));

    expect(
      all(host, 'admin-project-row').map((row) => ({
        overline: testIdText(row, 'admin-project-row-overline'),
        heading: byTestId(row, 'admin-project-row-title')?.tagName,
        title: testIdText(row, 'admin-project-row-title'),
        pitch: byTestId(row, 'admin-project-row-pitch')
          ? testIdText(row, 'admin-project-row-pitch')
          : null,
        missing: byTestId(row, 'admin-project-pitch-missing')
          ? testIdText(row, 'admin-project-pitch-missing')
          : null,
      })),
    ).toEqual([
      {
        overline: '01 · Application Web',
        heading: 'H2',
        title: 'DashFlow',
        pitch: 'Le foyer dans une seule app.',
        missing: null,
      },
      {
        overline: '02 · Application Web',
        heading: 'H2',
        title: 'CandiDash',
        pitch: null,
        missing:
          'Accroche vide\u00a0: la carte publique reprend la première phrase de la description.',
      },
      {
        overline: '03 · Site vitrine',
        heading: 'H2',
        title: 'Le Vieux Comptoir',
        pitch: 'Un restaurant fictif.',
        missing: null,
      },
    ]);
  });

  it('Given three projects When the list renders Then each cover carries the nature stamp', async () => {
    const { host } = await renderProjects(withProjects([DASHFLOW, CANDIDASH, COMPTOIR]));

    expect(
      all(host, 'admin-project-row').map((row) => ({
        cover: byTestId(row, 'project-cover') !== null,
        kind: testIdText(row, 'project-cover-kind'),
      })),
    ).toEqual([
      { cover: true, kind: 'En production' },
      { cover: true, kind: 'En production' },
      { cover: true, kind: 'Démo' },
    ]);
  });

  it('Given a featured project with five tools When the list renders Then its facts give the stack with the remainder, then « Accueil : Mis en avant » only for it', async () => {
    const { host } = await renderProjects(withProjects([DASHFLOW, CANDIDASH]));

    expect(
      all(host, 'admin-project-row').map((row) =>
        all(row, 'fact-label').map((label, index) => [
          normalized(label),
          normalized(all(row, 'fact-value')[index]),
        ]),
      ),
    ).toEqual([
      [
        ['Stack', 'Angular · TypeScript · NestJS · Docker +1'],
        ['Accueil', 'Mis en avant'],
      ],
      [['Stack', 'Angular']],
    ]);
  });

  it('Given the list When it renders Then each row opens its public page in a new tab', async () => {
    const { host } = await renderProjects(withProjects([DASHFLOW, CANDIDASH]));

    expect(
      all(host, 'admin-project-view').map((link) => ({
        tag: link.tagName,
        href: link.getAttribute('href'),
        target: link.getAttribute('target'),
        noopener: link.getAttribute('rel')?.split(/\s+/).includes('noopener') ?? false,
        name: accessibleName(link),
      })),
    ).toEqual([
      {
        tag: 'A',
        href: '/projects/dashflow',
        target: '_blank',
        noopener: true,
        name: 'Voir la fiche publique\u00a0: DashFlow (nouvel onglet)',
      },
      {
        tag: 'A',
        href: '/projects/candidash',
        target: '_blank',
        noopener: true,
        name: 'Voir la fiche publique\u00a0: CandiDash (nouvel onglet)',
      },
    ]);
  });
});

describe('AdminProjects: filtre par nature', () => {
  const readFilters = (
    host: HTMLElement,
  ): { label: string | null; options: readonly Record<string, string | null>[] } => ({
    label: byTestId(host, 'filter-group')?.getAttribute('aria-label') ?? null,
    options: all(host, 'filter-option').map((option) => ({
      label: testIdText(option, 'filter-option-label'),
      count: testIdText(option, 'filter-option-count'),
      pressed: option.getAttribute('aria-pressed'),
      disabled: option.getAttribute('aria-disabled'),
    })),
  });

  it('Given two projects in production and one demo When the page renders Then the nature filter counts them, « Tous » pressed and « Scripts » disabled', async () => {
    const { host } = await renderProjects(withProjects([DASHFLOW, CANDIDASH, COMPTOIR]));

    expect(readFilters(host)).toEqual({
      label: 'Filtrer par nature',
      options: [
        { label: 'Tous', count: '3', pressed: 'true', disabled: null },
        { label: 'En production', count: '2', pressed: 'false', disabled: null },
        { label: 'Démos', count: '1', pressed: 'false', disabled: null },
        { label: 'Scripts', count: '0', pressed: 'false', disabled: 'true' },
      ],
    });
  });

  it.each([
    { index: 1, filter: 'En production', titles: ['DashFlow', 'CandiDash'] },
    { index: 2, filter: 'Démos', titles: ['Le Vieux Comptoir'] },
  ])(
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

  it('Given the demos filtered When « Tous » is pressed again Then every project is back', async () => {
    const { fixture, host } = await renderProjects(withProjects([DASHFLOW, CANDIDASH, COMPTOIR]));

    await pressTestId(fixture, 'filter-option', 2);
    await pressTestId(fixture, 'filter-option', 0);

    expect(rowTitles(host)).toEqual(['DashFlow', 'CandiDash', 'Le Vieux Comptoir']);
  });
});
