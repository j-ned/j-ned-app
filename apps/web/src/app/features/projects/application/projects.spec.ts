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
    id: 'id-1', title: 'Mon site', slug: 'mon-site', category: 'Web', tags: [],
    description: 'desc', image: '', featured: false, order: 0, ...overrides,
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

  it('affiche les projets chargés, sans état d\'erreur', async () => {
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
        return calls === 1 ? throwError(() => new Error('down')) : of([project()] as readonly Project[]);
      },
      getCategories: () => of(['Tous'] as readonly string[]),
    });
    await fixture.whenStable();
    fixture.detectChanges();

    const error = fixture.nativeElement.querySelector('[data-testid="projects-error"]') as HTMLElement;
    expect(error).not.toBeNull();
    expect(fixture.nativeElement.textContent).not.toContain('Aucun projet');

    (error.querySelector('button') as HTMLButtonElement).click();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[data-testid="projects-error"]')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Mon site');
  });
});
