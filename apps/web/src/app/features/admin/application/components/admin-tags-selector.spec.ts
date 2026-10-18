import { Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { FormField, form } from '@angular/forms/signals';
import { describe, it, expect, beforeEach } from 'vitest';
import { byTestId, testIdText } from '@shared/testing/by-test-id';
import { settle } from '@shared/testing/settle';
import { AdminTagsSelector } from './admin-tags-selector';

const SUGGESTIONS = ['Angular', 'PBKDF2', 'RxJS', 'Sécurité', 'Sécurité web'];
const FIFTEEN_TAGS = Array.from({ length: 15 }, (_, index) => `T${index}`);

const all = (host: ParentNode, testId: string): HTMLElement[] => [
  ...host.querySelectorAll<HTMLElement>(`[data-testid="${testId}"]`),
];

const text = (element: Element | null): string => element?.textContent?.trim() ?? '';

class TagsFieldPage {
  constructor(private readonly fixture: ComponentFixture<unknown>) {}

  get host(): HTMLElement {
    return this.fixture.nativeElement as HTMLElement;
  }

  get input(): HTMLInputElement {
    return byTestId(this.host, 'tags-input') as HTMLInputElement;
  }

  chips(): string[] {
    return all(this.host, 'tag-chip').map(text);
  }

  options(): string[] {
    return all(this.host, 'tag-option').map(text);
  }

  status(): string {
    return testIdText(this.host, 'tags-status');
  }

  error(): string {
    return testIdText(this.host, 'tags-error');
  }

  async type(value: string): Promise<void> {
    this.input.focus();
    this.input.value = value;
    this.input.dispatchEvent(new Event('input', { bubbles: true }));
    await settle(this.fixture);
  }

  async press(key: string): Promise<KeyboardEvent> {
    const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
    this.input.dispatchEvent(event);
    await settle(this.fixture);
    return event;
  }

  async remove(tag: string): Promise<void> {
    all(this.host, 'tag-chip')
      .find((chip) => text(chip) === tag)
      ?.querySelector<HTMLButtonElement>('[data-testid="tag-remove"]')
      ?.click();
    await settle(this.fixture);
  }

  async pick(tag: string): Promise<boolean> {
    const option = all(this.host, 'tag-option').find((element) => text(element) === tag);
    const mousedown = new MouseEvent('mousedown', { bubbles: true, cancelable: true });
    option?.dispatchEvent(mousedown);
    option?.click();
    await settle(this.fixture);
    return mousedown.defaultPrevented;
  }
}

describe('AdminTagsSelector', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [AdminTagsSelector] });
  });

  async function render(
    value: readonly string[] = [],
  ): Promise<{ fixture: ComponentFixture<AdminTagsSelector>; page: TagsFieldPage }> {
    const fixture = TestBed.createComponent(AdminTagsSelector);
    fixture.componentRef.setInput('suggestions', [...SUGGESTIONS]);
    fixture.componentRef.setInput('maxCount', 15);
    fixture.componentRef.setInput('value', [...value]);
    await settle(fixture);
    return { fixture, page: new TagsFieldPage(fixture) };
  }

  describe('affichage', () => {
    it('Given a value When the field renders Then only the selected tags are shown, catalogue or not, and no suggestion list is open', async () => {
      const { page } = await render(['Angular', 'Aéronautique']);

      expect({
        chips: page.chips(),
        options: page.options(),
        expanded: page.input.getAttribute('aria-expanded'),
      }).toEqual({ chips: ['Angular', 'Aéronautique'], options: [], expanded: 'false' });
    });

    it('Given the field When it renders Then the input is a combobox named by its label and described by the hint', async () => {
      const { page } = await render();
      const input = page.input;
      const label = page.host.querySelector(`label[for="${input.id}"]`);
      const hint = page.host.querySelector(`[id="${input.getAttribute('aria-describedby')}"]`);
      const listbox = page.host.querySelector(`[id="${input.getAttribute('aria-controls')}"]`);

      expect({
        hasId: input.id !== '',
        role: input.getAttribute('role'),
        autocomplete: input.getAttribute('aria-autocomplete'),
        listbox: listbox?.getAttribute('role'),
        label: text(label),
        hint: text(hint),
      }).toEqual({
        hasId: true,
        role: 'combobox',
        autocomplete: 'list',
        listbox: 'listbox',
        label: 'Tags',
        hint: 'Entrée ou virgule pour ajouter un tag. 15 tags au plus, 50 caractères chacun.',
      });
    });

    it('Given selected tags When they render Then each remove button is named after its tag', async () => {
      const { page } = await render(['Angular', 'Freelance']);

      expect(
        all(page.host, 'tag-remove').map((button) => button.getAttribute('aria-label')),
      ).toEqual(['Retirer le tag Angular', 'Retirer le tag Freelance']);
    });
  });

  describe('ajout', () => {
    it('Given a free tag typed When Enter is pressed Then it is added, the input emptied, the addition announced and the form not submitted', async () => {
      const { fixture, page } = await render(['Angular']);

      await page.type('  Playwright ');
      const event = await page.press('Enter');

      expect({
        value: fixture.componentInstance.value(),
        chips: page.chips(),
        input: page.input.value,
        status: page.status(),
        prevented: event.defaultPrevented,
      }).toEqual({
        value: ['Angular', 'Playwright'],
        chips: ['Angular', 'Playwright'],
        input: '',
        status: 'Tag Playwright ajouté.',
        prevented: true,
      });
    });

    it('Given a free tag typed When a comma follows it Then it is added and the input emptied', async () => {
      const { fixture, page } = await render(['Angular']);

      await page.type('  Playwright ,');

      expect({
        value: fixture.componentInstance.value(),
        input: page.input.value,
        status: page.status(),
      }).toEqual({ value: ['Angular', 'Playwright'], input: '', status: 'Tag Playwright ajouté.' });
    });

    it('Given several tags pasted with commas When they arrive Then each complete one is added and the last stays in the input', async () => {
      const { fixture, page } = await render();

      await page.type('Freelance, Aéronautique,Play');

      expect({ value: fixture.componentInstance.value(), input: page.input.value }).toEqual({
        value: ['Freelance', 'Aéronautique'],
        input: 'Play',
      });
    });

    it('Given a typed tag matching the catalogue in another case When it is added Then the catalogue spelling is kept', async () => {
      const { fixture, page } = await render();

      await page.type('rxjs');
      await page.press('Enter');

      expect(fixture.componentInstance.value()).toEqual(['RxJS']);
    });

    it.each([
      {
        start: ['Angular'],
        typed: 'ANGULAR',
        error: 'Le tag Angular est déjà présent.',
      },
      {
        start: [],
        typed: 'x'.repeat(51),
        error: 'Un tag compte 50 caractères au plus.',
      },
      {
        start: FIFTEEN_TAGS,
        typed: 'Playwright',
        error: '15 tags au plus : retirez-en un avant d’en ajouter.',
      },
    ])(
      'Given $start When "$typed" is added Then it is refused with « $error » and the input keeps the text',
      async ({ start, typed, error }) => {
        const { fixture, page } = await render(start);

        await page.type(typed);
        await page.press('Enter');

        expect({
          value: fixture.componentInstance.value(),
          error: page.error(),
          role: byTestId(page.host, 'tags-error')?.getAttribute('role'),
          invalid: page.input.getAttribute('aria-invalid'),
          described: page.input.getAttribute('aria-describedby')?.split(' ').length,
          input: page.input.value,
        }).toEqual({
          value: start,
          error,
          role: 'alert',
          invalid: 'true',
          described: 2,
          input: typed,
        });
      },
    );

    it('Given a refusal shown When the text is edited Then the error disappears', async () => {
      const { page } = await render(['Angular']);
      await page.type('angular');
      await page.press('Enter');

      await page.type('angula');

      expect({
        error: byTestId(page.host, 'tags-error'),
        invalid: page.input.getAttribute('aria-invalid'),
      }).toEqual({ error: null, invalid: null });
    });

    it('Given an empty input When Enter is pressed Then nothing is added, no error shows and the form is not submitted', async () => {
      const { fixture, page } = await render(['Angular']);

      const event = await page.press('Enter');

      expect({
        value: fixture.componentInstance.value(),
        prevented: event.defaultPrevented,
        error: byTestId(page.host, 'tags-error'),
      }).toEqual({ value: ['Angular'], prevented: true, error: null });
    });
  });

  describe('suggestions', () => {
    it('Given a query When it is typed Then the matching unselected suggestions are listed and the combobox expanded', async () => {
      const { page } = await render(['Sécurité']);

      await page.type('secu');

      expect({
        options: page.options(),
        expanded: page.input.getAttribute('aria-expanded'),
      }).toEqual({ options: ['Sécurité web'], expanded: 'true' });
    });

    it('Given a query matching nothing When it is typed Then no list is open', async () => {
      const { page } = await render();

      await page.type('Playwright');

      expect({
        options: page.options(),
        expanded: page.input.getAttribute('aria-expanded'),
      }).toEqual({ options: [], expanded: 'false' });
    });

    it('Given an empty input When ArrowDown is pressed Then every unselected suggestion is listed and the first is active', async () => {
      const { page } = await render(['Angular']);

      const event = await page.press('ArrowDown');
      const active = page.input.getAttribute('aria-activedescendant');

      expect({
        options: page.options(),
        active: text(page.host.querySelector(`[id="${active}"]`)),
        selected: all(page.host, 'tag-option').map((option) =>
          option.getAttribute('aria-selected'),
        ),
        prevented: event.defaultPrevented,
      }).toEqual({
        options: ['PBKDF2', 'RxJS', 'Sécurité', 'Sécurité web'],
        active: 'PBKDF2',
        selected: ['true', 'false', 'false', 'false'],
        prevented: true,
      });
    });

    it('Given an open list When ArrowDown, ArrowDown, ArrowUp, ArrowDown then Enter are pressed Then the second suggestion is added', async () => {
      const { fixture, page } = await render();
      await page.type('s');

      await page.press('ArrowDown');
      await page.press('ArrowDown');
      await page.press('ArrowUp');
      await page.press('ArrowDown');
      await page.press('Enter');

      expect({
        value: fixture.componentInstance.value(),
        options: page.options(),
        input: page.input.value,
        status: page.status(),
      }).toEqual({
        value: ['Sécurité web'],
        options: [],
        input: '',
        status: 'Tag Sécurité web ajouté.',
      });
    });

    it('Given the last suggestion active When ArrowDown is pressed Then the first becomes active', async () => {
      const { page } = await render();
      await page.type('secu');

      await page.press('ArrowDown');
      await page.press('ArrowDown');
      await page.press('ArrowDown');
      const active = page.input.getAttribute('aria-activedescendant');

      expect(text(page.host.querySelector(`[id="${active}"]`))).toBe('Sécurité');
    });

    it('Given an open list When Escape is pressed Then it closes and the text stays', async () => {
      const { page } = await render();
      await page.type('secu');
      await page.press('ArrowDown');

      const event = await page.press('Escape');

      expect({
        options: page.options(),
        expanded: page.input.getAttribute('aria-expanded'),
        input: page.input.value,
        active: page.input.getAttribute('aria-activedescendant'),
        prevented: event.defaultPrevented,
      }).toEqual({ options: [], expanded: 'false', input: 'secu', active: null, prevented: true });
    });

    it('Given an open list When a suggestion is clicked Then it is added and the focus stays in the input', async () => {
      const { fixture, page } = await render();
      await page.type('pb');

      const focusKept = await page.pick('PBKDF2');

      expect({
        value: fixture.componentInstance.value(),
        focusKept,
        focused: document.activeElement === page.input,
      }).toEqual({ value: ['PBKDF2'], focusKept: true, focused: true });
    });
  });

  describe('retrait', () => {
    it('Given selected tags When one is removed Then the value is a new list without it, the removal is announced and the focus goes to the input', async () => {
      const initial = ['Angular', 'Freelance', 'RxJS'];
      const { fixture, page } = await render(initial);

      await page.remove('Freelance');

      expect({
        value: fixture.componentInstance.value(),
        chips: page.chips(),
        status: page.status(),
        focused: document.activeElement === page.input,
        initial,
      }).toEqual({
        value: ['Angular', 'RxJS'],
        chips: ['Angular', 'RxJS'],
        status: 'Tag Freelance retiré.',
        focused: true,
        initial: ['Angular', 'Freelance', 'RxJS'],
      });
    });

    it('Given a removed catalogue tag When the list is opened Then it is suggested again', async () => {
      const { page } = await render(['Angular']);

      await page.remove('Angular');
      await page.press('ArrowDown');

      expect(page.options()[0]).toBe('Angular');
    });
  });
});

@Component({
  imports: [AdminTagsSelector, FormField],
  template: `
    <app-admin-tags-selector
      [suggestions]="suggestions"
      [maxCount]="20"
      [formField]="tagsForm.tags"
    />
  `,
})
class TagsFieldHost {
  readonly suggestions: readonly string[] = ['Angular', 'PBKDF2'];
  readonly draft = signal<{ tags: readonly string[] }>({ tags: ['Angular'] });
  readonly tagsForm = form(this.draft);
}

describe('AdminTagsSelector: bound by [formField]', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [TagsFieldHost] });
  });

  async function renderHost(): Promise<{
    fixture: ComponentFixture<TagsFieldHost>;
    page: TagsFieldPage;
  }> {
    const fixture = TestBed.createComponent(TagsFieldHost);
    await settle(fixture);
    return { fixture, page: new TagsFieldPage(fixture) };
  }

  it('Given a form whose tags hold Angular When the field renders Then Angular is the only chip', async () => {
    const { page } = await renderHost();

    expect(page.chips()).toEqual(['Angular']);
  });

  it('Given the bound field When a free tag is added and Angular removed Then the form model follows', async () => {
    const { fixture, page } = await renderHost();

    await page.type('Playwright');
    await page.press('Enter');
    await page.remove('Angular');

    expect(fixture.componentInstance.draft().tags).toEqual(['Playwright']);
  });

  it('Given a limit of 20 When the field renders Then the hint states it', async () => {
    const { page } = await renderHost();

    expect(testIdText(page.host, 'tags-hint')).toBe(
      'Entrée ou virgule pour ajouter un tag. 20 tags au plus, 50 caractères chacun.',
    );
  });

  it('Given the bound field When the form model is replaced Then the chips follow it', async () => {
    const { fixture, page } = await renderHost();

    fixture.componentInstance.draft.set({ tags: ['PBKDF2', 'Freelance'] });
    await settle(fixture);

    expect(page.chips()).toEqual(['PBKDF2', 'Freelance']);
  });
});
