import { Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { FormField, form } from '@angular/forms/signals';
import { settle } from '@shared/testing/settle';
import { SuggestInput } from './suggest-input';

const MATERIALS = ['Acier C35', 'Acier 33MnCrB5', 'Inox 316L', 'Laiton CuZn39'] as const;

type Mode = 'restricted' | 'free';

class SuggestPage {
  constructor(private readonly fixture: ComponentFixture<unknown>) {}

  get host(): HTMLElement {
    return this.fixture.nativeElement as HTMLElement;
  }

  get field(): HTMLInputElement {
    return this.host.querySelector<HTMLInputElement>('input[role="combobox"]')!;
  }

  one(testId: string): HTMLElement | null {
    return this.host.querySelector<HTMLElement>(`[data-testid="${testId}"]`);
  }

  options(): HTMLElement[] {
    return [...this.host.querySelectorAll<HTMLElement>('[data-testid="suggest-option"]')];
  }

  optionTexts(): string[] {
    return this.options().map((option) => option.textContent?.trim() ?? '');
  }

  activeText(): string | null {
    const id = this.field.getAttribute('aria-activedescendant');
    return id ? (this.host.querySelector(`[id="${id}"]`)?.textContent?.trim() ?? null) : null;
  }

  expanded(): string | null {
    return this.field.getAttribute('aria-expanded');
  }

  status(): string {
    return this.one('suggest-status')?.textContent?.trim() ?? '';
  }

  async type(text: string): Promise<void> {
    this.field.value = text;
    this.field.dispatchEvent(new Event('input'));
    await settle(this.fixture);
  }

  async press(key: string): Promise<KeyboardEvent> {
    const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
    this.field.dispatchEvent(event);
    await settle(this.fixture);
    return event;
  }

  async leave(): Promise<void> {
    this.field.dispatchEvent(new FocusEvent('blur'));
    await settle(this.fixture);
  }

  async pick(text: string): Promise<boolean> {
    const option = this.options().find((candidate) => candidate.textContent?.trim() === text)!;
    const mousedown = new MouseEvent('mousedown', { bubbles: true, cancelable: true });
    option.dispatchEvent(mousedown);
    option.click();
    await settle(this.fixture);
    return mousedown.defaultPrevented;
  }
}

async function render(
  mode: Mode,
  value = '',
): Promise<{ fixture: ComponentFixture<SuggestInput>; page: SuggestPage; picked: string[] }> {
  TestBed.configureTestingModule({ imports: [SuggestInput] });
  const fixture = TestBed.createComponent(SuggestInput);
  fixture.componentRef.setInput('inputId', 'material');
  fixture.componentRef.setInput('suggestions', MATERIALS);
  fixture.componentRef.setInput('listLabel', 'Matières du guide');
  fixture.componentRef.setInput('noMatchLabel', 'Aucune matière');
  fixture.componentRef.setInput('mode', mode);
  fixture.componentRef.setInput('value', value);
  const picked: string[] = [];
  fixture.componentInstance.picked.subscribe((text) => picked.push(text));
  await settle(fixture);
  return { fixture, page: new SuggestPage(fixture), picked };
}

describe('SuggestInput', () => {
  describe('accessible structure', () => {
    it('Given the field When it renders Then the input is a closed list combobox controlling a named listbox, with a silent status', async () => {
      const { page } = await render('restricted');
      const field = page.field;
      const listbox = page.host.querySelector(`[id="${field.getAttribute('aria-controls')}"]`);

      expect({
        id: field.id,
        type: field.type,
        role: field.getAttribute('role'),
        autocomplete: field.getAttribute('aria-autocomplete'),
        browserAutocomplete: field.getAttribute('autocomplete'),
        expanded: page.expanded(),
        activeDescendant: field.getAttribute('aria-activedescendant'),
        listboxRole: listbox?.getAttribute('role'),
        listboxLabel: listbox?.getAttribute('aria-label'),
        listboxHidden: listbox?.hasAttribute('hidden'),
        statusRole: page.one('suggest-status')?.getAttribute('role'),
        status: page.status(),
      }).toEqual({
        id: 'material',
        type: 'text',
        role: 'combobox',
        autocomplete: 'list',
        browserAutocomplete: 'off',
        expanded: 'false',
        activeDescendant: null,
        listboxRole: 'listbox',
        listboxLabel: 'Matières du guide',
        listboxHidden: true,
        statusRole: 'status',
        status: '',
      });
    });

    it('Given description, invalid and mandatory marks When the field renders Then the input carries them', async () => {
      const { fixture, page } = await render('free');
      fixture.componentRef.setInput('describedBy', 'material-hint');
      fixture.componentRef.setInput('markedInvalid', true);
      fixture.componentRef.setInput('mandatory', true);
      fixture.componentRef.setInput('name', 'material');
      fixture.componentRef.setInput('inputTestId', 'material-field');
      await settle(fixture);

      expect({
        describedBy: page.field.getAttribute('aria-describedby'),
        invalid: page.field.getAttribute('aria-invalid'),
        required: page.field.getAttribute('aria-required'),
        name: page.field.name,
        testId: page.field.dataset['testid'],
      }).toEqual({
        describedBy: 'material-hint',
        invalid: 'true',
        required: 'true',
        name: 'material',
        testId: 'material-field',
      });
    });
  });

  describe('typing', () => {
    it.each<[string, readonly string[], string]>([
      ['33', ['Acier 33MnCrB5'], '1 proposition'],
      ['ac', ['Acier C35', 'Acier 33MnCrB5'], '2 propositions'],
      ['cr', ['Acier 33MnCrB5'], '1 proposition'],
    ])(
      'Given the field When %j is typed Then the matching suggestions are listed and their count announced',
      async (query, texts, status) => {
        const { page } = await render('restricted');

        await page.type(query);

        expect({
          texts: page.optionTexts(),
          expanded: page.expanded(),
          status: page.status(),
          active: page.field.getAttribute('aria-activedescendant'),
        }).toEqual({ texts, expanded: 'true', status, active: null });
      },
    );

    it('Given the restricted field When a text without match is typed Then nothing is listed and the absence is said and announced', async () => {
      const { page } = await render('restricted');

      await page.type('titane');

      expect({
        options: page.options().length,
        expanded: page.expanded(),
        status: page.status(),
        noMatch: page.one('suggest-no-match')?.textContent?.trim(),
      }).toEqual({
        options: 0,
        expanded: 'false',
        status: 'Aucune matière',
        noMatch: 'Aucune matière',
      });
    });

    it('Given the restricted field When text is typed Then the value is unchanged until a suggestion is chosen', async () => {
      const { fixture, page } = await render('restricted', 'Inox 316L');

      await page.type('ac');

      expect([fixture.componentInstance.value(), page.field.value]).toEqual(['Inox 316L', 'ac']);
    });

    it('Given the free field When text is typed Then it becomes the value, a text without match says nothing visibly, and the exact value itself is not proposed', async () => {
      const { fixture, page } = await render('free');

      await page.type('Code libre');
      const free = {
        value: fixture.componentInstance.value(),
        noMatch: page.one('suggest-no-match'),
        status: page.status(),
      };
      await page.type('Inox 316L');

      expect({ free, exact: page.optionTexts(), value: fixture.componentInstance.value() }).toEqual(
        {
          free: { value: 'Code libre', noMatch: null, status: '' },
          exact: [],
          value: 'Inox 316L',
        },
      );
    });

    it('Given the free field When another spelling of a suggestion is typed Then the reference spelling is still proposed', async () => {
      const { page } = await render('free');

      await page.type('inox 316l');

      expect(page.optionTexts()).toEqual(['Inox 316L']);
    });
  });

  describe('keyboard', () => {
    it('Given an empty field When ArrowDown is pressed Then every suggestion is listed and the first one is active', async () => {
      const { page } = await render('restricted');

      const event = await page.press('ArrowDown');

      expect({
        texts: page.optionTexts(),
        active: page.activeText(),
        activeId: page.field.getAttribute('aria-activedescendant'),
        selected: page.options().map((option) => option.getAttribute('aria-selected')),
        prevented: event.defaultPrevented,
        status: page.status(),
      }).toEqual({
        texts: [...MATERIALS],
        active: 'Acier C35',
        activeId: 'material-option-0',
        selected: ['true', 'false', 'false', 'false'],
        prevented: true,
        status: '4 propositions',
      });
    });

    it('Given the list is open When the arrows run past either end Then the active option wraps around, and ArrowUp on a closed list opens on the last one', async () => {
      const { page } = await render('restricted');
      const actives: (string | null)[] = [];

      for (const key of ['ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowUp', 'ArrowUp']) {
        await page.press(key);
        actives.push(page.activeText());
      }

      expect(actives).toEqual([
        'Laiton CuZn39',
        'Acier C35',
        'Acier 33MnCrB5',
        'Acier C35',
        'Laiton CuZn39',
      ]);
    });

    it.each<Mode>(['restricted', 'free'])(
      'Given the %s field and an active option When Enter is pressed Then it becomes the value, is shown and announced as picked, and the list closes',
      async (mode) => {
        const { fixture, page, picked } = await render(mode);

        await page.type('ac');
        await page.press('ArrowDown');
        await page.press('ArrowDown');
        const event = await page.press('Enter');

        expect({
          value: fixture.componentInstance.value(),
          text: page.field.value,
          picked,
          expanded: page.expanded(),
          options: page.options().length,
          activeId: page.field.getAttribute('aria-activedescendant'),
          prevented: event.defaultPrevented,
        }).toEqual({
          value: 'Acier 33MnCrB5',
          text: 'Acier 33MnCrB5',
          picked: ['Acier 33MnCrB5'],
          expanded: 'false',
          options: 0,
          activeId: null,
          prevented: true,
        });
      },
    );

    it('Given the restricted field and a typed text matching a suggestion exactly but no active option When Enter is pressed Then that suggestion is chosen', async () => {
      const { fixture, page, picked } = await render('restricted');

      await page.type('inox-316l');
      const event = await page.press('Enter');

      expect([
        fixture.componentInstance.value(),
        page.field.value,
        picked,
        event.defaultPrevented,
      ]).toEqual(['Inox 316L', 'Inox 316L', ['Inox 316L'], true]);
    });

    it('Given the restricted field and a partial text without active option When Enter is pressed Then nothing is chosen and nothing is submitted', async () => {
      const { fixture, page, picked } = await render('restricted');

      await page.type('ac');
      const event = await page.press('Enter');

      expect([fixture.componentInstance.value(), picked, event.defaultPrevented]).toEqual([
        '',
        [],
        true,
      ]);
    });

    it('Given the free field without active option When Enter is pressed Then the key is left to the form, which submits the typed text', async () => {
      const { fixture, page, picked } = await render('free');

      await page.type('ac');
      const event = await page.press('Enter');

      expect([
        fixture.componentInstance.value(),
        picked,
        event.defaultPrevented,
        page.expanded(),
      ]).toEqual(['ac', [], false, 'false']);
    });

    it('Given an open list When Escape is pressed Then it closes and keeps the typed text and the value', async () => {
      const { fixture, page } = await render('restricted', 'Inox 316L');

      await page.type('ac');
      const event = await page.press('Escape');

      expect({
        expanded: page.expanded(),
        text: page.field.value,
        value: fixture.componentInstance.value(),
        prevented: event.defaultPrevented,
      }).toEqual({ expanded: 'false', text: 'ac', value: 'Inox 316L', prevented: true });
    });

    it('Given the restricted field and a closed list over a typed text When Escape is pressed Then the field shows the chosen suggestion again', async () => {
      const { page } = await render('restricted', 'Inox 316L');

      await page.type('ac');
      await page.press('Escape');
      await page.press('Escape');

      expect(page.field.value).toBe('Inox 316L');
    });

    it('Given the restricted field emptied When Escape is pressed Then nothing is chosen any more', async () => {
      const { fixture, page } = await render('restricted', 'Inox 316L');

      await page.type('');
      await page.press('Escape');

      expect([fixture.componentInstance.value(), page.field.value]).toEqual(['', '']);
    });
  });

  describe('leaving the field', () => {
    it.each<[string, string, string, string]>([
      ['an emptied text', '', '', ''],
      ['a partial text', 'ac', 'Inox 316L', 'Inox 316L'],
      ['a text matching a suggestion exactly', 'acier c35', 'Acier C35', 'Acier C35'],
    ])(
      'Given the restricted field holding a choice When %s is left by losing focus Then the list closes and the field settles on its value',
      async (_case, typed, value, text) => {
        const { fixture, page } = await render('restricted', 'Inox 316L');

        await page.type(typed);
        await page.leave();

        expect([fixture.componentInstance.value(), page.field.value, page.expanded()]).toEqual([
          value,
          text,
          'false',
        ]);
      },
    );

    it('Given the free field When a text is left by losing focus Then it stays the value', async () => {
      const { fixture, page } = await render('free');

      await page.type('ac');
      await page.leave();

      expect([fixture.componentInstance.value(), page.expanded()]).toEqual(['ac', 'false']);
    });
  });

  describe('pointer', () => {
    it('Given an open list When an option is clicked Then the field keeps the focus and the option is chosen', async () => {
      const { fixture, page, picked } = await render('restricted');

      await page.type('ac');
      const prevented = await page.pick('Acier 33MnCrB5');

      expect({
        prevented,
        value: fixture.componentInstance.value(),
        text: page.field.value,
        picked,
        expanded: page.expanded(),
      }).toEqual({
        prevented: true,
        value: 'Acier 33MnCrB5',
        text: 'Acier 33MnCrB5',
        picked: ['Acier 33MnCrB5'],
        expanded: 'false',
      });
    });
  });

  describe('value set from outside', () => {
    it('Given a value set from outside When the field renders Then it shows it', async () => {
      const { fixture, page } = await render('restricted');

      fixture.componentRef.setInput('value', 'Laiton CuZn39');
      await settle(fixture);

      expect(page.field.value).toBe('Laiton CuZn39');
    });
  });
});

@Component({
  imports: [SuggestInput, FormField],
  template: `<app-suggest-input
    inputId="code"
    listLabel="Codes du guide"
    [suggestions]="codes"
    [formField]="codeForm"
  />`,
})
class CodeFieldHost {
  readonly codes = ['CNMG 120408', 'DNMG 150608'];
  readonly model = signal('CNMG 120408');
  readonly codeForm = form(this.model, { name: 'code' });
}

describe('SuggestInput bound by [formField]', () => {
  async function renderHost(): Promise<{
    fixture: ComponentFixture<CodeFieldHost>;
    page: SuggestPage;
  }> {
    TestBed.configureTestingModule({ imports: [CodeFieldHost] });
    const fixture = TestBed.createComponent(CodeFieldHost);
    await settle(fixture);
    return { fixture, page: new SuggestPage(fixture) };
  }

  it('Given a form holding a value When the field renders Then it shows it and the form names the input', async () => {
    const { page } = await renderHost();

    expect([page.field.value, page.field.name]).toEqual(['CNMG 120408', 'code']);
  });

  it('Given the bound field When a text is typed then a suggestion chosen Then the form model follows, and is touched on blur', async () => {
    const { fixture, page } = await renderHost();

    await page.type('dn');
    const typed = fixture.componentInstance.model();
    await page.press('ArrowDown');
    await page.press('Enter');
    await page.leave();

    expect({
      typed,
      chosen: fixture.componentInstance.model(),
      touched: fixture.componentInstance.codeForm().touched(),
    }).toEqual({ typed: 'dn', chosen: 'DNMG 150608', touched: true });
  });

  it('Given the bound field When its control is asked to take the focus Then the input has it', async () => {
    const { fixture, page } = await renderHost();
    document.body.appendChild(page.host);

    fixture.componentInstance.codeForm().focusBoundControl();

    expect(document.activeElement).toBe(page.field);
    page.host.remove();
  });
});
