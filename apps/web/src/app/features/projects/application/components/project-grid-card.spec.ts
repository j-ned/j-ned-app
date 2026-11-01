import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import type { ProjectCardView } from '../projects-view';
import { ProjectGridCard } from './project-grid-card';

const cardView = (overrides: Partial<ProjectCardView> = {}): ProjectCardView => ({
  id: 'coaching',
  slug: 'coaching-life',
  title: 'Coaching Life',
  kind: 'demo',
  stack: 'Angular · PostgreSQL',
  pitch: 'Site vitrine d’une coach fictive : trois activités, prise de rendez-vous.',
  image: 'https://api.test/projects/coaching-life.avif',
  ...overrides,
});

const normalized = (element: Element | null | undefined): string =>
  (element?.textContent ?? '').replace(/\s+/g, ' ').trim();

describe('ProjectGridCard', () => {
  afterEach(() => TestBed.resetTestingModule());

  const mount = async (
    card: ProjectCardView = cardView(),
  ): Promise<ComponentFixture<ProjectGridCard>> => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(ProjectGridCard);
    fixture.componentRef.setInput('card', card);
    fixture.detectChanges();
    await fixture.whenStable();
    return fixture;
  };

  const render = async (card?: ProjectCardView): Promise<HTMLElement> =>
    (await mount(card)).nativeElement as HTMLElement;

  const byTestId = (root: HTMLElement, id: string): HTMLElement | null =>
    root.querySelector<HTMLElement>(`[data-testid="${id}"]`);

  it('Given a card When it renders Then it is an article showing the name as a third-level heading, the short stack and the pitch', async () => {
    const root = await render();
    const title = byTestId(root, 'project-grid-card-title');

    expect(byTestId(root, 'project-grid-card')?.tagName).toBe('ARTICLE');
    expect(title?.tagName).toBe('H3');
    expect(normalized(title)).toBe('Coaching Life');
    expect(normalized(byTestId(root, 'project-grid-card-stack'))).toBe('Angular · PostgreSQL');
    expect(normalized(byTestId(root, 'project-grid-card-pitch'))).toBe(
      'Site vitrine d’une coach fictive : trois activités, prise de rendez-vous.',
    );
  });

  it('Given a card without stack When it renders Then no stack element is rendered', async () => {
    const root = await render(cardView({ stack: '' }));

    expect(byTestId(root, 'project-grid-card-stack')).toBeNull();
    expect(normalized(byTestId(root, 'project-grid-card-title'))).toBe('Coaching Life');
  });

  it('Given a card When it renders Then « Voir la fiche » links to the project page and names the project for assistive technologies', async () => {
    const root = await render();
    const link = byTestId(root, 'project-grid-card-link');
    const context = byTestId(root, 'project-grid-card-link-context');

    expect(link?.tagName).toBe('A');
    expect(link?.getAttribute('href')).toBe('/projects/coaching-life');
    expect(normalized(link)).toBe('Voir la fiche : Coaching Life');
    expect(context?.textContent).toBe('\u00a0: Coaching Life');
    expect(context?.classList).toContain('sr-only');
    expect(context?.closest('a')).toBe(link);
  });

  it('Given a card When it renders Then the project page link is its only interactive element, stretched over the whole card with a 44 px target', async () => {
    const root = await render();
    const card = byTestId(root, 'project-grid-card');
    const link = byTestId(root, 'project-grid-card-link');

    expect(Array.from(root.querySelectorAll('a, button'))).toEqual([link]);
    expect(card?.classList).toContain('relative');
    expect(
      ['after:absolute', 'after:inset-0', 'min-h-11'].filter((c) => !link?.classList.contains(c)),
    ).toEqual([]);
  });

  it.each([
    { kind: 'demo' as const, label: 'Démo' },
    { kind: 'script' as const, label: 'Script' },
  ])(
    'Given a $kind card When it renders Then its cover comes before the name, stamped $label and describing the project',
    async ({ kind, label }) => {
      const root = await render(cardView({ kind }));
      const cover = byTestId(root, 'project-grid-card-cover');
      const title = byTestId(root, 'project-grid-card-title');

      expect(cover?.tagName).toBe('APP-PROJECT-COVER');
      expect(normalized(byTestId(root, 'project-cover-kind'))).toBe(label);
      expect(byTestId(root, 'project-cover-image')?.getAttribute('alt')).toBe(
        'Aperçu du projet Coaching Life',
      );
      expect(
        cover && title
          ? cover.compareDocumentPosition(title) & Node.DOCUMENT_POSITION_FOLLOWING
          : 0,
      ).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    },
  );

  it('Given a card without nature When it renders Then its cover has no stamp', async () => {
    const root = await render(cardView({ kind: null }));

    expect(byTestId(root, 'project-grid-card-cover')).not.toBeNull();
    expect(byTestId(root, 'project-cover-kind')).toBeNull();
  });

  it('Given a card When it renders Then its cover image is never loaded with priority', async () => {
    const image = byTestId(await render(), 'project-cover-image');

    expect(image?.getAttribute('src')).toBe('https://api.test/projects/coaching-life.avif');
    expect([image?.getAttribute('fetchpriority'), image?.getAttribute('loading')]).toEqual([
      'auto',
      'lazy',
    ]);
  });
});
