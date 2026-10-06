import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, it, expect, afterEach, vi } from 'vitest';

import { ProjectCard } from './project-card';
import { AnalyticsGateway } from '@features/analytics/domain/gateways/analytics.gateway';
import type { Project } from '../../domain/models/project.model';
import { makeProject } from '../../testing/project-builders';

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
    fixture.componentRef.setInput('project', makeProject());
    fixture.detectChanges();

    const link = fixture.nativeElement.querySelector(
      '[data-testid="project-card-link"]',
    ) as HTMLAnchorElement | null;
    expect(link).toBeTruthy();
    expect(link?.getAttribute('href')).toBe('/projects/mon-site');
  });

  describe('priorité de chargement', () => {
    const render = (priority?: boolean): HTMLElement => {
      TestBed.configureTestingModule({
        providers: [
          provideRouter([]),
          { provide: AnalyticsGateway, useValue: { trackProjectClick: vi.fn() } },
        ],
      });
      const fixture = TestBed.createComponent(ProjectCard);
      fixture.componentRef.setInput('project', makeProject({ image: '/projects/a.avif' }));
      if (priority !== undefined) fixture.componentRef.setInput('priority', priority);
      fixture.detectChanges();
      return fixture.nativeElement as HTMLElement;
    };

    it('Given priority When la carte est rendue Then son image est chargée en priorité', () => {
      const img = render(true).querySelector('img');
      expect(img?.getAttribute('fetchpriority')).toBe('high');
      expect(img?.getAttribute('loading')).toBe('eager');
    });

    it('Given aucune priorité When la carte est rendue Then son image est chargée en différé', () => {
      expect(render().querySelector('img')?.getAttribute('loading')).toBe('lazy');
    });

    // Image prioritaire = élément LCP : un hôte en fondu (opacité nulle) repousse son affichage.
    it.each([
      { priority: true, animated: false },
      { priority: false, animated: true },
    ])(
      'Given priority $priority When la carte est rendue Then son animation d’entrée est $animated',
      ({ priority, animated }) => {
        expect(render(priority).classList.contains('animate-fade-up')).toBe(animated);
      },
    );
  });

  describe('navigation des liens du projet', () => {
    const navLabel = (title: string): string | null | undefined => {
      const fixture = TestBed.createComponent(ProjectCard);
      fixture.componentRef.setInput(
        'project',
        makeProject({ title, slug: title.toLowerCase(), liveUrl: 'https://demo.test' }),
      );
      fixture.detectChanges();
      return (fixture.nativeElement as HTMLElement)
        .querySelector('nav')
        ?.getAttribute('aria-label');
    };

    it('Given deux cartes de titres différents When elles sont rendues Then chaque nav porte un nom distinct incluant son titre', () => {
      TestBed.configureTestingModule({
        providers: [
          provideRouter([]),
          { provide: AnalyticsGateway, useValue: { trackProjectClick: vi.fn() } },
        ],
      });

      expect([navLabel('Alpha'), navLabel('Beta')]).toEqual([
        'Liens du projet Alpha',
        'Liens du projet Beta',
      ]);
    });
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
      fixture.componentRef.setInput('project', makeProject(overrides));
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

describe('ProjectCard: nature du projet', () => {
  const NBSP = ' ';
  const text = (el: Element | null | undefined): string =>
    (el?.textContent ?? '').replace(/[ \t\n\r]+/g, ' ').trim();

  const render = (overrides: Partial<Project>): HTMLElement => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AnalyticsGateway, useValue: { trackProjectClick: vi.fn() } },
      ],
    });
    const fixture = TestBed.createComponent(ProjectCard);
    fixture.componentRef.setInput('project', makeProject(overrides));
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  };
  const kindStamp = (host: HTMLElement): HTMLElement | null =>
    host.querySelector<HTMLElement>('[data-testid="project-card-kind"]');

  afterEach(() => TestBed.resetTestingModule());

  it.each([
    { kind: 'production', label: 'En production' },
    { kind: 'demo', label: 'Démo' },
    { kind: 'script', label: 'Script' },
  ] as const)(
    'Given the kind $kind When the card renders Then it is stamped « $label »',
    ({ kind, label }) => {
      expect(text(kindStamp(render({ kind })))).toBe(label);
    },
  );

  it('Given no kind When the card renders Then no stamp is shown', () => {
    expect(kindStamp(render({ kind: null }))).toBeNull();
  });

  it('Given a stamped card When it renders Then the stamp sits on the cover, outside the heading', () => {
    const stamp = kindStamp(render({ kind: 'demo' }));

    expect(stamp?.closest('figure')).not.toBeNull();
    expect(stamp?.closest('h1, h2, h3, h4, h5, h6')).toBeNull();
  });

  it.each([
    { kind: 'production', label: "Ouvrir l'application" },
    { kind: 'demo', label: 'Voir la démo' },
    { kind: 'script', label: 'Voir le site' },
    { kind: null, label: 'Voir le site' },
  ] as const)(
    'Given the kind $kind When the card renders Then its live link reads « $label », with the project and the new tab spelled out',
    ({ kind, label }) => {
      const link = render({
        kind,
        title: 'DashFlow',
        liveUrl: 'https://dashflow.test/',
      }).querySelector('a[href="https://dashflow.test/"]');

      expect({ ariaLabel: link?.getAttribute('aria-label') ?? null, name: text(link) }).toEqual({
        ariaLabel: null,
        name: `${label}${NBSP}: DashFlow, nouvel onglet`,
      });
    },
  );
});
