import { Component } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { AnalyticsGateway } from '@features/analytics/domain/gateways/analytics.gateway';
import type { Project } from '@features/projects/domain/models/project.model';
import { makeProject } from '@features/projects/testing/project-builders';
import { HomeProjects } from './home-projects';

@Component({ template: '' })
class BlankPage {}

const LONG_DESCRIPTION = 'Une phrase de description assez longue pour déborder. '.repeat(6).trim();

const dashflow = (overrides: Partial<Project> = {}): Project =>
  makeProject({
    id: 'dashflow-id',
    slug: 'dashflow',
    title: 'DashFlow',
    category: 'Application web',
    image: 'https://api.test/projects/dashflow.avif',
    description: LONG_DESCRIPTION,
    architectureDecisions: [
      {
        decision: 'Chiffrement côté client',
        rationale: 'Une justification longue qui ne doit jamais apparaître sur la carte.',
      },
    ],
    tags: ['Angular', 'TypeScript', 'TailwindCSS', 'Docker', 'PostgreSQL', 'NestJS'],
    liveUrl: 'https://dashflow.test/',
    ...overrides,
  });

const candidash = (overrides: Partial<Project> = {}): Project =>
  makeProject({
    id: 'candidash-id',
    slug: 'candidash',
    title: 'CandiDash',
    category: 'Application web',
    image: 'https://api.test/projects/candidash.avif',
    pitch: 'Un tracker de candidatures dédié.',
    ...overrides,
  });

const normalized = (element: Element | null | undefined): string =>
  (element?.textContent ?? '').replace(/\s+/g, ' ').trim();

describe('HomeProjects', () => {
  afterEach(() => TestBed.resetTestingModule());

  const mount = async (
    projects: readonly Project[] = [dashflow(), candidash()],
  ): Promise<ComponentFixture<HomeProjects>> => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: 'projects', component: BlankPage },
          { path: 'projects/:slug', component: BlankPage },
        ]),
        { provide: AnalyticsGateway, useValue: { trackProjectClick: vi.fn() } },
      ],
    });
    const fixture = TestBed.createComponent(HomeProjects);
    fixture.componentRef.setInput('projects', projects);
    fixture.detectChanges();
    await fixture.whenStable();
    return fixture;
  };

  const render = async (projects?: readonly Project[]): Promise<HTMLElement> =>
    (await mount(projects)).nativeElement as HTMLElement;

  const cards = (root: HTMLElement): readonly HTMLElement[] =>
    Array.from(root.querySelectorAll<HTMLElement>('[data-testid="featured-project-card"]'));

  it('Given two featured projects When the section renders Then each one is a card in a two-column list, in order', async () => {
    const root = await render();
    const list = root.querySelector('section ul');

    expect([list?.getAttribute('role'), list?.classList.contains('md:grid-cols-2')]).toEqual([
      'list',
      true,
    ]);
    expect(cards(root).map((card) => card.closest('li')?.parentElement)).toEqual([list, list]);
    expect(
      cards(root).map((card) =>
        normalized(card.querySelector('[data-testid="featured-project-card-title"]')),
      ),
    ).toEqual(['DashFlow', 'CandiDash']);
  });

  it('Given featured projects When the section renders Then its headings go from the section h2 to one h3 per project, without skipping a level', async () => {
    const root = await render();

    expect(
      Array.from(root.querySelectorAll('h1, h2, h3, h4, h5, h6')).map((heading) => [
        heading.tagName,
        normalized(heading),
      ]),
    ).toEqual([
      ['H2', 'Des projets en production, et pourquoi ils sont construits ainsi'],
      ['H3', 'DashFlow'],
      ['H3', 'CandiDash'],
    ]);
  });

  it('Given featured projects with covers When the section renders Then no image is loaded with priority', async () => {
    const root = await render();

    expect(
      Array.from(root.querySelectorAll('img')).map((image) => [
        image.getAttribute('fetchpriority'),
        image.getAttribute('loading'),
      ]),
    ).toEqual([
      ['auto', 'lazy'],
      ['auto', 'lazy'],
    ]);
  });

  it('Given a long description and a justified decision When the section renders Then nothing is clamped', async () => {
    const root = await render();

    expect(root.querySelectorAll('[class*="line-clamp"]')).toHaveLength(0);
  });

  it('Given a project without pitch When its card renders Then it shows the first sentence and the key decision title, not the whole description nor the rationale', async () => {
    const card = cards(await render([dashflow()]))[0];

    expect(normalized(card?.querySelector('[data-testid="featured-project-card-pitch"]'))).toBe(
      'Une phrase de description assez longue pour déborder.',
    );
    expect(
      Array.from(card?.querySelectorAll('[data-testid="project-fact-value"]') ?? []).map(
        normalized,
      ),
    ).toEqual(['Chiffrement côté client', 'Angular · TypeScript · TailwindCSS · Docker']);
  });

  it('Given a card When the visitor follows « Voir la fiche » Then the project page opens', async () => {
    const fixture = await mount();
    const router = TestBed.inject(Router);

    cards(fixture.nativeElement as HTMLElement)[1]
      ?.querySelector<HTMLElement>('[data-testid="featured-project-card-link"]')
      ?.click();
    await fixture.whenStable();

    expect(router.url).toBe('/projects/candidash');
  });

  it('Given a card with a live link When the visitor opens the application Then the click is tracked for that project', async () => {
    const fixture = await mount();
    const analytics = TestBed.inject(AnalyticsGateway);

    (fixture.nativeElement as HTMLElement)
      .querySelector<HTMLElement>('[data-testid="featured-project-card-live-link"]')
      ?.click();

    expect(analytics.trackProjectClick).toHaveBeenCalledTimes(1);
    expect(analytics.trackProjectClick).toHaveBeenCalledWith('dashflow-id', 'DashFlow');
  });
});
