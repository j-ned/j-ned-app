import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import type { FeaturedProjectView } from '../featured-project-view';
import { FeaturedProjectCard } from './featured-project-card';

const NBSP = '\u00a0';

const cardView = (overrides: Partial<FeaturedProjectView> = {}): FeaturedProjectView => ({
  id: 'dashflow-id',
  slug: 'dashflow',
  title: 'DashFlow',
  category: 'Application web',
  kind: 'production',
  image: 'https://api.test/projects/dashflow.avif',
  pitch: 'Le budget familial et le suivi médical dans une seule app.',
  facts: [
    { label: 'Décision clé', value: 'Chiffrement côté client' },
    { label: 'Point fort', value: 'Chiffrement de bout en bout côté client' },
    { label: 'Périmètre', value: 'Conception, développement, déploiement' },
    { label: 'Stack', value: 'Angular · TypeScript · TailwindCSS · Docker' },
  ],
  liveLink: { url: 'https://dashflow.test/', label: "Ouvrir l'application" },
  ...overrides,
});

const normalized = (element: Element | null | undefined): string =>
  (element?.textContent ?? '').replace(/\s+/g, ' ').trim();

const byTestId = (root: HTMLElement, id: string): HTMLElement | null =>
  root.querySelector<HTMLElement>(`[data-testid="${id}"]`);

const allByTestId = (root: HTMLElement, id: string): readonly HTMLElement[] =>
  Array.from(root.querySelectorAll<HTMLElement>(`[data-testid="${id}"]`));

const follows = (first: Element | null, second: Element | null): boolean =>
  Boolean(
    first && second && first.compareDocumentPosition(second) & Node.DOCUMENT_POSITION_FOLLOWING,
  );

describe('FeaturedProjectCard', () => {
  afterEach(() => TestBed.resetTestingModule());

  const mount = async (
    card: FeaturedProjectView = cardView(),
  ): Promise<ComponentFixture<FeaturedProjectCard>> => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(FeaturedProjectCard);
    fixture.componentRef.setInput('card', card);
    fixture.detectChanges();
    await fixture.whenStable();
    return fixture;
  };

  const render = async (card?: FeaturedProjectView): Promise<HTMLElement> =>
    (await mount(card)).nativeElement as HTMLElement;

  describe('content', () => {
    it('Given a card When it renders Then it is an article with the category, the name as a third-level heading and the pitch, in that order', async () => {
      const root = await render();
      const category = byTestId(root, 'featured-project-card-category');
      const title = byTestId(root, 'featured-project-card-title');
      const pitch = byTestId(root, 'featured-project-card-pitch');

      expect(byTestId(root, 'featured-project-card')?.tagName).toBe('ARTICLE');
      expect([normalized(category), title?.tagName, normalized(title), normalized(pitch)]).toEqual([
        'Application web',
        'H3',
        'DashFlow',
        'Le budget familial et le suivi médical dans une seule app.',
      ]);
      expect([follows(category, title), follows(title, pitch)]).toEqual([true, true]);
    });

    it('Given a card with facts When it renders Then they form a definition list, label then value, in the order of the view', async () => {
      const root = await render();
      const facts = byTestId(root, 'project-fact-list');

      expect(facts?.tagName).toBe('DL');
      expect(
        allByTestId(root, 'project-fact-label').map((label) => [label.tagName, normalized(label)]),
      ).toEqual([
        ['DT', 'Décision clé'],
        ['DT', 'Point fort'],
        ['DT', 'Périmètre'],
        ['DT', 'Stack'],
      ]);
      expect(
        allByTestId(root, 'project-fact-value').map((value) => [value.tagName, normalized(value)]),
      ).toEqual([
        ['DD', 'Chiffrement côté client'],
        ['DD', 'Chiffrement de bout en bout côté client'],
        ['DD', 'Conception, développement, déploiement'],
        ['DD', 'Angular · TypeScript · TailwindCSS · Docker'],
      ]);
    });

    it('Given a card without facts When it renders Then no definition list is rendered', async () => {
      const root = await render(cardView({ facts: [] }));

      expect(byTestId(root, 'project-fact-list')).toBeNull();
      expect(normalized(byTestId(root, 'featured-project-card-title'))).toBe('DashFlow');
    });

    it('Given a card When it renders Then the facts are its only list', async () => {
      const article = byTestId(await render(), 'featured-project-card');

      expect(
        Array.from(article?.querySelectorAll('ul, ol, dl') ?? []).map((list) => list.tagName),
      ).toEqual(['DL']);
    });

    it('Given a card with long texts When it renders Then nothing is clamped', async () => {
      const root = await render(cardView({ pitch: 'Une accroche longue. '.repeat(8).trim() }));

      expect(root.querySelectorAll('[class*="line-clamp"]')).toHaveLength(0);
    });
  });

  describe('cover', () => {
    it('Given a card When it renders Then its cover comes first, stamped with the nature and describing the project', async () => {
      const root = await render();
      const cover = byTestId(root, 'featured-project-card-cover');

      expect(cover?.tagName).toBe('APP-PROJECT-COVER');
      expect(follows(cover, byTestId(root, 'featured-project-card-category'))).toBe(true);
      expect(normalized(byTestId(root, 'project-cover-kind'))).toBe('En production');
      expect(byTestId(root, 'project-cover-image')?.getAttribute('alt')).toBe(
        'Aperçu du projet DashFlow',
      );
    });

    it('Given a card without nature When it renders Then its cover has no stamp', async () => {
      const root = await render(cardView({ kind: null }));

      expect(byTestId(root, 'featured-project-card-cover')).not.toBeNull();
      expect(byTestId(root, 'project-cover-kind')).toBeNull();
    });

    it('Given a card When it renders Then its cover image is never loaded with priority', async () => {
      const image = byTestId(await render(), 'project-cover-image');

      expect([
        image?.getAttribute('src'),
        image?.getAttribute('fetchpriority'),
        image?.getAttribute('loading'),
      ]).toEqual(['https://api.test/projects/dashflow.avif', 'auto', 'lazy']);
    });
  });

  describe('links', () => {
    it('Given a card When it renders Then « Voir la fiche » links to the project page and names the project for assistive technologies', async () => {
      const root = await render();
      const link = byTestId(root, 'featured-project-card-link');
      const context = byTestId(root, 'featured-project-card-link-context');

      expect(link?.tagName).toBe('A');
      expect(link?.getAttribute('href')).toBe('/projects/dashflow');
      expect(normalized(link)).toBe('Voir la fiche : DashFlow');
      expect(context?.textContent).toBe(`${NBSP}: DashFlow`);
      expect(context?.classList).toContain('sr-only');
      expect(context?.closest('a')).toBe(link);
    });

    it('Given a card When it renders Then « Voir la fiche » is stretched over the whole card with a 44 px target', async () => {
      const root = await render();
      const link = byTestId(root, 'featured-project-card-link');

      expect(byTestId(root, 'featured-project-card')?.classList).toContain('relative');
      expect(
        ['after:absolute', 'after:inset-0', 'min-h-11'].filter(
          (name) => !link?.classList.contains(name),
        ),
      ).toEqual([]);
    });

    it('Given a live link When the card renders Then it opens the application in a new tab, above the stretched link, naming the project', async () => {
      const root = await render();
      const live = byTestId(root, 'featured-project-card-live-link');

      expect([
        live?.tagName,
        live?.getAttribute('href'),
        live?.getAttribute('target'),
        live?.getAttribute('rel'),
        normalized(live),
      ]).toEqual([
        'A',
        'https://dashflow.test/',
        '_blank',
        'noopener noreferrer',
        "Ouvrir l'application : DashFlow, nouvel onglet",
      ]);
      expect(['relative', 'z-10'].filter((name) => !live?.classList.contains(name))).toEqual([]);
    });

    it('Given a live link When the card renders Then its only links are the project page then the application', async () => {
      const root = await render();

      expect(Array.from(root.querySelectorAll('a, button'))).toEqual([
        byTestId(root, 'featured-project-card-link'),
        byTestId(root, 'featured-project-card-live-link'),
      ]);
    });

    it('Given no live link When the card renders Then « Voir la fiche » is its only link', async () => {
      const root = await render(cardView({ liveLink: null }));

      expect(Array.from(root.querySelectorAll('a, button'))).toEqual([
        byTestId(root, 'featured-project-card-link'),
      ]);
    });

    it('Given a live link When the visitor opens the application Then the card reports the click once', async () => {
      const fixture = await mount();
      const clicks = vi.fn();
      fixture.componentInstance.liveLinkClicked.subscribe(clicks);

      byTestId(fixture.nativeElement as HTMLElement, 'featured-project-card-live-link')?.click();

      expect(clicks).toHaveBeenCalledTimes(1);
    });
  });

  describe('layout', () => {
    it('Given a card When it renders Then it fills the height of its grid cell and pushes its links to the bottom', async () => {
      const root = await render();
      const article = byTestId(root, 'featured-project-card');
      const actions = byTestId(root, 'featured-project-card-actions');

      expect(root.classList).toContain('h-full');
      expect(
        ['flex', 'flex-col', 'h-full'].filter((name) => !article?.classList.contains(name)),
      ).toEqual([]);
      expect(actions?.classList).toContain('mt-auto');
      expect(
        [
          byTestId(root, 'featured-project-card-link'),
          byTestId(root, 'featured-project-card-live-link'),
        ].map((link) => actions?.contains(link)),
      ).toEqual([true, true]);
    });
  });
});
