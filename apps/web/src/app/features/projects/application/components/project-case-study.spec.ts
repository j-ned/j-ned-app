import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import type { CaseStudyView } from '../projects-view';
import { ProjectCaseStudy } from './project-case-study';

const caseStudyView = (overrides: Partial<CaseStudyView> = {}): CaseStudyView => ({
  id: 'dashflow',
  slug: 'dashflow',
  title: 'DashFlow',
  overline: '01 · Application web',
  pitch: 'Le budget familial et le suivi médical de toute la famille dans une seule app.',
  facts: [
    { label: 'Stack', value: 'Angular · NestJS · PostgreSQL · Docker' },
    { label: 'Point fort', value: 'Chiffrement de bout en bout côté client' },
    { label: 'Périmètre', value: 'Conception, développement, déploiement' },
  ],
  liveUrl: 'https://dashflow.nedellec-julien.fr',
  image: 'https://api.test/projects/dashflow.avif',
  ...overrides,
});

type CaseStudyInputs = {
  readonly caseStudy?: CaseStudyView;
  readonly priority?: boolean;
  readonly reversed?: boolean;
};

const normalized = (element: Element | null | undefined): string =>
  (element?.textContent ?? '').replace(/\s+/g, ' ').trim();

describe('ProjectCaseStudy', () => {
  afterEach(() => TestBed.resetTestingModule());

  const mount = async ({
    caseStudy = caseStudyView(),
    priority,
    reversed,
  }: CaseStudyInputs = {}): Promise<ComponentFixture<ProjectCaseStudy>> => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(ProjectCaseStudy);
    fixture.componentRef.setInput('caseStudy', caseStudy);
    if (priority !== undefined) fixture.componentRef.setInput('priority', priority);
    if (reversed !== undefined) fixture.componentRef.setInput('reversed', reversed);
    fixture.detectChanges();
    await fixture.whenStable();
    return fixture;
  };

  const render = async (inputs: CaseStudyInputs = {}): Promise<HTMLElement> =>
    (await mount(inputs)).nativeElement as HTMLElement;

  const byTestId = (root: HTMLElement, id: string): HTMLElement | null =>
    root.querySelector<HTMLElement>(`[data-testid="${id}"]`);

  const allByTestId = (root: HTMLElement, id: string): HTMLElement[] =>
    Array.from(root.querySelectorAll<HTMLElement>(`[data-testid="${id}"]`));

  it('Given a case study When it renders Then it is an article showing the overline, the name as a third-level heading and the pitch', async () => {
    const root = await render();
    const title = byTestId(root, 'project-case-study-title');

    expect(byTestId(root, 'project-case-study')?.tagName).toBe('ARTICLE');
    expect(normalized(byTestId(root, 'project-case-study-overline'))).toBe('01 · Application web');
    expect(title?.tagName).toBe('H3');
    expect(normalized(title)).toBe('DashFlow');
    expect(normalized(byTestId(root, 'project-case-study-pitch'))).toBe(
      'Le budget familial et le suivi médical de toute la famille dans une seule app.',
    );
  });

  it('Given three facts When the case study renders Then they form one description list, label then value, in order', async () => {
    const root = await render();
    const facts = byTestId(root, 'fact-list');
    const labels = allByTestId(root, 'fact-label');
    const values = allByTestId(root, 'fact-value');

    expect(facts?.tagName).toBe('DL');
    expect(labels.map((label) => [label.tagName, normalized(label)])).toEqual([
      ['DT', 'Stack'],
      ['DT', 'Point fort'],
      ['DT', 'Périmètre'],
    ]);
    expect(values.map((value) => [value.tagName, normalized(value)])).toEqual([
      ['DD', 'Angular · NestJS · PostgreSQL · Docker'],
      ['DD', 'Chiffrement de bout en bout côté client'],
      ['DD', 'Conception, développement, déploiement'],
    ]);
    expect([...labels, ...values].every((element) => element.closest('dl') === facts)).toBe(true);
  });

  it('Given a single fact When the case study renders Then only that line is listed', async () => {
    const root = await render({
      caseStudy: caseStudyView({ facts: [{ label: 'Périmètre', value: 'Conception' }] }),
    });

    expect(allByTestId(root, 'fact-label').map(normalized)).toEqual(['Périmètre']);
    expect(allByTestId(root, 'fact-value').map(normalized)).toEqual(['Conception']);
  });

  it('Given no fact When the case study renders Then no description list is rendered', async () => {
    const root = await render({ caseStudy: caseStudyView({ facts: [] }) });

    expect(byTestId(root, 'fact-list')).toBeNull();
    expect(root.querySelectorAll('dl')).toHaveLength(0);
  });

  it('Given a case study When it renders Then « Voir la fiche » links to the project page and names the project for assistive technologies', async () => {
    const root = await render();
    const link = byTestId(root, 'project-case-study-link');
    const context = byTestId(root, 'project-case-study-link-context');

    expect(link?.tagName).toBe('A');
    expect(link?.getAttribute('href')).toBe('/projects/dashflow');
    expect(normalized(link)).toBe('Voir la fiche : DashFlow');
    expect(context?.textContent).toBe('\u00a0: DashFlow');
    expect(context?.classList).toContain('sr-only');
    expect(context?.closest('a')).toBe(link);
  });

  it('Given a live URL When the case study renders Then « Ouvrir l’application » opens it in a new tab, named for assistive technologies', async () => {
    const link = byTestId(await render(), 'project-case-study-live-link');

    expect({
      tag: link?.tagName,
      href: link?.getAttribute('href'),
      target: link?.getAttribute('target'),
      rel: link?.getAttribute('rel'),
      name: normalized(link),
    }).toEqual({
      tag: 'A',
      href: 'https://dashflow.nedellec-julien.fr',
      target: '_blank',
      rel: 'noopener noreferrer',
      name: "Ouvrir l'application : DashFlow, nouvel onglet",
    });
  });

  it('Given no live URL When the case study renders Then only the project page link is offered', async () => {
    const root = await render({ caseStudy: caseStudyView({ liveUrl: null }) });

    expect(byTestId(root, 'project-case-study-live-link')).toBeNull();
    expect(byTestId(root, 'project-case-study-link')).not.toBeNull();
  });

  it('Given a live URL When the visitor opens the application Then the case study reports the click once', async () => {
    const fixture = await mount();
    const clicks = vi.fn();
    fixture.componentInstance.liveLinkClicked.subscribe(clicks);

    byTestId(fixture.nativeElement as HTMLElement, 'project-case-study-live-link')?.click();

    expect(clicks).toHaveBeenCalledTimes(1);
  });

  it('Given a case study When it renders Then the cover shows the production stamp and describes the project', async () => {
    const root = await render();
    const cover = byTestId(root, 'project-case-study-cover');

    expect(cover?.tagName).toBe('APP-PROJECT-COVER');
    expect(normalized(byTestId(root, 'project-cover-kind'))).toBe('En production');
    expect(byTestId(root, 'project-cover-image')?.getAttribute('alt')).toBe(
      'Aperçu du projet DashFlow',
    );
  });

  it.each([
    { priority: true, fetchpriority: 'high' },
    { priority: false, fetchpriority: 'auto' },
    { priority: undefined, fetchpriority: 'auto' },
  ])(
    'Given priority $priority When the case study renders Then its cover loads with priority $fetchpriority',
    async ({ priority, fetchpriority }) => {
      const image = byTestId(await render({ priority }), 'project-cover-image');

      expect(image?.getAttribute('fetchpriority')).toBe(fetchpriority);
    },
  );

  it.each([
    { reversed: true, last: true },
    { reversed: false, last: false },
    { reversed: undefined, last: false },
  ])(
    'Given reversed $reversed When the case study renders Then the cover is moved last on wide screens: $last, the reading order unchanged',
    async ({ reversed, last }) => {
      const root = await render({ reversed });
      const cover = byTestId(root, 'project-case-study-cover');
      const title = byTestId(root, 'project-case-study-title');

      expect(cover?.classList.contains('lg:order-last')).toBe(last);
      expect(
        cover && title
          ? cover.compareDocumentPosition(title) & Node.DOCUMENT_POSITION_FOLLOWING
          : 0,
      ).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    },
  );
});
