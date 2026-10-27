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
  signal,
} from '@angular/core';
import {
  FormField,
  FormRoot,
  applyEach,
  form,
  required,
  validate,
  type FieldContext,
  type ReadonlyFieldTree,
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
import { AdminInsertGuideGroup } from './admin-insert-guide-group';
import { REQUIRED_MESSAGE } from './required-message';
import {
  newInsertGuideGroup,
  newInsertGuideTool,
  toInsertGuidePayload,
  type InsertGuideDraft,
  type InsertGuideGroupDraft,
} from '../insert-guide-draft';

const MAX_TOOLS = 300;
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

// Rayon vide : l'outil n'a pas de rayon unique (outil d'alésage, par exemple).
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

// Deux blocs du même nom se fondraient en un à la relecture du document : le second est refusé.
function duplicateError(
  name: string,
  key: string,
  groups: readonly InsertGuideGroupDraft[],
): TextError {
  const first = groups.find((group) => !group.allMaterials && group.material.trim() === name);
  if (!first || first.key === key) return null;
  return {
    kind: 'duplicate',
    message: `Le bloc «\u00a0${name}\u00a0» existe déjà\u00a0: ajoutez-y ces outils, puis retirez ce bloc`,
  };
}

@Component({
  selector: 'app-admin-insert-guide-form',
  imports: [FormField, FormRoot, AppIcon, Button, FieldError, AdminInsertGuideGroup],
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

      <section aria-labelledby="insert-guide-groups-title" class="grid gap-4">
        <div>
          <h2 id="insert-guide-groups-title" class="font-display text-base font-bold">
            Outils par matière
          </h2>
          <p class="field-hint">
            Sur le site, les outils sont classés par matière, puis dans l'ordre des opérations.
          </p>
          <p id="insert-guide-radius-hint" class="field-hint mt-0">
            Rayon de bec facultatif : laissez-le vide quand l'outil n'a pas de rayon unique.
          </p>
        </div>
        @for (block of blocks(); track block.key; let index = $index) {
          <details
            app-admin-insert-guide-group
            [group]="block.field"
            [rank]="index + 1"
            [open]="block.open"
            (openChange)="setOpen(block.key, $event)"
            radiusHintId="insert-guide-radius-hint"
            [materialSuggestions]="materialSuggestions()"
            [insertSuggestions]="insertSuggestions()"
            (toolAdded)="addTool(index)"
            (toolRemoved)="removeTool(index, $event)"
            (removed)="removeGroup(index)"
          ></details>
        }
        <app-field-error
          [field]="form.groups"
          errorId="insert-guide-groups-error"
          testId="admin-insert-guide-groups-error"
        />
        <div class="flex flex-wrap gap-x-6">
          <button
            id="insert-guide-add-group"
            appButton
            type="button"
            variant="text"
            data-testid="admin-insert-guide-add-group"
            (click)="addGroup()"
          >
            <app-icon name="plus" [size]="16" />Ajouter une matière
          </button>
          @if (!hasGeneric()) {
            <button
              appButton
              type="button"
              variant="text"
              data-testid="admin-insert-guide-add-generic"
              (click)="addGeneric()"
            >
              <app-icon name="plus" [size]="16" />Ajouter le bloc Toutes matières
            </button>
          }
        </div>
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

  private readonly openKeys = signal<ReadonlySet<string>>(new Set());

  readonly form = form(
    this.value,
    (path) => {
      validate(path.groups, ({ value }) =>
        value().reduce((total, group) => total + group.tools.length, 0) > MAX_TOOLS
          ? {
              kind: 'maxItems',
              message: `${MAX_TOOLS}\u00a0outils au plus, toutes matières confondues`,
            }
          : null,
      );
      applyEach(path.groups, (group) => {
        validate(group.material, (context) => {
          if (context.valueOf(group.allMaterials)) return null;
          return (
            boundedText(80, 'La matière', true)(context) ??
            duplicateError(
              context.value().trim(),
              context.valueOf(group.key),
              context.valueOf(path.groups),
            )
          );
        });
        applyEach(group.tools, (tool) => {
          required(tool.operation, { message: 'Choisissez une opération' });
          validate(tool.insert, boundedText(40, 'La plaquette', true));
          validate(tool.noseRadius, radiusError);
          validate(tool.note, boundedText(200, 'La remarque', false));
        });
      });
    },
    {
      submission: {
        action: async () => {
          this.submitted.emit(toInsertGuidePayload(this.value()));
        },
        onInvalid: (field) => this.revealInvalid(field),
      },
    },
  );

  protected readonly materialSuggestions = computed(() =>
    distinctSuggestions([
      ...this.savedEntries().flatMap(({ material }) => material ?? []),
      ...this.value().groups.map(({ material }) => material),
    ]),
  );
  protected readonly insertSuggestions = computed(() =>
    distinctSuggestions([
      ...this.savedEntries().map(({ insert }) => insert),
      ...this.value().groups.flatMap(({ tools }) => tools.map(({ insert }) => insert)),
    ]),
  );

  protected readonly blocks = computed(() => {
    const open = this.openKeys();
    return Array.from(this.form.groups, (field) => {
      const key = field().value().key;
      return { field, key, open: open.has(key) };
    });
  });
  protected readonly hasGeneric = computed(() =>
    this.value().groups.some(({ allMaterials }) => allMaterials),
  );

  protected setOpen(key: string, open: boolean): void {
    this.openKeys.update((keys) => {
      const next = new Set(keys);
      if (open) next.add(key);
      else next.delete(key);
      return next;
    });
  }

  protected addTool(groupIndex: number): void {
    const block = this.form.groups[groupIndex];
    if (!block) return;
    const toolRank = block.tools().value().length + 1;
    block.tools().value.update((tools) => [...tools, newInsertGuideTool()]);
    this.setOpen(block().value().key, true);
    this.focusAfterRender(`#insert-guide-g${groupIndex + 1}-t${toolRank}-operation`);
  }

  protected removeTool(groupIndex: number, toolIndex: number): void {
    const block = this.form.groups[groupIndex];
    if (!block) return;
    if (block.tools().value().length === 1) {
      this.removeGroup(groupIndex);
      return;
    }
    block.tools().value.update((tools) => tools.filter((_, index) => index !== toolIndex));
    this.focusAfterRender(`#insert-guide-g${groupIndex + 1}-add-tool`);
  }

  protected addGroup(): void {
    const groups = this.value().groups;
    const generic = groups.findIndex(({ allMaterials }) => allMaterials);
    const at = generic === -1 ? groups.length : generic;
    this.insertGroup(newInsertGuideGroup(false), at);
    this.focusAfterRender(`#insert-guide-g${at + 1}-material`);
  }

  protected addGeneric(): void {
    const at = this.value().groups.length;
    this.insertGroup(newInsertGuideGroup(true), at);
    this.focusAfterRender(`#insert-guide-g${at + 1}-t1-operation`);
  }

  protected removeGroup(groupIndex: number): void {
    this.form.groups().value.update((groups) => groups.filter((_, index) => index !== groupIndex));
    this.focusAfterRender('#insert-guide-add-group');
  }

  private insertGroup(group: InsertGuideGroupDraft, at: number): void {
    this.form
      .groups()
      .value.update((groups) => [...groups.slice(0, at), group, ...groups.slice(at)]);
    this.setOpen(group.key, true);
  }

  // Un champ d'un bloc replié n'est pas focusable : le bloc s'ouvre, le focus suit le rendu.
  private revealInvalid(field: ReadonlyFieldTree<unknown>): void {
    for (const block of this.form.groups) {
      if (block().invalid()) this.setOpen(block().value().key, true);
    }
    afterNextRender({ write: () => focusFirstInvalid(field) }, { injector: this.injector });
  }

  private focusAfterRender(selector: string): void {
    afterNextRender(
      { write: () => this.host.nativeElement.querySelector<HTMLElement>(selector)?.focus() },
      { injector: this.injector },
    );
  }
}
