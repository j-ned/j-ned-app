import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { describe, it, expect, afterEach, vi } from 'vitest';
import { Projects } from './projects';
import { ProjectsGateway } from '../domain/gateways/projects.gateway';
import { AnalyticsGateway } from '@features/analytics/domain/gateways/analytics.gateway';
import type { Project } from '../domain/models/project.model';
import { makeProject } from '../testing/project-builders';

function setup(gateway: Partial<ProjectsGateway>): ComponentFixture<Projects> {
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      { provide: ProjectsGateway, useValue: gateway },
      { provide: AnalyticsGateway, useValue: { trackProjectClick: vi.fn() } },
    ],
  });
  return TestBed.createComponent(Projects);
}

describe('Projects', () => {
  afterEach(() => TestBed.resetTestingModule());

  it("affiche les projets chargés, sans état d'erreur", async () => {
    const fixture = setup({
      getAllProjects: () => of([makeProject()] as readonly Project[]),
    });
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Mon site');
    expect(fixture.nativeElement.querySelector('[data-testid="projects-error"]')).toBeNull();
  });

  it("affiche un état d'erreur, pas « Aucun projet », et relance au clic", async () => {
    let calls = 0;
    const fixture = setup({
      getAllProjects: () => {
        calls += 1;
        return calls === 1
          ? throwError(() => new Error('down'))
          : of([makeProject()] as readonly Project[]);
      },
    });
    await fixture.whenStable();
    fixture.detectChanges();

    const error = fixture.nativeElement.querySelector(
      '[data-testid="projects-error"]',
    ) as HTMLElement;
    expect(error).not.toBeNull();
    expect(fixture.nativeElement.querySelector('[data-testid="projects-empty"]')).toBeNull();

    (error.querySelector('button') as HTMLButtonElement).click();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[data-testid="projects-error"]')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Mon site');
  });

  it('Given des projets chargés When la page est rendue Then elle n’émet aucun main et porte la mise en page sur l’host', async () => {
    const fixture = setup({
      getAllProjects: () => of([makeProject()] as readonly Project[]),
    });
    await fixture.whenStable();
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;

    expect(host.textContent).toContain('Mon site');
    expect(host.querySelectorAll('main')).toHaveLength(0);
    expect([...host.classList].sort()).toEqual(['block', 'min-h-svh', 'pb-24', 'pt-20']);
  });

  it('Given la page When elle est rendue Then son unique h1 la titre « Réalisations »', async () => {
    const fixture = setup({
      getAllProjects: () => of([makeProject()] as readonly Project[]),
    });
    await fixture.whenStable();
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    const title = host.querySelector('[data-testid="projects-title"]');

    expect(title?.tagName).toBe('H1');
    expect(title?.textContent?.trim()).toBe('Réalisations');
    expect(host.querySelectorAll('h1')).toHaveLength(1);
  });

  // Titre du premier écran : un fondu d'entrée (opacité nulle) le masque au premier rendu.
  it('Given la page When elle est rendue Then le titre est visible au premier rendu, sans animation d’entrée', async () => {
    const fixture = setup({
      getAllProjects: () => of([makeProject()] as readonly Project[]),
    });
    await fixture.whenStable();
    fixture.detectChanges();
    const title = (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>(
      '[data-testid="projects-title"]',
    );
    expect(title).not.toBeNull();
    expect(title?.className).not.toMatch(/\banimate-/);
  });

  it('Given deux projets en production mis en avant When la page est rendue Then seule l’image de la première étude de cas est prioritaire sur toute la page', async () => {
    const fixture = setup({
      getAllProjects: () =>
        of([
          makeProject({ id: 'a', slug: 'a', featured: true, image: '/projects/a.avif' }),
          makeProject({ id: 'b', slug: 'b', featured: true, image: '/projects/b.avif' }),
        ] as readonly Project[]),
    });
    await fixture.whenStable();
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    const images = Array.from(host.querySelectorAll('img'));

    expect(images.map((img) => img.closest('[data-testid="project-case-study"]') !== null)).toEqual(
      [true, true],
    );
    expect(images.map((img) => img.getAttribute('fetchpriority'))).toEqual(['high', 'auto']);
  });

  describe('en-tête : compte, introduction et légende par nature', () => {
    const catalogOf = (kinds: readonly Project['kind'][]): readonly Project[] =>
      kinds.map((kind, index) =>
        makeProject({ id: `p-${index}`, slug: `p-${index}`, title: `Projet ${index}`, kind }),
      );

    const MOCKUP_CATALOG = catalogOf([
      'production',
      'production',
      'demo',
      'demo',
      'script',
      'script',
    ]);

    const renderHeader = async (projects: readonly Project[]): Promise<HTMLElement> => {
      const fixture = setup({
        getAllProjects: () => of(projects),
      });
      await fixture.whenStable();
      fixture.detectChanges();
      return fixture.nativeElement as HTMLElement;
    };

    const textOf = (root: HTMLElement, testId: string): string[] =>
      Array.from(root.querySelectorAll(`[data-testid="${testId}"]`)).map((element) =>
        (element.textContent ?? '').replace(/\s+/g, ' ').trim(),
      );

    it.each([
      { label: 'six projets', projects: MOCKUP_CATALOG, expected: '6 réalisations' },
      { label: 'un seul projet', projects: catalogOf(['demo']), expected: '1 réalisation' },
      {
        label: 'un projet sans nature',
        projects: catalogOf(['production', null]),
        expected: '2 réalisations',
      },
    ])(
      'Given $label When la page est rendue Then le sur-titre compte toutes les réalisations : $expected',
      async ({ projects, expected }) => {
        expect(textOf(await renderHeader(projects), 'projects-count')).toEqual([expected]);
      },
    );

    it('Given le catalogue de la maquette When la page est rendue Then l’introduction est celle de la maquette', async () => {
      expect(textOf(await renderHeader(MOCKUP_CATALOG), 'projects-intro')).toEqual([
        'Deux applications en service, deux sites de démonstration, deux outils de développement. Chaque fiche montre le résultat et les choix techniques.',
      ]);
    });

    it('Given une seule application en production When la page est rendue Then l’introduction ne nomme que sa nature', async () => {
      expect(textOf(await renderHeader(catalogOf(['production'])), 'projects-intro')).toEqual([
        'Une application en service. Chaque fiche montre le résultat et les choix techniques.',
      ]);
    });

    it.each([
      {
        label: 'le catalogue de la maquette',
        projects: MOCKUP_CATALOG,
        expected: ['2 projets', '2 projets', '2 projets'],
      },
      {
        label: 'trois productions, une démo et un projet sans nature',
        projects: catalogOf(['production', 'demo', 'production', null, 'production']),
        expected: ['3 projets', '1 projet', '0 projet'],
      },
    ])(
      'Given $label When la page est rendue Then la légende compte les projets de chaque nature',
      async ({ projects, expected }) => {
        const root = await renderHeader(projects);

        expect(textOf(root, 'project-kind-legend-kind')).toEqual([
          'En production',
          'Démo',
          'Script',
        ]);
        expect(textOf(root, 'project-kind-legend-count')).toEqual(expected);
      },
    );

    it('Given la page When elle est rendue Then la légende est dans l’en-tête, à côté du titre', async () => {
      const root = await renderHeader(MOCKUP_CATALOG);
      const title = root.querySelector('[data-testid="projects-title"]');
      const legendCounts = Array.from(
        root.querySelectorAll('[data-testid="project-kind-legend-count"]'),
      );

      expect(legendCounts).toHaveLength(3);
      expect(
        legendCounts.every((count) => count.closest('header') === title?.closest('header')),
      ).toBe(true);
      expect(title?.closest('header')).not.toBeNull();
    });
  });

  describe('classement par nature : études de cas puis grille', () => {
    const CATALOG: readonly Project[] = [
      makeProject({
        id: 'a',
        slug: 'a',
        title: 'Alpha',
        category: 'Web',
        featured: true,
        kind: 'production',
        description: 'Alpha fait X. Détail.',
      }),
      makeProject({
        id: 'b',
        slug: 'b',
        title: 'Beta',
        category: 'Web',
        featured: true,
        kind: 'production',
      }),
      makeProject({
        id: 'c',
        slug: 'c',
        title: 'Gamma',
        category: 'Web',
        kind: 'demo',
        tags: ['Astro', 'Tailwind', 'CI/CD', 'Docker'],
      }),
      makeProject({ id: 'd', slug: 'd', title: 'Delta', category: 'Script', kind: 'script' }),
      makeProject({ id: 'e', slug: 'e', title: 'Epsilon', category: 'Script', kind: 'script' }),
      makeProject({
        id: 'f',
        slug: 'f',
        title: 'Zeta',
        category: 'Web',
        kind: 'demo',
        description: 'Zeta automatise Y. Suite.',
      }),
    ];

    const render = async (): Promise<ComponentFixture<Projects>> => {
      const fixture = setup({
        getAllProjects: () => of(CATALOG),
      });
      await fixture.whenStable();
      fixture.detectChanges();
      return fixture;
    };

    const titlesOf = (f: ComponentFixture<Projects>, testId: string): string[] =>
      Array.from(
        (f.nativeElement as HTMLElement).querySelectorAll(`[data-testid="${testId}"]`),
      ).map((title) => title.textContent?.trim() ?? '');

    it('Given « Tous » When la liste est rendue Then les projets en production sont en études de cas et les autres en cartes de la grille', async () => {
      const fixture = await render();

      expect(titlesOf(fixture, 'project-case-study-title')).toEqual(['Alpha', 'Beta']);
      expect(titlesOf(fixture, 'project-grid-card-title')).toEqual([
        'Gamma',
        'Delta',
        'Epsilon',
        'Zeta',
      ]);
    });
  });

  describe('section « Démos et outils » : une carte par démo ou script', () => {
    const project = (
      title: string,
      kind: Project['kind'],
      overrides: Partial<Project> = {},
    ): Project => makeProject({ id: title, slug: title, title, kind, ...overrides });

    const renderPage = async (projects: readonly Project[]): Promise<HTMLElement> => {
      const fixture = setup({
        getAllProjects: () => of(projects),
      });
      await fixture.whenStable();
      fixture.detectChanges();
      return fixture.nativeElement as HTMLElement;
    };

    const normalized = (element: Element | null | undefined): string =>
      (element?.textContent ?? '').replace(/\s+/g, ' ').trim();

    const section = (root: HTMLElement): HTMLElement | null =>
      root.querySelector<HTMLElement>('[data-testid="projects-cards"]');

    const cardTitles = (root: HTMLElement): string[] =>
      Array.from(root.querySelectorAll('[data-testid="project-grid-card-title"]')).map(normalized);

    const MIXED: readonly Project[] = [
      project('Coaching Life', 'demo', { featured: true }),
      project('CandiDash', 'production', { featured: false }),
      project('GitPush Auto', 'script'),
      project('Inconnu', null),
      project('DashFlow', 'production', { featured: true }),
    ];

    it('Given des démos et des scripts When la page est rendue Then une section titrée « Démos et outils » les liste en cartes', async () => {
      const root = await renderPage([
        project('Coaching Life', 'demo'),
        project('LabelSync Pro', 'script'),
      ]);
      const cardsSection = section(root);
      const headingId = cardsSection?.getAttribute('aria-labelledby') ?? '';
      const heading = headingId ? root.querySelector(`#${headingId}`) : null;
      const cards = Array.from(
        root.querySelectorAll<HTMLElement>('[data-testid="project-grid-card"]'),
      );

      expect(cardsSection?.tagName).toBe('SECTION');
      expect(heading?.tagName).toBe('H2');
      expect(normalized(heading)).toBe('Démos et outils');
      expect(cardTitles(root)).toEqual(['Coaching Life', 'LabelSync Pro']);
      expect(
        cards.map((card) => {
          const list = card.closest('li')?.parentElement;
          return [
            list?.tagName,
            list?.getAttribute('role'),
            list?.closest('section') === cardsSection,
          ];
        }),
      ).toEqual([
        ['UL', 'list', true],
        ['UL', 'list', true],
      ]);
    });

    it.each([
      {
        label: 'quatre démos et scripts',
        projects: [
          project('a', 'demo'),
          project('b', 'demo'),
          project('c', 'script'),
          project('d', 'script'),
        ],
        expected: '4 projets',
      },
      { label: 'une démo', projects: [project('a', 'demo')], expected: '1 projet' },
    ])(
      'Given $label When la page est rendue Then l’en-tête de section les compte : $expected',
      async ({ projects, expected }) => {
        const root = await renderPage(projects);

        expect(normalized(root.querySelector('[data-testid="projects-cards-count"]'))).toBe(
          expected,
        );
      },
    );

    it('Given des natures mêlées et des projets mis en avant When la page est rendue Then chaque projet apparaît une seule fois, classé par sa seule nature', async () => {
      const root = await renderPage(MIXED);

      expect(cardTitles(root)).toEqual(['Coaching Life', 'GitPush Auto', 'Inconnu']);
      expect(Array.from(root.querySelectorAll('h3')).map(normalized)).toEqual([
        'CandiDash',
        'DashFlow',
        'Coaching Life',
        'GitPush Auto',
        'Inconnu',
      ]);
    });

    it('Given des projets en production seulement When la page est rendue Then la section « Démos et outils » n’est pas rendue', async () => {
      const root = await renderPage([
        project('DashFlow', 'production'),
        project('CandiDash', 'production'),
      ]);

      expect(section(root)).toBeNull();
      expect(cardTitles(root)).toEqual([]);
    });

    it('Given une démo renseignée When la page est rendue Then sa carte reprend ses données : tampon, deux outils, première phrase et lien vers la fiche', async () => {
      const root = await renderPage([
        project('Le Vieux Comptoir', 'demo', {
          slug: 'le-vieux-comptoir',
          tags: ['Astro', 'TailwindCSS', 'Docker'],
          pitch: null,
          description: 'Brasserie fictive en une page. La carte et la réservation.',
          image: 'https://api.test/projects/le-vieux-comptoir.avif',
        }),
      ]);
      const byTestId = (id: string): string[] =>
        Array.from(root.querySelectorAll(`[data-testid="${id}"]`)).map(normalized);

      expect({
        kind: byTestId('project-cover-kind'),
        stack: byTestId('project-grid-card-stack'),
        pitch: byTestId('project-grid-card-pitch'),
        href: root.querySelector('[data-testid="project-grid-card-link"]')?.getAttribute('href'),
      }).toEqual({
        kind: ['Démo'],
        stack: ['Astro · TailwindCSS'],
        pitch: ['Brasserie fictive en une page.'],
        href: '/projects/le-vieux-comptoir',
      });
    });

    it('Given un projet sans nature When la page est rendue Then il a sa carte dans la grille, sans tampon', async () => {
      const root = await renderPage([project('Inconnu', null)]);

      expect(cardTitles(root)).toEqual(['Inconnu']);
      expect(root.querySelector('[data-testid="project-grid-card-cover"]')).not.toBeNull();
      expect(root.querySelectorAll('[data-testid="project-cover-kind"]')).toHaveLength(0);
    });

    it('Given treize démos When la page est rendue Then les treize cartes sont listées sur une seule page', async () => {
      const root = await renderPage(
        Array.from({ length: 13 }, (_, index) => project(`Démo ${index + 1}`, 'demo')),
      );

      expect(cardTitles(root)).toEqual(
        Array.from({ length: 13 }, (_, index) => `Démo ${index + 1}`),
      );
    });

    it('Given des études de cas et des cartes illustrées When la page est rendue Then seule la première étude de cas est prioritaire, jamais une image de la grille', async () => {
      const root = await renderPage([
        project('DashFlow', 'production', { image: '/projects/dashflow.avif' }),
        project('Coaching Life', 'demo', { image: '/projects/coaching.avif' }),
        project('CandiDash', 'production', { image: '/projects/candidash.avif' }),
        project('GitPush Auto', 'script', { image: '/projects/gitpush.avif' }),
      ]);
      const images = Array.from(root.querySelectorAll('img'));

      expect(
        images.map((img) => [
          img.closest('[data-testid="project-grid-card"]') !== null,
          img.getAttribute('fetchpriority'),
        ]),
      ).toEqual([
        [false, 'high'],
        [false, 'auto'],
        [true, 'auto'],
        [true, 'auto'],
      ]);
    });

    it('Given des projets de toutes natures When la page est rendue Then les titres descendent sans saut : h1, h2 et h3 des études de cas, puis h2 et h3 de la grille', async () => {
      const root = await renderPage([
        project('DashFlow', 'production'),
        project('Coaching Life', 'demo'),
        project('GitPush Auto', 'script'),
      ]);

      expect(
        Array.from(root.querySelectorAll('h1, h2, h3, h4, h5, h6')).map((heading) => [
          heading.tagName,
          normalized(heading),
        ]),
      ).toEqual([
        ['H1', 'Réalisations'],
        ['H2', 'En production'],
        ['H3', 'DashFlow'],
        ['H2', 'Démos et outils'],
        ['H3', 'Coaching Life'],
        ['H3', 'GitPush Auto'],
      ]);
    });
  });

  describe('section « En production » : une étude de cas par projet en production', () => {
    const production = (id: string, overrides: Partial<Project> = {}): Project =>
      makeProject({ id, slug: id, title: id, kind: 'production', featured: true, ...overrides });

    const mount = async (projects: readonly Project[]): Promise<ComponentFixture<Projects>> => {
      const fixture = setup({
        getAllProjects: () => of(projects),
      });
      await fixture.whenStable();
      fixture.detectChanges();
      return fixture;
    };

    const renderPage = async (projects: readonly Project[]): Promise<HTMLElement> =>
      (await mount(projects)).nativeElement as HTMLElement;

    const normalized = (element: Element | null | undefined): string =>
      (element?.textContent ?? '').replace(/\s+/g, ' ').trim();

    const section = (root: HTMLElement): HTMLElement | null =>
      root.querySelector<HTMLElement>('[data-testid="projects-case-studies"]');

    const caseStudyTitles = (root: HTMLElement): string[] =>
      Array.from(root.querySelectorAll('[data-testid="project-case-study-title"]')).map(normalized);

    it('Given des projets en production When la page est rendue Then une section titrée « En production » regroupe leurs études de cas', async () => {
      const root = await renderPage([production('DashFlow'), production('CandiDash')]);
      const caseStudiesSection = section(root);
      const headingId = caseStudiesSection?.getAttribute('aria-labelledby') ?? '';
      const heading = headingId ? root.querySelector(`#${headingId}`) : null;
      const titles = Array.from(
        root.querySelectorAll<HTMLElement>('[data-testid="project-case-study-title"]'),
      );

      expect(caseStudiesSection?.tagName).toBe('SECTION');
      expect(heading?.tagName).toBe('H2');
      expect(normalized(heading)).toBe('En production');
      expect(titles).toHaveLength(2);
      expect(titles.every((title) => title.closest('section') === caseStudiesSection)).toBe(true);
    });

    it.each([
      {
        label: 'deux projets',
        projects: [production('a'), production('b')],
        expected: '2 applications',
      },
      { label: 'un projet', projects: [production('a')], expected: '1 application' },
    ])(
      'Given $label en production When la page est rendue Then l’en-tête de section les compte : $expected',
      async ({ projects, expected }) => {
        const root = await renderPage(projects);

        expect(normalized(root.querySelector('[data-testid="projects-case-studies-count"]'))).toBe(
          expected,
        );
      },
    );

    it('Given des natures mêlées When la page est rendue Then seuls les projets en production ont une étude de cas, dans l’ordre, mis en avant ou non', async () => {
      const root = await renderPage([
        makeProject({
          id: 'demo',
          slug: 'demo',
          title: 'Coaching Life',
          kind: 'demo',
          featured: true,
        }),
        production('CandiDash', { featured: false }),
        makeProject({ id: 'script', slug: 'script', title: 'GitPush Auto', kind: 'script' }),
        makeProject({ id: 'unknown', slug: 'unknown', title: 'Inconnu', kind: null }),
        production('DashFlow'),
      ]);

      expect(caseStudyTitles(root)).toEqual(['CandiDash', 'DashFlow']);
    });

    it('Given aucun projet en production When la page est rendue Then la section « En production » n’est pas rendue', async () => {
      const root = await renderPage([
        makeProject({ id: 'demo', slug: 'demo', kind: 'demo' }),
        makeProject({ id: 'script', slug: 'script', kind: 'script' }),
      ]);

      expect(section(root)).toBeNull();
      expect(caseStudyTitles(root)).toEqual([]);
    });

    it('Given un projet en production renseigné When la page est rendue Then son étude de cas reprend ses données', async () => {
      const root = await renderPage([
        production('dashflow', {
          title: 'DashFlow',
          category: 'Application web',
          tags: ['Angular', 'NestJS', 'PostgreSQL', 'Docker', 'JWT'],
          pitch: 'Le budget familial dans une seule app.',
          highlight: 'Chiffrement de bout en bout côté client',
          scope: null,
          liveUrl: 'https://dashflow.nedellec-julien.fr',
        }),
      ]);
      const byTestId = (id: string): string[] =>
        Array.from(root.querySelectorAll(`[data-testid="${id}"]`)).map(normalized);

      expect({
        overline: byTestId('project-case-study-overline'),
        pitch: byTestId('project-case-study-pitch'),
        labels: byTestId('project-fact-label'),
        values: byTestId('project-fact-value'),
        page: root.querySelector('[data-testid="project-case-study-link"]')?.getAttribute('href'),
        live: root
          .querySelector('[data-testid="project-case-study-live-link"]')
          ?.getAttribute('href'),
      }).toEqual({
        overline: ['01 · Application web'],
        pitch: ['Le budget familial dans une seule app.'],
        labels: ['Stack', 'Point fort'],
        values: [
          'Angular · NestJS · PostgreSQL · Docker',
          'Chiffrement de bout en bout côté client',
        ],
        page: '/projects/dashflow',
        live: 'https://dashflow.nedellec-julien.fr',
      });
    });

    it('Given un projet en production sans accroche When la page est rendue Then l’étude de cas montre la première phrase de sa description', async () => {
      const root = await renderPage([
        production('candidash', {
          pitch: null,
          description: 'Un tracker de candidatures dédié. Sans tableur.',
        }),
      ]);

      expect(normalized(root.querySelector('[data-testid="project-case-study-pitch"]'))).toBe(
        'Un tracker de candidatures dédié.',
      );
    });

    it('Given trois projets en production When la page est rendue Then les couvertures alternent de côté sur grand écran, la première à droite comme sur la maquette', async () => {
      const root = await renderPage([production('a'), production('b'), production('c')]);
      const covers = Array.from(
        root.querySelectorAll<HTMLElement>('[data-testid="project-case-study-cover"]'),
      );

      expect(covers.map((cover) => cover.classList.contains('lg:order-last'))).toEqual([
        true,
        false,
        true,
      ]);
    });

    it('Given une étude de cas avec un lien vers l’application When le visiteur l’ouvre Then le clic est suivi pour ce projet', async () => {
      const fixture = await mount([
        production('dashflow', {
          title: 'DashFlow',
          liveUrl: 'https://dashflow.nedellec-julien.fr',
        }),
      ]);
      const analytics = TestBed.inject(AnalyticsGateway);

      (fixture.nativeElement as HTMLElement)
        .querySelector<HTMLElement>('[data-testid="project-case-study-live-link"]')
        ?.click();

      expect(analytics.trackProjectClick).toHaveBeenCalledTimes(1);
      expect(analytics.trackProjectClick).toHaveBeenCalledWith('dashflow', 'DashFlow');
    });

    it('Given des projets en production When la page est rendue Then les titres descendent sans saut : h1, h2, puis un h3 par étude de cas', async () => {
      const root = await renderPage([production('DashFlow'), production('CandiDash')]);

      expect(
        Array.from(root.querySelectorAll('h1, h2, h3, h4, h5, h6')).map((heading) => [
          heading.tagName,
          normalized(heading),
        ]),
      ).toEqual([
        ['H1', 'Réalisations'],
        ['H2', 'En production'],
        ['H3', 'DashFlow'],
        ['H3', 'CandiDash'],
      ]);
    });
  });

  it('Given une liste chargée vide When la page est rendue Then elle dit qu’il n’y a aucune réalisation pour le moment', async () => {
    const fixture = setup({ getAllProjects: () => of([] as readonly Project[]) });
    await fixture.whenStable();
    fixture.detectChanges();
    const empty = (fixture.nativeElement as HTMLElement).querySelector(
      '[data-testid="projects-empty"]',
    );

    expect(empty?.textContent?.replace(/\s+/g, ' ').trim()).toBe(
      'Aucune réalisation pour le moment.',
    );
  });

  describe('filtres par nature', () => {
    const project = (
      title: string,
      kind: Project['kind'],
      overrides: Partial<Project> = {},
    ): Project => makeProject({ id: title, slug: title, title, kind, ...overrides });

    const MOCKUP: readonly Project[] = [
      project('DashFlow', 'production', { image: '/projects/dashflow.avif' }),
      project('CandiDash', 'production', { image: '/projects/candidash.avif' }),
      project('Coaching Life', 'demo', { image: '/projects/coaching.avif' }),
      project('Le Vieux Comptoir', 'demo', { image: '/projects/comptoir.avif' }),
      project('LabelSync Pro', 'script', { image: '/projects/labelsync.avif' }),
      project('GitPush Auto', 'script', { image: '/projects/gitpush.avif' }),
    ];

    const WITH_UNKNOWN: readonly Project[] = [...MOCKUP, project('Inconnu', null)];

    const mount = async (projects: readonly Project[]): Promise<ComponentFixture<Projects>> => {
      const fixture = setup({ getAllProjects: () => of(projects) });
      await fixture.whenStable();
      fixture.detectChanges();
      return fixture;
    };

    const rootOf = (fixture: ComponentFixture<Projects>): HTMLElement =>
      fixture.nativeElement as HTMLElement;

    const normalized = (element: Element | null | undefined): string =>
      (element?.textContent ?? '').replace(/\s+/g, ' ').trim();

    const textsOf = (root: HTMLElement, testId: string): string[] =>
      Array.from(root.querySelectorAll(`[data-testid="${testId}"]`)).map(normalized);

    const filterButtons = (root: HTMLElement): HTMLButtonElement[] =>
      Array.from(root.querySelectorAll<HTMLButtonElement>('[data-testid="project-kind-filter"]'));

    const choose = async (fixture: ComponentFixture<Projects>, label: string): Promise<void> => {
      filterButtons(rootOf(fixture))
        .find(
          (button) =>
            normalized(button.querySelector('[data-testid="project-kind-filter-label"]')) === label,
        )
        ?.click();
      fixture.detectChanges();
      await fixture.whenStable();
    };

    const shown = (root: HTMLElement): { caseStudies: string[]; cards: string[] } => ({
      caseStudies: textsOf(root, 'project-case-study-title'),
      cards: textsOf(root, 'project-grid-card-title'),
    });

    it('Given le catalogue de la maquette When la page est rendue Then le groupe « Filtrer par nature » propose Tous et chaque nature avec son compte, Tous pressé', async () => {
      const root = rootOf(await mount(WITH_UNKNOWN));
      const group = root.querySelector('[data-testid="project-kind-filters"]');

      expect(group?.getAttribute('role')).toBe('group');
      expect(group?.getAttribute('aria-label')).toBe('Filtrer par nature');
      expect(
        filterButtons(root).map((button) => [
          normalized(button.querySelector('[data-testid="project-kind-filter-label"]')),
          normalized(button.querySelector('[data-testid="project-kind-filter-count"]')),
          button.getAttribute('aria-pressed'),
        ]),
      ).toEqual([
        ['Tous', '7', 'true'],
        ['En production', '2', 'false'],
        ['Démos', '2', 'false'],
        ['Scripts', '2', 'false'],
      ]);
    });

    it('Given aucune démo When la page est rendue Then le filtre « Démos » n’est pas proposé', async () => {
      const root = rootOf(
        await mount([project('DashFlow', 'production'), project('GitPush Auto', 'script')]),
      );

      expect(textsOf(root, 'project-kind-filter-label')).toEqual([
        'Tous',
        'En production',
        'Scripts',
      ]);
    });

    it.each([
      {
        label: 'En production',
        expected: { caseStudies: ['DashFlow', 'CandiDash'], cards: [] },
        sections: { caseStudies: true, cards: false },
      },
      {
        label: 'Démos',
        expected: { caseStudies: [], cards: ['Coaching Life', 'Le Vieux Comptoir'] },
        sections: { caseStudies: false, cards: true },
      },
      {
        label: 'Scripts',
        expected: { caseStudies: [], cards: ['LabelSync Pro', 'GitPush Auto'] },
        sections: { caseStudies: false, cards: true },
      },
    ])(
      'Given le catalogue avec un projet sans nature When le visiteur choisit « $label » Then seuls les projets de cette nature restent et une section vide n’est pas rendue',
      async ({ label, expected, sections }) => {
        const fixture = await mount(WITH_UNKNOWN);

        await choose(fixture, label);
        const root = rootOf(fixture);

        expect(shown(root)).toEqual(expected);
        expect({
          caseStudies: root.querySelector('[data-testid="projects-case-studies"]') !== null,
          cards: root.querySelector('[data-testid="projects-cards"]') !== null,
        }).toEqual(sections);
      },
    );

    it('Given le filtre « Démos » choisi When le visiteur revient à « Tous » Then tous les projets reviennent, celui sans nature compris', async () => {
      const fixture = await mount(WITH_UNKNOWN);

      await choose(fixture, 'Démos');
      await choose(fixture, 'Tous');

      expect(shown(rootOf(fixture))).toEqual({
        caseStudies: ['DashFlow', 'CandiDash'],
        cards: ['Coaching Life', 'Le Vieux Comptoir', 'LabelSync Pro', 'GitPush Auto', 'Inconnu'],
      });
    });

    it('Given le visiteur choisit « Scripts » When la page se met à jour Then seul ce bouton est pressé', async () => {
      const fixture = await mount(MOCKUP);

      await choose(fixture, 'Scripts');

      expect(
        filterButtons(rootOf(fixture)).map((button) => button.getAttribute('aria-pressed')),
      ).toEqual(['false', 'false', 'false', 'true']);
    });

    it('Given un filtre choisi When la page se met à jour Then l’en-tête garde le compte, l’introduction, la légende et les comptes des filtres de tout le catalogue', async () => {
      const fixture = await mount(WITH_UNKNOWN);
      const header = (
        root: HTMLElement,
      ): { count: string[]; intro: string[]; legend: string[]; filters: string[] } => ({
        count: textsOf(root, 'projects-count'),
        intro: textsOf(root, 'projects-intro'),
        legend: textsOf(root, 'project-kind-legend-count'),
        filters: textsOf(root, 'project-kind-filter-count'),
      });
      const before = header(rootOf(fixture));

      await choose(fixture, 'Scripts');

      expect(header(rootOf(fixture))).toEqual(before);
      expect(before.count).toEqual(['7 réalisations']);
      expect(before.filters).toEqual(['7', '2', '2', '2']);
    });

    it.each([
      { label: 'Tous', expected: '7 réalisations affichées' },
      { label: 'En production', expected: '2 réalisations affichées' },
      { label: 'Scripts', expected: '2 réalisations affichées' },
    ])(
      'Given le catalogue When le visiteur choisit « $label » Then la région de statut annonce « $expected »',
      async ({ label, expected }) => {
        const fixture = await mount(WITH_UNKNOWN);

        await choose(fixture, label);
        const status = rootOf(fixture).querySelector('[data-testid="projects-visible-count"]');

        expect(normalized(status)).toBe(expected);
      },
    );

    it('Given une seule démo When le visiteur la filtre Then le statut annonce « 1 réalisation affichée »', async () => {
      const fixture = await mount([project('DashFlow', 'production'), project('Coaching', 'demo')]);

      await choose(fixture, 'Démos');

      expect(
        normalized(rootOf(fixture).querySelector('[data-testid="projects-visible-count"]')),
      ).toBe('1 réalisation affichée');
    });

    it('Given la page When elle est rendue Then le statut est une région live polie, masquée visuellement et présente avant tout choix', async () => {
      const status = rootOf(await mount(MOCKUP)).querySelector(
        '[data-testid="projects-visible-count"]',
      );

      expect(status?.getAttribute('role')).toBe('status');
      expect(status?.classList.contains('sr-only')).toBe(true);
      expect(normalized(status)).toBe('6 réalisations affichées');
    });

    it('Given le filtre « Démos » When la page se met à jour Then aucune image n’est prioritaire', async () => {
      const fixture = await mount(MOCKUP);

      await choose(fixture, 'Démos');
      const images = Array.from(rootOf(fixture).querySelectorAll('img'));

      expect(images.map((img) => img.getAttribute('fetchpriority'))).toEqual(['auto', 'auto']);
    });

    it('Given le visiteur choisit un filtre When la page se met à jour Then l’URL ne change pas : le filtre reste un état local', async () => {
      const fixture = await mount(MOCKUP);
      const router = TestBed.inject(Router);
      const navigate = vi.spyOn(router, 'navigate');
      const navigateByUrl = vi.spyOn(router, 'navigateByUrl');

      await choose(fixture, 'Démos');

      expect(shown(rootOf(fixture)).cards).toEqual(['Coaching Life', 'Le Vieux Comptoir']);
      expect(navigate).not.toHaveBeenCalled();
      expect(navigateByUrl).not.toHaveBeenCalled();
    });

    it('Given le filtre « Scripts » choisi When les projets rechargés n’ont plus de script Then la page revient à « Tous », pressé', async () => {
      const catalog = new BehaviorSubject<readonly Project[]>(MOCKUP);
      const fixture = setup({ getAllProjects: () => catalog });
      await fixture.whenStable();
      fixture.detectChanges();
      await choose(fixture, 'Scripts');

      catalog.next(MOCKUP.filter((candidate) => candidate.kind !== 'script'));
      fixture.detectChanges();
      await fixture.whenStable();
      const root = rootOf(fixture);

      expect(
        filterButtons(root).map((button) => [
          normalized(button.querySelector('[data-testid="project-kind-filter-label"]')),
          button.getAttribute('aria-pressed'),
        ]),
      ).toEqual([
        ['Tous', 'true'],
        ['En production', 'false'],
        ['Démos', 'false'],
      ]);
      expect(shown(root)).toEqual({
        caseStudies: ['DashFlow', 'CandiDash'],
        cards: ['Coaching Life', 'Le Vieux Comptoir'],
      });
      expect(normalized(root.querySelector('[data-testid="projects-visible-count"]'))).toBe(
        '4 réalisations affichées',
      );
    });

    it('Given le filtre « Scripts » When la page est rendue Then les titres descendent sans saut : h1, h2 de la grille, ses h3', async () => {
      const fixture = await mount(MOCKUP);

      await choose(fixture, 'Scripts');

      expect(
        Array.from(rootOf(fixture).querySelectorAll('h1, h2, h3, h4, h5, h6')).map((heading) => [
          heading.tagName,
          normalized(heading),
        ]),
      ).toEqual([
        ['H1', 'Réalisations'],
        ['H2', 'Démos et outils'],
        ['H3', 'LabelSync Pro'],
        ['H3', 'GitPush Auto'],
      ]);
    });
  });
});
