import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { FilterGroup, type FilterOption } from './filter-group';

type Kind = 'all' | 'production' | 'demo' | 'script';
type Theme = 'all' | 'stack' | 'engineering' | 'journey';

const MOCKUP_OPTIONS: readonly FilterOption<Kind>[] = [
  { value: 'all', label: 'Tous', count: 6 },
  { value: 'production', label: 'En production', count: 2 },
  { value: 'demo', label: 'Démos', count: 2 },
  { value: 'script', label: 'Scripts', count: 2 },
];

const THEME_OPTIONS: readonly FilterOption<Theme>[] = [
  { value: 'all', label: 'Tous', count: 2 },
  { value: 'stack', label: 'Stack', count: 2 },
  { value: 'engineering', label: 'Ingénierie', count: 0, disabled: true },
  { value: 'journey', label: 'Parcours', count: 1 },
];

const normalized = (element: Element | null | undefined): string =>
  (element?.textContent ?? '').replace(/\s+/g, ' ').trim();

describe('FilterGroup', () => {
  afterEach(() => TestBed.resetTestingModule());

  const mount = async <T extends string>(
    active: T,
    options: readonly FilterOption<T>[],
    label = 'Filtrer par nature',
  ): Promise<ComponentFixture<FilterGroup<T>>> => {
    const fixture = TestBed.createComponent<FilterGroup<T>>(FilterGroup);
    fixture.componentRef.setInput('label', label);
    fixture.componentRef.setInput('options', options);
    fixture.componentRef.setInput('active', active);
    fixture.detectChanges();
    await fixture.whenStable();
    return fixture;
  };

  const mountKinds = (
    active: Kind = 'all',
    options: readonly FilterOption<Kind>[] = MOCKUP_OPTIONS,
  ): Promise<ComponentFixture<FilterGroup<Kind>>> => mount(active, options);

  const mountThemes = (active: Theme = 'all'): Promise<ComponentFixture<FilterGroup<Theme>>> =>
    mount(active, THEME_OPTIONS, 'Filtrer par thème');

  const rootOf = <T extends string>(fixture: ComponentFixture<FilterGroup<T>>): HTMLElement =>
    fixture.nativeElement as HTMLElement;

  const buttons = (root: HTMLElement): HTMLButtonElement[] =>
    Array.from(root.querySelectorAll<HTMLButtonElement>('[data-testid="filter-option"]'));

  const buttonLabelled = (root: HTMLElement, label: string): HTMLButtonElement | undefined =>
    buttons(root).find(
      (button) => normalized(button.querySelector('[data-testid="filter-option-label"]')) === label,
    );

  const pressedStates = (root: HTMLElement): (string | null)[] =>
    buttons(root).map((button) => button.getAttribute('aria-pressed'));

  const click = async <T extends string>(
    fixture: ComponentFixture<FilterGroup<T>>,
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
    const root = rootOf(await mountKinds());
    const group = root.querySelector('[data-testid="filter-group"]');

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

  it('Given another label When the filters render Then the group takes that name', async () => {
    const group = rootOf(await mountThemes()).querySelector('[data-testid="filter-group"]');

    expect(group?.getAttribute('aria-label')).toBe('Filtrer par thème');
  });

  it('Given the mockup options When the filters render Then each button shows its label and its count, in order', async () => {
    const root = rootOf(await mountKinds());

    expect(
      buttons(root).map((button) => [
        normalized(button.querySelector('[data-testid="filter-option-label"]')),
        normalized(button.querySelector('[data-testid="filter-option-count"]')),
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
      await mountKinds('all', [
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
  ] satisfies readonly { active: Kind; expected: readonly string[] }[])(
    'Given the active filter $active When the filters render Then only its button is pressed',
    async ({ active, expected }) => {
      expect(pressedStates(rootOf(await mountKinds(active)))).toEqual(expected);
    },
  );

  it('Given « Tous » is active When the visitor presses « Démos » Then the active filter becomes demo and is emitted once', async () => {
    const fixture = await mountKinds('all');
    const emitted: Kind[] = [];
    fixture.componentInstance.active.subscribe((value) => emitted.push(value));

    await click(fixture, 'Démos');

    expect(fixture.componentInstance.active()).toBe('demo');
    expect(emitted).toEqual(['demo']);
    expect(pressedStates(rootOf(fixture))).toEqual(['false', 'false', 'true', 'false']);
  });

  it('Given a filter was chosen When the visitor presses « Tous » Then every nature is back', async () => {
    const fixture = await mountKinds('script');

    await click(fixture, 'Tous');

    expect(fixture.componentInstance.active()).toBe('all');
    expect(pressedStates(rootOf(fixture))).toEqual(['true', 'false', 'false', 'false']);
  });

  it('Given the visitor presses a filter When the view updates Then the focus stays on the pressed button', async () => {
    const fixture = await mountKinds('all');

    const pressed = await click(fixture, 'Scripts');

    expect(pressed).toBeDefined();
    expect(document.activeElement).toBe(pressed);
    expect(pressed?.getAttribute('aria-pressed')).toBe('true');
  });

  it('Given the filters When they render Then every button is at least 44 px high', async () => {
    const root = rootOf(await mountKinds());

    expect(buttons(root).map((button) => button.classList.contains('min-h-11'))).toEqual([
      true,
      true,
      true,
      true,
    ]);
  });

  describe('inactive option', () => {
    it('Given an option at zero marked disabled When the filters render Then only that button is declared inactive, never through the native disabled attribute', async () => {
      const root = rootOf(await mountThemes());

      expect(
        buttons(root).map((button) => [
          normalized(button.querySelector('[data-testid="filter-option-label"]')),
          normalized(button.querySelector('[data-testid="filter-option-count"]')),
          button.getAttribute('aria-disabled'),
          button.hasAttribute('disabled'),
        ]),
      ).toEqual([
        ['Tous', '2', null, false],
        ['Stack', '2', null, false],
        ['Ingénierie', '0', 'true', false],
        ['Parcours', '1', null, false],
      ]);
    });

    it('Given options without the disabled flag When the filters render Then no button carries aria-disabled', async () => {
      const root = rootOf(await mountKinds());

      expect(buttons(root).map((button) => button.getAttribute('aria-disabled'))).toEqual([
        null,
        null,
        null,
        null,
      ]);
    });

    it('Given an inactive option When the visitor presses it Then the active filter stays the same and nothing is emitted', async () => {
      const fixture = await mountThemes('journey');
      const emitted: Theme[] = [];
      fixture.componentInstance.active.subscribe((value) => emitted.push(value));

      await click(fixture, 'Ingénierie');

      expect(fixture.componentInstance.active()).toBe('journey');
      expect(emitted).toEqual([]);
      expect(pressedStates(rootOf(fixture))).toEqual(['false', 'false', 'false', 'true']);
    });

    it('Given an inactive option When it receives the focus Then it holds it, unpressed: it stays in the tab order', async () => {
      const fixture = await mountThemes('all');

      const inactive = await click(fixture, 'Ingénierie');

      expect(inactive).toBeDefined();
      expect(inactive?.tabIndex).toBe(0);
      expect(document.activeElement).toBe(inactive);
      expect(inactive?.getAttribute('aria-pressed')).toBe('false');
    });

    it('Given an inactive option When the filters render Then it shows the disabled look and keeps its 44 px height', async () => {
      const inactive = buttonLabelled(rootOf(await mountThemes()), 'Ingénierie');

      expect(
        ['aria-disabled:cursor-not-allowed', 'aria-disabled:*:opacity-50', 'min-h-11'].map(
          (token) => inactive?.classList.contains(token),
        ),
      ).toEqual([true, true, true]);
    });
  });
});
