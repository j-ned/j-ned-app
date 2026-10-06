import { TestBed } from '@angular/core/testing';
import type { LegendRow } from '../projects-view';
import { ProjectKindLegend } from './project-kind-legend';

const MOCKUP_ROWS: readonly LegendRow[] = [
  { kind: 'production', definition: 'Utilisé pour de vrai', count: 2 },
  { kind: 'demo', definition: 'Entreprise fictive', count: 2 },
  { kind: 'script', definition: 'Outil en ligne de commande', count: 2 },
];

const normalized = (element: Element): string =>
  (element.textContent ?? '').replace(/\s+/g, ' ').trim();

describe('ProjectKindLegend', () => {
  afterEach(() => TestBed.resetTestingModule());

  const render = async (rows: readonly LegendRow[]): Promise<HTMLElement> => {
    const fixture = TestBed.createComponent(ProjectKindLegend);
    fixture.componentRef.setInput('rows', rows);
    fixture.detectChanges();
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  };

  const byTestId = (root: HTMLElement, id: string): HTMLElement[] =>
    Array.from(root.querySelectorAll<HTMLElement>(`[data-testid="${id}"]`));

  it('Given legend rows When the legend renders Then it is a cartouche titled « Légende », referenced « Nature du projet », grouped under that name', async () => {
    const root = await render(MOCKUP_ROWS);
    const [title] = byTestId(root, 'cartouche-title');

    expect(byTestId(root, 'cartouche-title').map(normalized)).toEqual(['Légende']);
    expect(byTestId(root, 'cartouche-reference').map(normalized)).toEqual(['Nature du projet']);
    expect(title?.closest('[role="group"]')?.getAttribute('aria-label')).toBe('Légende');
  });

  it('Given the three natures When the legend renders Then each row shows the shared kind stamp, in order', async () => {
    const stamps = byTestId(await render(MOCKUP_ROWS), 'project-kind-legend-kind');

    expect(stamps.map(normalized)).toEqual(['En production', 'Démo', 'Script']);
    expect(stamps.map((stamp) => stamp.tagName)).toEqual([
      'APP-PROJECT-KIND-STAMP',
      'APP-PROJECT-KIND-STAMP',
      'APP-PROJECT-KIND-STAMP',
    ]);
  });

  it('Given the three natures When the legend renders Then each nature has its definition', async () => {
    const definitions = byTestId(await render(MOCKUP_ROWS), 'project-kind-legend-definition');

    expect(definitions.map(normalized)).toEqual([
      'Utilisé pour de vrai',
      'Entreprise fictive',
      'Outil en ligne de commande',
    ]);
  });

  it.each([
    { counts: [2, 2, 2], expected: ['2 projets', '2 projets', '2 projets'] },
    { counts: [1, 3, 0], expected: ['1 projet', '3 projets', '0 projet'] },
    { counts: [12, 0, 1], expected: ['12 projets', '0 projet', '1 projet'] },
  ])(
    'Given counts $counts When the legend renders Then each count is read with its unit',
    async ({ counts, expected }) => {
      const rows = MOCKUP_ROWS.map((row, index) => ({ ...row, count: counts[index] ?? 0 }));

      expect(byTestId(await render(rows), 'project-kind-legend-count').map(normalized)).toEqual(
        expected,
      );
    },
  );

  it('Given a count When the legend renders Then its unit is visually hidden and the number stays visible', async () => {
    const root = await render(MOCKUP_ROWS);
    const [count] = byTestId(root, 'project-kind-legend-count');
    const units = byTestId(root, 'project-kind-legend-unit');

    expect(units.map(normalized)).toEqual(['projets', 'projets', 'projets']);
    expect(units.every((unit) => unit.classList.contains('sr-only'))).toBe(true);
    expect(count?.contains(units[0] ?? null)).toBe(true);
  });

  it('Given the legend When it renders Then stamp, definition and count are the term and details of a single description list', async () => {
    const root = await render(MOCKUP_ROWS);
    const stamps = byTestId(root, 'project-kind-legend-kind');
    const definitions = byTestId(root, 'project-kind-legend-definition');
    const counts = byTestId(root, 'project-kind-legend-count');
    const lists = new Set(
      [...stamps, ...definitions, ...counts].map((element) => element.closest('dl')),
    );

    expect(stamps.every((stamp) => stamp.closest('dt') !== null)).toBe(true);
    expect([...definitions, ...counts].map((element) => element.tagName)).toEqual([
      'DD',
      'DD',
      'DD',
      'DD',
      'DD',
      'DD',
    ]);
    expect(lists.size).toBe(1);
    expect([...lists][0]?.closest('[role="group"]')?.getAttribute('aria-label')).toBe('Légende');
  });

  it('Given the legend When it renders Then it emits no heading', async () => {
    const root = await render(MOCKUP_ROWS);

    expect(root.querySelectorAll('h1, h2, h3, h4, h5, h6')).toHaveLength(0);
  });
});
