import {
  Component,
  ElementRef,
  afterRenderEffect,
  computed,
  inject,
  input,
  model,
  signal,
  viewChild,
} from '@angular/core';
import type { FormValueControl } from '@angular/forms/signals';
import { blogTagPalette } from '@features/blog/application/blog-tag-palette';
import { AppIcon } from '@shared/icons/app-icon';
import { addTag, TAG_MAX_LENGTH, type TagRefusal } from '../add-tag';
import { normalizeTag } from '../tag-key';
import { matchingTags } from '../tag-suggestions';

type TagChip = { readonly tag: string; readonly classes: string };

// Combobox ARIA 1.2 (liste, sans sélection automatique) plutôt qu'un <datalist> : ce dernier
// n'expose ni l'option active ni le nombre de suggestions aux lecteurs d'écran de façon fiable,
// ne se stylise pas et laisse Entrée choisir une option sans l'ajouter.
@Component({
  selector: 'app-admin-tags-selector',
  imports: [AppIcon],
  host: { class: 'block' },
  template: `
    @let id = fieldId();
    <label [for]="id + '-input'" class="field-label">Tags</label>
    @if (chips().length > 0) {
      <ul class="mb-2.5 flex flex-wrap gap-2" aria-label="Tags sélectionnés">
        @for (chip of chips(); track chip.tag) {
          <li
            data-testid="tag-chip"
            class="inline-flex min-h-9 items-center gap-1 rounded-lg border py-0.5 pr-0.5 pl-3 text-sm font-medium"
            [class]="chip.classes"
          >
            {{ chip.tag }}
            <button
              type="button"
              data-testid="tag-remove"
              [attr.aria-label]="'Retirer le tag ' + chip.tag"
              (click)="removeTag(chip.tag)"
              class="inline-flex size-8 cursor-pointer items-center justify-center rounded-md hover:bg-foreground/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <app-icon name="xmark" [size]="12" />
            </button>
          </li>
        }
      </ul>
    }
    <div class="relative">
      <input
        #field
        [id]="id + '-input'"
        data-testid="tags-input"
        type="text"
        role="combobox"
        autocomplete="off"
        aria-autocomplete="list"
        placeholder="Ajouter un tag…"
        class="form-input"
        [attr.aria-expanded]="expanded()"
        [attr.aria-controls]="id + '-listbox'"
        [attr.aria-activedescendant]="activeId()"
        [attr.aria-describedby]="error() ? id + '-hint ' + id + '-error' : id + '-hint'"
        [attr.aria-invalid]="error() ? 'true' : null"
        (input)="typeTag(field)"
        (keydown)="handleKey($event, field)"
        (blur)="closeList()"
      />
      <ul
        [id]="id + '-listbox'"
        role="listbox"
        aria-label="Tags suggérés"
        data-testid="tags-listbox"
        [hidden]="!expanded()"
        class="absolute inset-x-0 top-full z-20 mt-1 max-h-60 overflow-y-auto rounded-lg border border-line-strong bg-background py-1 shadow-lg"
      >
        @for (option of options(); track option; let index = $index) {
          <!-- eslint-disable-next-line @angular-eslint/template/click-events-have-key-events, @angular-eslint/template/interactive-supports-focus -- combobox ARIA : le focus reste dans le champ, qui porte le clavier (flèches, Entrée) et désigne l'option par aria-activedescendant -->
          <li
            [id]="id + '-option-' + index"
            role="option"
            data-testid="tag-option"
            [attr.aria-selected]="index === activeIndex()"
            (mousedown)="$event.preventDefault()"
            (click)="pickOption(option, field)"
            class="cursor-pointer px-3.5 py-2 text-sm text-foreground hover:bg-foreground/5 aria-selected:bg-primary/10 aria-selected:text-primary"
          >
            {{ option }}
          </li>
        }
      </ul>
    </div>
    <p [id]="id + '-hint'" data-testid="tags-hint" class="field-hint">{{ hint() }}</p>
    @if (error(); as message) {
      <p [id]="id + '-error'" data-testid="tags-error" role="alert" class="form-error">
        {{ message }}
      </p>
    }
    <p data-testid="tags-status" role="status" class="sr-only">{{ announcement() }}</p>
  `,
})
export class AdminTagsSelector implements FormValueControl<readonly string[]> {
  private readonly _host = inject<ElementRef<HTMLElement>>(ElementRef);

  /** Tags proposés à la saisie : catalogue, et tags déjà posés ailleurs si la page les connaît. */
  readonly suggestions = input.required<readonly string[]>();
  /** `@ArrayMaxSize` du DTO de l'API. */
  readonly maxCount = input.required<number>();
  readonly fieldId = input('tags');
  readonly value = model<readonly string[]>([]);

  private readonly _field = viewChild.required<ElementRef<HTMLInputElement>>('field');

  private readonly _query = signal('');
  private readonly _open = signal(false);
  protected readonly activeIndex = signal(-1);
  protected readonly error = signal<string | null>(null);
  protected readonly announcement = signal('');

  protected readonly chips = computed((): readonly TagChip[] =>
    this.value().map((tag) => ({ tag, classes: blogTagPalette(tag).tint })),
  );
  protected readonly options = computed(() =>
    this._open() ? matchingTags(this.suggestions(), this.value(), this._query()) : [],
  );
  protected readonly expanded = computed(() => this.options().length > 0);
  protected readonly activeId = computed(() => {
    const index = this.activeIndex();
    return index >= 0 && index < this.options().length ? `${this.fieldId()}-option-${index}` : null;
  });
  protected readonly hint = computed(
    () =>
      `Entrée ou virgule pour ajouter un tag. ${this.maxCount()} tags au plus, ${TAG_MAX_LENGTH} caractères chacun.`,
  );

  constructor() {
    // L'option active reste visible quand le clavier la fait défiler hors de la liste.
    afterRenderEffect({
      write: () => {
        const id = this.activeId();
        if (id) {
          this._host.nativeElement
            .querySelector(`[id="${id}"]`)
            ?.scrollIntoView({ block: 'nearest' });
        }
      },
    });
  }

  // La virgule se lit dans la valeur saisie, pas au clavier : les claviers virtuels Android
  // n'émettent pas de `key` exploitable, et un collage « a, b, c » arrive en un seul événement.
  // Une partie refusée reste dans le champ, avec ce qui la suit, pour être corrigée.
  protected typeTag(field: HTMLInputElement): void {
    this.error.set(null);
    const parts = field.value.split(',');
    let kept = parts.length - 1;
    for (let index = 0; index < parts.length - 1; index++) {
      if (normalizeTag(parts[index]) !== '' && !this.commit(parts[index])) {
        kept = index;
        break;
      }
    }
    const remaining = parts.slice(kept).join(',');
    if (remaining !== field.value) field.value = remaining;
    this._query.set(remaining);
    this._open.set(true);
    this.activeIndex.set(-1);
  }

  protected handleKey(event: KeyboardEvent, field: HTMLInputElement): void {
    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowUp':
        event.preventDefault();
        this.moveActive(event.key === 'ArrowDown' ? 1 : -1);
        return;
      case 'Enter': {
        // Entrée dans le champ ajoute un tag, elle ne soumet jamais le formulaire.
        event.preventDefault();
        const active = this.options()[this.activeIndex()];
        this.addAndClear(active ?? field.value, field);
        return;
      }
      case 'Escape':
        if (!this.expanded()) return;
        event.preventDefault();
        this.closeList();
        return;
    }
  }

  protected pickOption(tag: string, field: HTMLInputElement): void {
    this.addAndClear(tag, field);
    field.focus();
  }

  protected removeTag(tag: string): void {
    this.value.update((tags) => tags.filter((selected) => selected !== tag));
    this.announcement.set(`Tag ${tag} retiré.`);
    this.error.set(null);
    // Le bouton disparaît avec sa puce : le focus revient au champ plutôt qu'au document.
    this._field().nativeElement.focus();
  }

  protected closeList(): void {
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

  private addAndClear(raw: string, field: HTMLInputElement): void {
    if (normalizeTag(raw) === '' || !this.commit(raw)) return;
    field.value = '';
    this._query.set('');
    this.closeList();
  }

  private commit(raw: string): boolean {
    const result = addTag(this.value(), raw, {
      known: this.suggestions(),
      maxCount: this.maxCount(),
    });
    if (!result.success) {
      this.error.set(this.refusal(result.error, result.tag));
      return false;
    }
    this.value.set(result.data.tags);
    this.announcement.set(`Tag ${result.data.added} ajouté.`);
    return true;
  }

  private refusal(error: TagRefusal, tag: string): string | null {
    switch (error) {
      case 'duplicate':
        return `Le tag ${tag} est déjà présent.`;
      case 'too-long':
        return `Un tag compte ${TAG_MAX_LENGTH} caractères au plus.`;
      case 'too-many':
        return `${this.maxCount()} tags au plus : retirez-en un avant d’en ajouter.`;
      case 'empty':
        return null;
    }
  }
}
