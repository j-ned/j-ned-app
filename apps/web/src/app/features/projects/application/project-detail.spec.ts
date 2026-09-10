import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { describe, it, expect, vi, afterEach } from 'vitest';

import { ProjectDetail } from './project-detail';
import { ProjectsGateway } from '@features/projects/domain/gateways/projects.gateway';
import { AnalyticsGateway } from '@features/analytics/domain/gateways/analytics.gateway';
import type { Project } from '@features/projects/domain/models/project.model';

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
    techChoices: [{ techno: 'NestJS', why: 'modulaire' }],
    architectureDecisions: [{ decision: 'hexagonale', rationale: 'testable' }],
    ...overrides,
  };
}

function setup(projects: Project[]): ComponentFixture<ProjectDetail> {
  const gateway = {
    getAllProjects: () => of(projects as readonly Project[]),
  } as unknown as ProjectsGateway;
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      { provide: ProjectsGateway, useValue: gateway },
      { provide: AnalyticsGateway, useValue: { trackProjectClick: vi.fn() } },
    ],
  });
  return TestBed.createComponent(ProjectDetail);
}

describe('ProjectDetail', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('affiche le titre et les deux sections du projet correspondant au slug', async () => {
    const fixture = setup([project()]);
    fixture.componentRef.setInput('slug', 'mon-site');
    fixture.detectChanges();
    await fixture.whenStable();
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Mon site');
    expect(text).toContain('NestJS');
    expect(text).toContain('modulaire');
    expect(text).toContain('hexagonale');
    expect(text).toContain('testable');
  });

  it("rend l'image d'en-tête avec un sizes responsive (sans pixel): NG02952", () => {
    const fixture = setup([project({ image: 'https://cdn.test/cover.avif' })]);
    fixture.componentRef.setInput('slug', 'mon-site');
    fixture.detectChanges();
    const img = fixture.nativeElement.querySelector('img') as HTMLImageElement | null;
    expect(img).toBeTruthy();
    // NgOptimizedImage lève NG02952 et n'applique pas le src si `sizes` contient
    // une valeur en pixels → image cassée. Le sizes doit rester 100% responsive.
    expect(img?.getAttribute('sizes') ?? '').not.toContain('px');
  });

  it('redirige vers /projects si le slug est introuvable', async () => {
    const fixture = setup([project({ slug: 'autre' })]);
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate');
    fixture.componentRef.setInput('slug', 'inexistant');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(navigate).toHaveBeenCalledWith(['/projects']);
  });

  it('expose les liens démo et code source quand ils sont fournis', async () => {
    const fixture = setup([
      project({ liveUrl: 'https://demo.test', repoUrlFront: 'https://github.com/x/front' }),
    ]);
    fixture.componentRef.setInput('slug', 'mon-site');
    fixture.detectChanges();
    await fixture.whenStable();
    const hrefs = Array.from(
      fixture.nativeElement.querySelectorAll('a[target="_blank"]') as NodeListOf<HTMLAnchorElement>,
    ).map((a) => a.getAttribute('href'));
    expect(hrefs).toContain('https://demo.test');
    expect(hrefs).toContain('https://github.com/x/front');
  });

  it('suit le clic sur un lien projet via AnalyticsGateway', async () => {
    const track = vi.fn();
    const gateway = {
      getAllProjects: () => of([project({ liveUrl: 'https://demo.test' })] as readonly Project[]),
    } as unknown as ProjectsGateway;
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: ProjectsGateway, useValue: gateway },
        { provide: AnalyticsGateway, useValue: { trackProjectClick: track } },
      ],
    });
    const fixture = TestBed.createComponent(ProjectDetail);
    fixture.componentRef.setInput('slug', 'mon-site');
    fixture.detectChanges();
    await fixture.whenStable();
    const liveLink = fixture.nativeElement.querySelector(
      'a[href="https://demo.test"]',
    ) as HTMLAnchorElement;
    liveLink.click();
    expect(track).toHaveBeenCalledWith('id-1', 'Mon site');
  });

  it('propose la navigation vers le projet suivant dans la liste ordonnée', async () => {
    const fixture = setup([
      project({ slug: 'mon-site', title: 'Mon site' }),
      project({ id: 'id-2', slug: 'autre-projet', title: 'Autre projet' }),
    ]);
    fixture.componentRef.setInput('slug', 'mon-site');
    fixture.detectChanges();
    await fixture.whenStable();
    const navLinks = Array.from(
      fixture.nativeElement.querySelectorAll('a[href="/projects/autre-projet"]'),
    );
    expect(navLinks.length).toBeGreaterThan(0);
  });

  it("affiche un état d'erreur avec relance quand la liste ne charge pas, sans rediriger", async () => {
    let calls = 0;
    const gateway = {
      getAllProjects: () => {
        calls += 1;
        return calls === 1 ? throwError(() => new Error('down')) : of([project()] as readonly Project[]);
      },
    } as unknown as ProjectsGateway;
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: ProjectsGateway, useValue: gateway },
        { provide: AnalyticsGateway, useValue: { trackProjectClick: vi.fn() } },
      ],
    });
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const fixture = TestBed.createComponent(ProjectDetail);
    fixture.componentRef.setInput('slug', 'mon-site');
    await fixture.whenStable();
    fixture.detectChanges();

    const error = fixture.nativeElement.querySelector('[data-testid="project-error"]') as HTMLElement;
    expect(error).not.toBeNull();
    expect(navigate).not.toHaveBeenCalled();

    (error.querySelector('button') as HTMLButtonElement).click();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[data-testid="project-error"]')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Mon site');
  });
});
