import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, it, expect, afterEach, vi } from 'vitest';

import { ProjectCard } from './project-card';
import { AnalyticsGateway } from '@features/analytics/domain';
import type { Project } from '../../domain';

function project(overrides: Partial<Project> = {}): Project {
  return {
    id: 'id-1', title: 'Mon site', slug: 'mon-site', category: 'Web',
    tags: [], description: 'desc', image: '', featured: false, order: 0,
    ...overrides,
  };
}

describe('ProjectCard', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('rend un lien vers /projects/:slug couvrant la carte', () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AnalyticsGateway, useValue: { trackProjectClick: vi.fn() } },
      ],
    });
    const fixture = TestBed.createComponent(ProjectCard);
    fixture.componentRef.setInput('project', project());
    fixture.detectChanges();

    const link = fixture.nativeElement.querySelector(
      '[data-testid="project-card-link"]',
    ) as HTMLAnchorElement | null;
    expect(link).toBeTruthy();
    expect(link?.getAttribute('href')).toBe('/projects/mon-site');
  });
});
