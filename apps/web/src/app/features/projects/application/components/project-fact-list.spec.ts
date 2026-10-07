import { TestBed } from '@angular/core/testing';
import type { ProjectFact } from '../project-facts';
import { ProjectFactList } from './project-fact-list';

const FACTS: readonly ProjectFact[] = [
  { label: 'Décision clé', value: 'Chiffrement côté client' },
  { label: 'Stack', value: 'Angular · NestJS · PostgreSQL · Docker' },
];

describe('ProjectFactList', () => {
  afterEach(() => TestBed.resetTestingModule());

  const render = async (facts: readonly ProjectFact[] = FACTS): Promise<HTMLElement> => {
    const fixture = TestBed.createComponent(ProjectFactList);
    fixture.componentRef.setInput('facts', facts);
    fixture.detectChanges();
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  };

  const byTestId = (root: HTMLElement, id: string): HTMLElement | null =>
    root.querySelector<HTMLElement>(`[data-testid="${id}"]`);

  const allByTestId = (root: HTMLElement, id: string): HTMLElement[] =>
    Array.from(root.querySelectorAll<HTMLElement>(`[data-testid="${id}"]`));

  const normalized = (element: Element | null | undefined): string =>
    element?.textContent?.replace(/\s+/g, ' ').trim() ?? '';

  it('Given facts When the list renders Then they form one description list, label then value, in order', async () => {
    const root = await render();
    const list = byTestId(root, 'project-fact-list');
    const labels = allByTestId(root, 'project-fact-label');
    const values = allByTestId(root, 'project-fact-value');

    expect(list?.tagName).toBe('DL');
    expect(labels.map((label) => [label.tagName, normalized(label)])).toEqual([
      ['DT', 'Décision clé'],
      ['DT', 'Stack'],
    ]);
    expect(values.map((value) => [value.tagName, normalized(value)])).toEqual([
      ['DD', 'Chiffrement côté client'],
      ['DD', 'Angular · NestJS · PostgreSQL · Docker'],
    ]);
    expect([...labels, ...values].every((element) => element.closest('dl') === list)).toBe(true);
  });

  it.each([
    [[{ label: 'Périmètre', value: 'Conception' }], ['Périmètre'], ['Conception']],
    [
      FACTS,
      ['Décision clé', 'Stack'],
      ['Chiffrement côté client', 'Angular · NestJS · PostgreSQL · Docker'],
    ],
  ])(
    'Given %j When the list renders Then each fact is one label and one value',
    async (facts, expectedLabels, expectedValues) => {
      const root = await render(facts);

      expect(allByTestId(root, 'project-fact-label').map(normalized)).toEqual(expectedLabels);
      expect(allByTestId(root, 'project-fact-value').map(normalized)).toEqual(expectedValues);
    },
  );

  it('Given facts When the list renders Then every row shares the column width sized for « Décision clé »', async () => {
    const list = byTestId(await render(), 'project-fact-list');

    expect(list?.className).toContain('grid-cols-[6.5rem_minmax(0,1fr)]');
    expect(
      Array.from(list?.children ?? []).every((row) => row.className.includes('grid-cols-subgrid')),
    ).toBe(true);
  });
});
