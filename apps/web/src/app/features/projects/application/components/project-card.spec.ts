import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, it, expect, afterEach, vi } from 'vitest';

import { ProjectCard } from './project-card';
import { AnalyticsGateway } from '@features/analytics/domain/gateways/analytics.gateway';
import type { Project } from '../../domain/models/project.model';

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

  describe('décision clé', () => {
    const DECISION = { decision: 'Chiffrement côté client', rationale: 'Le serveur ne voit rien.' };

    const render = (showKeyDecision: boolean, overrides: Partial<Project>): HTMLElement => {
      TestBed.configureTestingModule({
        providers: [
          provideRouter([]),
          { provide: AnalyticsGateway, useValue: { trackProjectClick: vi.fn() } },
        ],
      });
      const fixture = TestBed.createComponent(ProjectCard);
      fixture.componentRef.setInput('project', project(overrides));
      fixture.componentRef.setInput('showKeyDecision', showKeyDecision);
      fixture.detectChanges();
      return fixture.nativeElement as HTMLElement;
    };

    it('Given showKeyDecision et une décision When la carte est rendue Then la première décision est affichée', () => {
      const host = render(true, {
        architectureDecisions: [DECISION, { decision: 'Autre', rationale: 'x' }],
      });
      const block = host.querySelector('[data-testid="project-card-decision"]');
      expect(block?.textContent).toContain(DECISION.decision);
      expect(block?.textContent).toContain(DECISION.rationale);
      expect(block?.textContent).not.toContain('Autre');
    });

    it.each([
      { show: false, decisions: [DECISION], label: 'option désactivée (page projets)' },
      { show: true, decisions: [], label: 'aucune décision saisie' },
      { show: true, decisions: undefined, label: 'champ absent de la réponse API' },
    ])('Given $label When la carte est rendue Then aucun bloc décision', ({ show, decisions }) => {
      const host = render(show, { architectureDecisions: decisions });
      expect(host.querySelector('[data-testid="project-card-decision"]')).toBeNull();
    });
  });
});
