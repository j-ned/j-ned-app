import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';
import { describe, it, expect, vi, afterEach } from 'vitest';

import { ProjectDetail } from './project-detail';
import { ProjectsGateway, type Project } from '@features/projects/domain';

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

function setup(projects: Project[]) {
  const gateway = {
    getAllProjects: () => of(projects as readonly Project[]),
  } as unknown as ProjectsGateway;
  TestBed.configureTestingModule({
    providers: [provideRouter([]), { provide: ProjectsGateway, useValue: gateway }],
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

  it("rend l'image d'en-tête avec un sizes responsive (sans pixel) — NG02952", () => {
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
});
