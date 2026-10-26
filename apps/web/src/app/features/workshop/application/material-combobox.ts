import {
  Component,
  ElementRef,
  afterRenderEffect,
  computed,
  inject,
  input,
  linkedSignal,
  model,
  signal,
} from '@angular/core';
import type { FormValueControl } from '@angular/forms/signals';
import type { Material } from '../domain/models/material.model';
import { searchMaterials } from '../domain/search-materials';
import { INSERT_GUIDE_COPY } from './insert-guide-copy';

// Combobox ARIA 1.2 en liste fermée : Entrée ne choisit qu'une option désignée, jamais le texte saisi.
@Component({
  selector: 'app-material-combobox',
  host: { class: 'block' },
  template: `
    <label [for]="fieldId + '-input'" class="field-label">{{ copy.materialLabel }}</label>
    <div class="relative">
      <input
        #field
        [id]="fieldId + '-input'"
        data-testid="material-input"
        type="text"
        role="combobox"
        autocomplete="off"
        aria-autocomplete="list"
        class="form-input"
        [value]="text()"
        [attr.aria-expanded]="expanded()"
        [attr.aria-controls]="fieldId + '-listbox'"
        [attr.aria-activedescendant]="activeId()"
        [attr.aria-describedby]="fieldId + '-hint'"
        (input)="typeQuery(field.value)"
        (keydown)="handleKey($event)"
        (blur)="leaveField()"
      />
      <ul
        [id]="fieldId + '-listbox'"
        role="listbox"
        data-testid="material-listbox"
        [attr.aria-label]="copy.materialListLabel"
        [hidden]="!expanded()"
        class="absolute inset-x-0 top-full z-20 mt-1 max-h-72 overflow-y-auto rounded-field border border-line-strong bg-background py-1 shadow-lg"
      >
        @for (suggestion of suggestions(); track suggestion.material.slug; let index = $index) {
          @let name = suggestion.material.designations[0];
          <!-- eslint-disable-next-line @angular-eslint/template/click-events-have-key-events, @angular-eslint/template/interactive-supports-focus -- combobox ARIA : le focus reste dans le champ, qui porte le clavier (flèches, Entrée) et désigne l'option par aria-activedescendant -->
          <li
            [id]="fieldId + '-option-' + index"
            role="option"
            data-testid="material-option"
            [attr.aria-selected]="index === activeIndex()"
            (mousedown)="$event.preventDefault()"
            (click)="choose(suggestion.material)"
            class="flex cursor-pointer flex-wrap items-baseline gap-x-2 px-3.5 py-2 text-sm text-foreground hover:bg-foreground/5 aria-selected:bg-primary/8 aria-selected:text-primary"
          >
            <span data-testid="material-option-name" class="font-medium">{{ name.value }}</span>
            @if (suggestion.matched !== name) {
              <span data-testid="material-option-match" class="text-muted"
                >{{ suggestion.matched.value }} ·
                {{ copy.designationSystems[suggestion.matched.system] }}</span
              >
            }
            <span data-testid="material-option-group" class="ml-auto font-mono text-muted"
              ><span class="sr-only">{{ copy.isoGroup }} </span
              >{{ suggestion.material.isoGroup.value }}</span
            >
          </li>
        }
      </ul>
    </div>
    <p [id]="fieldId + '-hint'" data-testid="material-hint" class="field-hint">
      {{ copy.materialHint }}
    </p>
    @if (notFound()) {
      <p data-testid="material-not-found" class="mt-1.5 text-sm text-foreground">
        {{ copy.materialNotInGuide }}
      </p>
    }
    <p data-testid="material-status" role="status" class="sr-only">{{ announcement() }}</p>
  `,
})
export class MaterialCombobox implements FormValueControl<string> {
  private readonly _host = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly materials = input.required<readonly Material[]>();
  readonly value = model('');

  private readonly _query = signal('');
  private readonly _open = signal(false);
  protected readonly activeIndex = signal(-1);

  protected readonly fieldId = 'material';
  protected readonly copy = INSERT_GUIDE_COPY;

  private readonly _chosenName = computed(
    () => this.materials().find(({ slug }) => slug === this.value())?.designations[0].value ?? '',
  );
  protected readonly text = linkedSignal(() => this._chosenName());
  protected readonly suggestions = computed(() =>
    this._open() ? searchMaterials(this.materials(), this._query()) : [],
  );
  protected readonly expanded = computed(() => this.suggestions().length > 0);
  protected readonly activeId = computed(() => {
    const index = this.activeIndex();
    return index >= 0 && index < this.suggestions().length
      ? `${this.fieldId}-option-${index}`
      : null;
  });
  protected readonly notFound = computed(
    () => this._open() && this._query().trim() !== '' && this.suggestions().length === 0,
  );
  protected readonly announcement = computed(() => {
    if (!this._open()) return '';
    const count = this.suggestions().length;
    if (count === 0) return this.copy.noMaterialFound;
    return `${count} ${count === 1 ? this.copy.materialFound : this.copy.materialsFound}`;
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

  protected typeQuery(query: string): void {
    this.text.set(query);
    this._query.set(query);
    this._open.set(true);
    this.activeIndex.set(-1);
  }

  protected handleKey(event: KeyboardEvent): void {
    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowUp':
        event.preventDefault();
        this.moveActive(event.key === 'ArrowDown' ? 1 : -1);
        return;
      case 'Enter': {
        event.preventDefault();
        const active = this.suggestions()[this.activeIndex()];
        if (active) this.choose(active.material);
        return;
      }
      case 'Escape':
        event.preventDefault();
        if (this.text().trim() === '') {
          this.leaveField();
          return;
        }
        if (this.expanded()) {
          this.closeList();
          return;
        }
        this.text.set(this._chosenName());
        this._query.set('');
        this.closeList();
        return;
    }
  }

  protected choose(material: Material): void {
    this.value.set(material.slug);
    this.text.set(material.designations[0].value);
    this._query.set('');
    this.closeList();
  }

  protected leaveField(): void {
    if (this.text().trim() === '') this.value.set('');
    this.closeList();
  }

  private closeList(): void {
    this._open.set(false);
    this.activeIndex.set(-1);
  }

  private moveActive(step: 1 | -1): void {
    this._open.set(true);
    const count = this.suggestions().length;
    if (count === 0) return;
    this.activeIndex.update((index) =>
      index < 0 ? (step === 1 ? 0 : count - 1) : (index + step + count) % count,
    );
  }
}
