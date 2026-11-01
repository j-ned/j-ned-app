import {
  Component,
  ElementRef,
  afterRenderEffect,
  computed,
  inject,
  input,
  linkedSignal,
  model,
  output,
  signal,
  viewChild,
} from '@angular/core';
import type { FormValueControl } from '@angular/forms/signals';
import { counted } from '@shared/format/counted';
import { matchingSuggestions, suggestionKey } from '@shared/search/suggestion-search';

type SuggestMode = 'restricted' | 'free';

@Component({
  selector: 'app-suggest-input',
  host: { class: 'relative block' },
  template: `
    @let id = inputId();
    <input
      #field
      [id]="id"
      [attr.data-testid]="inputTestId()"
      [attr.name]="name() || null"
      type="text"
      role="combobox"
      autocomplete="off"
      aria-autocomplete="list"
      spellcheck="false"
      [attr.autocapitalize]="autocapitalize()"
      [class]="'form-input ' + inputClass()"
      [value]="text()"
      [attr.value]="text()"
      [attr.aria-expanded]="expanded()"
      [attr.aria-controls]="id + '-listbox'"
      [attr.aria-activedescendant]="activeId()"
      [attr.aria-describedby]="describedBy()"
      [attr.aria-invalid]="markedInvalid() ? 'true' : null"
      [attr.aria-required]="mandatory() ? 'true' : null"
      (input)="typeText(field.value)"
      (keydown)="handleKey($event)"
      (blur)="leaveField()"
    />
    <ul
      [id]="id + '-listbox'"
      role="listbox"
      data-testid="suggest-listbox"
      [attr.aria-label]="listLabel()"
      [hidden]="!expanded()"
      class="absolute inset-x-0 top-full z-20 mt-1 max-h-60 overflow-y-auto rounded-field border border-line-strong bg-background py-1 shadow-lg"
    >
      @for (option of options(); track option; let index = $index) {
        <!-- eslint-disable-next-line @angular-eslint/template/click-events-have-key-events, @angular-eslint/template/interactive-supports-focus -- combobox ARIA : le focus reste dans le champ, qui porte le clavier et désigne l'option par aria-activedescendant -->
        <li
          [id]="id + '-option-' + index"
          role="option"
          data-testid="suggest-option"
          [attr.aria-selected]="index === activeIndex()"
          (mousedown)="$event.preventDefault()"
          (click)="choose(option)"
          class="cursor-pointer px-3.5 py-2 text-sm [overflow-wrap:anywhere] text-foreground hover:bg-foreground/5 aria-selected:bg-primary/8 aria-selected:text-primary"
        >
          {{ option }}
        </li>
      }
    </ul>
    @if (noMatch()) {
      <p data-testid="suggest-no-match" class="mt-1.5 text-sm text-foreground">
        {{ noMatchLabel() }}
      </p>
    }
    <p data-testid="suggest-status" role="status" class="sr-only">{{ announcement() }}</p>
  `,
})
export class SuggestInput implements FormValueControl<string> {
  private readonly _host = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly suggestions = input.required<readonly string[]>();
  readonly inputId = input.required<string>();
  readonly listLabel = input.required<string>();
  readonly mode = input<SuggestMode>('free');
  readonly noMatchLabel = input('Aucune proposition');
  readonly describedBy = input<string | null>(null);
  readonly markedInvalid = input(false);
  readonly mandatory = input(false);
  readonly inputTestId = input<string | null>(null);
  readonly inputClass = input('');
  readonly autocapitalize = input('off');
  readonly name = input('');
  readonly value = model('');
  readonly touch = output<void>();
  readonly picked = output<string>();

  private readonly _field = viewChild.required<ElementRef<HTMLInputElement>>('field');

  private readonly _query = signal('');
  private readonly _open = signal(false);
  protected readonly activeIndex = signal(-1);

  protected readonly text = linkedSignal(() => this.value());
  protected readonly options = computed(() => {
    if (!this._open()) return [];
    const query = this._query();
    const matches = matchingSuggestions(this.suggestions(), query);
    if (this.mode() === 'restricted') return matches;
    return matches.filter((option) => option !== query.trim());
  });
  protected readonly expanded = computed(() => this.options().length > 0);
  protected readonly activeId = computed(() => {
    const index = this.activeIndex();
    return index >= 0 && index < this.options().length ? `${this.inputId()}-option-${index}` : null;
  });
  protected readonly noMatch = computed(
    () =>
      this.mode() === 'restricted' &&
      this._open() &&
      this._query().trim() !== '' &&
      !this.expanded(),
  );
  protected readonly announcement = computed(() => {
    if (!this._open()) return '';
    const count = this.options().length;
    if (count > 0) return counted(count, 'proposition', 'propositions');
    return this.noMatch() ? this.noMatchLabel() : '';
  });

  private readonly _scrollActiveOption = afterRenderEffect({
    write: () => {
      const id = this.activeId();
      if (id) {
        this._host.nativeElement
          .querySelector(`[id="${id}"]`)
          ?.scrollIntoView({ block: 'nearest' });
      }
    },
  });

  focus(options?: FocusOptions): void {
    this._field().nativeElement.focus(options);
  }

  protected typeText(text: string): void {
    this.text.set(text);
    if (this.mode() === 'free') this.value.set(text);
    this._query.set(text);
    this._open.set(suggestionKey(text) !== '');
    this.activeIndex.set(-1);
  }

  protected handleKey(event: KeyboardEvent): void {
    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowUp':
        event.preventDefault();
        this.moveActive(event.key === 'ArrowDown' ? 1 : -1);
        return;
      case 'Enter':
        this.confirm(event);
        return;
      case 'Escape':
        this.escape(event);
        return;
    }
  }

  protected choose(option: string): void {
    this.value.set(option);
    this.text.set(option);
    this._query.set('');
    this.closeList();
    this.picked.emit(option);
  }

  protected leaveField(): void {
    this.closeList();
    this.touch.emit();
    if (this.mode() === 'free') return;
    const exact = this.exactSuggestion();
    if (this.text().trim() === '') this.value.set('');
    else if (exact !== undefined) this.choose(exact);
    else this.text.set(this.value());
  }

  private confirm(event: KeyboardEvent): void {
    const active = this.options()[this.activeIndex()];
    if (active !== undefined) {
      event.preventDefault();
      this.choose(active);
      return;
    }
    if (this.mode() === 'free') {
      this.closeList();
      return;
    }
    event.preventDefault();
    const exact = this.exactSuggestion();
    if (exact !== undefined) this.choose(exact);
  }

  private escape(event: KeyboardEvent): void {
    if (this.expanded()) {
      event.preventDefault();
      this.closeList();
      return;
    }
    if (this.mode() === 'free') return;
    event.preventDefault();
    if (this.text().trim() === '') this.value.set('');
    else this.text.set(this.value());
    this._query.set('');
  }

  private exactSuggestion(): string | undefined {
    const typed = suggestionKey(this.text());
    return this.suggestions().find((option) => suggestionKey(option) === typed);
  }

  private closeList(): void {
    this._open.set(false);
    this.activeIndex.set(-1);
  }

  private moveActive(step: 1 | -1): void {
    this._open.set(true);
    const count = this.options().length;
    if (count === 0) return;
    this.activeIndex.update((index) =>
      index < 0 ? (step === 1 ? 0 : count - 1) : (index + step + count) % count,
    );
  }
}
