import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { describe, it, expect, afterEach, vi } from 'vitest';
import { Projects } from './projects';
import { ProjectsGateway } from '../domain/gateways/projects.gateway';
import { AnalyticsGateway } from '@features/analytics/domain/gateways/analytics.gateway';
import type { Project } from '../domain/models/project.model';

function project(overrides: Partial<Project> = {}): Project {
  return {
    id: 'id-1',
    title: 'Mon site',
    slug: 'mon-site',
    category: 'Web',
    tags: [],
    description: 'desc',
    image: '',
    featured: false,
    order: 0,
    ...overrides,
  };
}

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
      getAllProjects: () => of([project()] as readonly Project[]),
      getCategories: () => of(['Tous', 'Web'] as readonly string[]),
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
          : of([project()] as readonly Project[]);
      },
      getCategories: () => of(['Tous'] as readonly string[]),
    });
    await fixture.whenStable();
    fixture.detectChanges();

    const error = fixture.nativeElement.querySelector(
      '[data-testid="projects-error"]',
    ) as HTMLElement;
    expect(error).not.toBeNull();
    expect(fixture.nativeElement.textContent).not.toContain('Aucun projet');

    (error.querySelector('button') as HTMLButtonElement).click();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[data-testid="projects-error"]')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Mon site');
  });

  it('Given des projets chargés When la page est rendue Then elle n’émet aucun main et porte la mise en page sur l’host', async () => {
    const fixture = setup({
      getAllProjects: () => of([project()] as readonly Project[]),
      getCategories: () => of(['Tous', 'Web'] as readonly string[]),
    });
    await fixture.whenStable();
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;

    expect(host.textContent).toContain('Mon site');
    expect(host.querySelectorAll('main')).toHaveLength(0);
    expect([...host.classList].sort()).toEqual(['block', 'min-h-svh', 'pb-24', 'pt-20']);
  });

  describe('hiérarchie mis en avant / index', () => {
    const CATALOG: readonly Project[] = [
      project({
        id: 'a',
        slug: 'a',
        title: 'Alpha',
        category: 'Web',
        featured: true,
        description: 'Alpha fait X. Détail.',
      }),
      project({ id: 'b', slug: 'b', title: 'Beta', category: 'Web', featured: true }),
      project({
        id: 'c',
        slug: 'c',
        title: 'Gamma',
        category: 'Web',
        tags: ['Astro', 'Tailwind', 'CI/CD', 'Docker'],
      }),
      project({ id: 'd', slug: 'd', title: 'Delta', category: 'Script' }),
      project({ id: 'e', slug: 'e', title: 'Epsilon', category: 'Script' }),
      project({
        id: 'f',
        slug: 'f',
        title: 'Zeta',
        category: 'Web',
        description: 'Zeta automatise Y. Suite.',
      }),
    ];

    const render = async (): Promise<ComponentFixture<Projects>> => {
      const fixture = setup({
        getAllProjects: () => of(CATALOG),
        getCategories: () => of(['Tous', 'Script', 'Web'] as readonly string[]),
      });
      await fixture.whenStable();
      fixture.detectChanges();
      return fixture;
    };

    const cards = (f: ComponentFixture<Projects>): string[] =>
      Array.from(
        (f.nativeElement as HTMLElement).querySelectorAll('[data-testid="project-card-link"]'),
      ).map((a) => a.textContent?.trim() ?? '');

    const indexRows = (f: ComponentFixture<Projects>): HTMLElement[] =>
      Array.from(
        (f.nativeElement as HTMLElement).querySelectorAll<HTMLElement>(
          '[data-testid="project-index-link"]',
        ),
      );

    const clickFilter = async (f: ComponentFixture<Projects>, label: string): Promise<void> => {
      const button = Array.from(
        (f.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>(
          '[role="group"] button',
        ),
      ).find((b) => b.textContent?.includes(label));
      button?.click();
      f.detectChanges();
      await f.whenStable();
    };

    it('Given « Tous » When la liste est rendue Then les projets mis en avant sont en cartes et les autres en index', async () => {
      const fixture = await render();
      expect(cards(fixture)).toEqual(['Alpha', 'Beta']);
      expect(indexRows(fixture).map((r) => r.querySelector('span')?.textContent?.trim())).toEqual([
        'Gamma',
        'Delta',
        'Epsilon',
        'Zeta',
      ]);
    });

    it('Given six projets When la liste est rendue Then tout tient sur une page, sans paginateur', async () => {
      const fixture = await render();
      expect(cards(fixture).length + indexRows(fixture).length).toBe(6);
      expect((fixture.nativeElement as HTMLElement).querySelector('app-paginator')).toBeNull();
    });

    it('Given un filtre actif When la liste est rendue Then tous les résultats passent dans l’index', async () => {
      const fixture = await render();
      await clickFilter(fixture, 'Web');
      expect(cards(fixture)).toEqual([]);
      expect(indexRows(fixture)).toHaveLength(4);
      expect(
        (fixture.nativeElement as HTMLElement).querySelector('#projects-index-heading')
          ?.textContent,
      ).toContain('Web');
    });

    it.each([
      { label: 'Tous', count: '6' },
      { label: 'Web', count: '4' },
      { label: 'Script', count: '2' },
    ])(
      'Given le filtre $label When la liste est rendue Then il affiche $count',
      async ({ label, count }) => {
        const fixture = await render();
        const button = Array.from(
          (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>(
            '[role="group"] button',
          ),
        ).find((b) => b.textContent?.trim().startsWith(label));
        expect(button?.querySelector('span')?.textContent?.trim()).toBe(count);
      },
    );

    it('Given un projet de l’index When la ligne est rendue Then première phrase et trois outils au plus', async () => {
      const rows = indexRows(await render());
      const gamma = rows.find((r) => r.textContent?.includes('Gamma'));
      expect(gamma?.textContent).toContain('Astro · Tailwind · CI/CD');
      expect(gamma?.textContent).not.toContain('Docker');
      const zeta = rows.find((r) => r.textContent?.includes('Zeta'));
      expect(zeta?.textContent).toContain('Zeta automatise Y.');
      expect(zeta?.textContent).not.toContain('Suite');
      expect(zeta?.getAttribute('href')).toBe('/projects/f');
    });
  });
});
