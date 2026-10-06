import { TestBed, type ComponentFixture } from '@angular/core/testing';
import type { ProjectKindFilter } from '../../domain/models/project.model';
import type { KindFilterOption } from '../projects-view';
import { ProjectKindFilters } from './project-kind-filters';

const MOCKUP_OPTIONS: readonly KindFilterOption[] = [
  { value: 'all', label: 'Tous', count: 6 },
  { value: 'production', label: 'En production', count: 2 },
  { value: 'demo', label: 'Démos', count: 2 },
  { value: 'script', label: 'Scripts', count: 2 },
];

const normalized = (element: Element | null | undefined): string =>
  (element?.textContent ?? '').replace(/\s+/g, ' ').trim();

describe('ProjectKindFilters', () => {
  afterEach(() => TestBed.resetTestingModule());

  const mount = async (
    active: ProjectKindFilter = 'all',
    options: readonly KindFilterOption[] = MOCKUP_OPTIONS,
  ): Promise<ComponentFixture<ProjectKindFilters>> => {
    const fixture = TestBed.createComponent(ProjectKindFilters);
    fixture.componentRef.setInput('options', options);
    fixture.componentRef.setInput('active', active);
    fixture.detectChanges();
    await fixture.whenStable();
    return fixture;
  };

  const rootOf = (fixture: ComponentFixture<ProjectKindFilters>): HTMLElement =>
    fixture.nativeElement as HTMLElement;

  const buttons = (root: HTMLElement): HTMLButtonElement[] =>
    Array.from(root.querySelectorAll<HTMLButtonElement>('[data-testid="project-kind-filter"]'));

  const buttonLabelled = (root: HTMLElement, label: string): HTMLButtonElement | undefined =>
    buttons(root).find(
      (button) =>
        normalized(button.querySelector('[data-testid="project-kind-filter-label"]')) === label,
    );

  const pressedStates = (root: HTMLElement): (string | null)[] =>
    buttons(root).map((button) => button.getAttribute('aria-pressed'));

  const click = async (
    fixture: ComponentFixture<ProjectKindFilters>,
    label: string,
  ): Promise<HTMLButtonElement | undefined> => {
    const button = buttonLabelled(rootOf(fixture), label);
    button?.focus();
    button?.click();
    fixture.detectChanges();
    await fixture.whenStable();
    return button;
  };

  it('Given filter options When the filters render Then they form a group named « Filtrer par nature », one toggle button per option', async () => {
    const root = rootOf(await mount());
    const group = root.querySelector('[data-testid="project-kind-filters"]');

    expect(group?.getAttribute('role')).toBe('group');
    expect(group?.getAttribute('aria-label')).toBe('Filtrer par nature');
    expect(buttons(root).map((button) => [button.tagName, button.getAttribute('type')])).toEqual([
      ['BUTTON', 'button'],
      ['BUTTON', 'button'],
      ['BUTTON', 'button'],
      ['BUTTON', 'button'],
    ]);
    expect(buttons(root).every((button) => group?.contains(button))).toBe(true);
  });

  it('Given the mockup options When the filters render Then each button shows its label and its count, in order', async () => {
    const root = rootOf(await mount());

    expect(
      buttons(root).map((button) => [
        normalized(button.querySelector('[data-testid="project-kind-filter-label"]')),
        normalized(button.querySelector('[data-testid="project-kind-filter-count"]')),
      ]),
    ).toEqual([
      ['Tous', '6'],
      ['En production', '2'],
      ['Démos', '2'],
      ['Scripts', '2'],
    ]);
  });

  it('Given only « Tous » and the demos are offered When the filters render Then only those two buttons exist', async () => {
    const root = rootOf(
      await mount('all', [
        { value: 'all', label: 'Tous', count: 3 },
        { value: 'demo', label: 'Démos', count: 3 },
      ]),
    );

    expect(buttons(root).map(normalized)).toEqual(['Tous 3', 'Démos 3']);
  });

  it.each([
    { active: 'all', expected: ['true', 'false', 'false', 'false'] },
    { active: 'production', expected: ['false', 'true', 'false', 'false'] },
    { active: 'demo', expected: ['false', 'false', 'true', 'false'] },
    { active: 'script', expected: ['false', 'false', 'false', 'true'] },
  ] satisfies readonly { active: ProjectKindFilter; expected: readonly string[] }[])(
    'Given the active filter $active When the filters render Then only its button is pressed',
    async ({ active, expected }) => {
      expect(pressedStates(rootOf(await mount(active)))).toEqual(expected);
    },
  );

  it('Given « Tous » is active When the visitor presses « Démos » Then the active filter becomes demo and is emitted once', async () => {
    const fixture = await mount('all');
    const emitted: ProjectKindFilter[] = [];
    fixture.componentInstance.active.subscribe((value) => emitted.push(value));

    await click(fixture, 'Démos');

    expect(fixture.componentInstance.active()).toBe('demo');
    expect(emitted).toEqual(['demo']);
    expect(pressedStates(rootOf(fixture))).toEqual(['false', 'false', 'true', 'false']);
  });

  it('Given a filter was chosen When the visitor presses « Tous » Then every nature is back', async () => {
    const fixture = await mount('script');

    await click(fixture, 'Tous');

    expect(fixture.componentInstance.active()).toBe('all');
    expect(pressedStates(rootOf(fixture))).toEqual(['true', 'false', 'false', 'false']);
  });

  it('Given the visitor presses a filter When the view updates Then the focus stays on the pressed button', async () => {
    const fixture = await mount('all');

    const pressed = await click(fixture, 'Scripts');

    expect(pressed).toBeDefined();
    expect(document.activeElement).toBe(pressed);
    expect(pressed?.getAttribute('aria-pressed')).toBe('true');
  });

  it('Given the filters When they render Then every button is at least 44 px high', async () => {
    const root = rootOf(await mount());

    expect(buttons(root).map((button) => button.classList.contains('min-h-11'))).toEqual([
      true,
      true,
      true,
      true,
    ]);
  });
});
