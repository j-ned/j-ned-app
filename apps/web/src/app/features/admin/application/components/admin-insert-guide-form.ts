import {
  Component,
  ElementRef,
  Injector,
  afterNextRender,
  computed,
  inject,
  input,
  model,
  output,
  viewChild,
} from '@angular/core';
import {
  FormField,
  FormRoot,
  applyEach,
  form,
  required,
  validate,
  type FieldContext,
} from '@angular/forms/signals';
import type {
  InsertGuide,
  InsertGuideEntry,
} from '@features/workshop/domain/models/insert-guide.model';
import { focusFirstInvalid } from '@shared/forms/focus-first-invalid';
import { distinctSuggestions } from '@shared/search/suggestion-search';
import { AppIcon } from '@shared/icons/app-icon';
import { Button } from '@shared/ui/button';
import { FieldError } from '@shared/ui/field-error';
import { AdminInsertGuideRow } from './admin-insert-guide-row';
import { REQUIRED_MESSAGE } from './required-message';
import {
  newInsertGuideRow,
  toInsertGuidePayload,
  type InsertGuideDraft,
} from '../insert-guide-draft';

const MAX_ENTRIES = 300;
const MAX_RADIUS = 10;

type TextError = { readonly kind: string; readonly message: string } | null;

// Bornes de l'API, comptées sur le texte coupé de ses espaces de bord : c'est lui qui part.
const boundedText =
  (limit: number, subject: string, mandatory: boolean) =>
  ({ value }: FieldContext<string>): TextError => {
    const text = value().trim();
    if (!text) return mandatory ? { kind: 'required', message: REQUIRED_MESSAGE } : null;
    if (text.length > limit) {
      return {
        kind: 'maxLength',
        message: `${subject} ne doit pas dépasser ${limit}\u00a0caractères`,
      };
    }
    return null;
  };

// Rayon vide : la ligne n'a pas de rayon unique (outil d'alésage, par exemple).
function radiusError({ value }: FieldContext<number | null>): TextError {
  const radius = value();
  if (radius === null || Number.isNaN(radius)) return null;
  if (radius <= 0) return { kind: 'min', message: 'Le rayon doit être supérieur à 0' };
  if (radius > MAX_RADIUS) {
    return { kind: 'max', message: `Le rayon ne doit pas dépasser ${MAX_RADIUS}\u00a0mm` };
  }
  const hundredths = radius * 100;
  if (Math.abs(hundredths - Math.round(hundredths)) > 1e-9) {
    return { kind: 'decimals', message: 'Le rayon a au plus deux décimales' };
  }
  return null;
}

@Component({
  selector: 'app-admin-insert-guide-form',
  imports: [FormField, FormRoot, AppIcon, Button, FieldError, AdminInsertGuideRow],
  host: { class: 'block' },
  template: `
    <form
      id="insert-guide-form"
      data-testid="admin-insert-guide-form"
      [formRoot]="form"
      novalidate
      class="grid gap-8"
    >
      <div class="grid gap-4">
        <div>
          <label for="insert-guide-enabled" class="flex min-h-11 items-center gap-3 font-medium">
            <input
              id="insert-guide-enabled"
              type="checkbox"
              data-testid="admin-insert-guide-enabled"
              aria-describedby="insert-guide-enabled-hint"
              [formField]="form.enabled"
              class="size-5 accent-primary"
            />
            Guide des plaquettes visible sur le site
          </label>
          <p id="insert-guide-enabled-hint" class="field-hint">
            Cochée : la page du guide et sa carte sur l'accueil de l'atelier sont en ligne.
          </p>
        </div>
        <div>
          <label
            for="insert-guide-decoder-enabled"
            class="flex min-h-11 items-center gap-3 font-medium"
          >
            <input
              id="insert-guide-decoder-enabled"
              type="checkbox"
              data-testid="admin-insert-guide-decoder-enabled"
              aria-describedby="insert-guide-decoder-enabled-hint"
              [formField]="form.decoderEnabled"
              class="size-5 accent-primary"
            />
            Décodeur de plaquette visible sur le site
          </label>
          <p id="insert-guide-decoder-enabled-hint" class="field-hint">
            Cochée : la page du décodeur et sa carte sur l'accueil de l'atelier sont en ligne, et
            les codes du guide mènent à leur décodage.
          </p>
        </div>
      </div>

      <section aria-labelledby="insert-guide-entries-title" class="grid gap-4">
        <div>
          <h2 id="insert-guide-entries-title" class="font-display text-base font-bold">
            Lignes du guide
          </h2>
          <p class="field-hint">
            Sur le site, les lignes sont classées par matière, puis dans l'ordre des opérations.
          </p>
        </div>
        @for (line of lines(); track line.key; let index = $index) {
          <fieldset
            app-admin-insert-guide-row
            [entry]="line.field"
            [rank]="index + 1"
            [materialSuggestions]="materialSuggestions()"
            [insertSuggestions]="insertSuggestions()"
            (removed)="removeRow(index)"
          ></fieldset>
        }
        <app-field-error
          [field]="form.entries"
          errorId="insert-guide-entries-error"
          testId="admin-insert-guide-entries-error"
        />
        <button
          #addButton
          appButton
          type="button"
          variant="text"
          data-testid="admin-insert-guide-add"
          class="justify-self-start"
          (click)="addRow()"
        >
          <app-icon name="plus" [size]="16" />Ajouter une ligne
        </button>
      </section>
    </form>
  `,
})
export class AdminInsertGuideForm {
  private readonly injector = inject(Injector);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly value = model.required<InsertGuideDraft>();
  /** Lignes lues dans l'API : leurs valeurs restent proposées même modifiées dans le brouillon. */
  readonly savedEntries = input<readonly InsertGuideEntry[]>([]);
  readonly submitted = output<InsertGuide>();

  private readonly addButton = viewChild.required<ElementRef<HTMLButtonElement>>('addButton');

  readonly form = form(
    this.value,
    (path) => {
      validate(path.entries, ({ value }) =>
        value().length > MAX_ENTRIES
          ? { kind: 'maxItems', message: `${MAX_ENTRIES}\u00a0lignes au plus` }
          : null,
      );
      applyEach(path.entries, (row) => {
        validate(row.material, (context) =>
          boundedText(80, 'La matière', !context.valueOf(row.allMaterials))(context),
        );
        required(row.operation, { message: 'Choisissez une opération' });
        validate(row.insert, boundedText(40, 'La plaquette', true));
        validate(row.noseRadius, radiusError);
        validate(row.note, boundedText(200, 'La remarque', false));
      });
    },
    {
      submission: {
        action: async () => {
          this.submitted.emit(toInsertGuidePayload(this.value()));
        },
        onInvalid: (field) => focusFirstInvalid(field),
      },
    },
  );

  protected readonly materialSuggestions = computed(() =>
    distinctSuggestions([
      ...this.savedEntries().flatMap(({ material }) => material ?? []),
      ...this.value().entries.map(({ material }) => material),
    ]),
  );
  protected readonly insertSuggestions = computed(() =>
    distinctSuggestions([
      ...this.savedEntries().map(({ insert }) => insert),
      ...this.value().entries.map(({ insert }) => insert),
    ]),
  );

  protected readonly lines = computed(() =>
    Array.from(this.form.entries, (field) => ({ field, key: field().value().key })),
  );

  protected addRow(): void {
    const rank = this.value().entries.length + 1;
    this.form.entries().value.update((rows) => [...rows, newInsertGuideRow()]);
    this.focusAfterRender(() =>
      this.host.nativeElement.querySelector<HTMLElement>(`#insert-guide-${rank}-material`),
    );
  }

  protected removeRow(index: number): void {
    this.form.entries().value.update((rows) => rows.filter((_, i) => i !== index));
    this.focusAfterRender(() => this.addButton().nativeElement);
  }

  private focusAfterRender(target: () => HTMLElement | null): void {
    afterNextRender({ write: () => target()?.focus() }, { injector: this.injector });
  }
}
