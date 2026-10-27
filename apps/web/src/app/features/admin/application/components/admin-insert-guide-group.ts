import { Component, ElementRef, computed, inject, input, model, output } from '@angular/core';
import { FormField, type FieldTree } from '@angular/forms/signals';
import { findConfidentialReferences } from '@features/workshop/domain/confidential-references';
import { counted } from '@shared/format/counted';
import { AppIcon } from '@shared/icons/app-icon';
import { Button } from '@shared/ui/button';
import { FieldError } from '@shared/ui/field-error';
import { SuggestInput } from '@shared/ui/suggest-input';
import { AdminInsertGuideTool } from './admin-insert-guide-tool';
import type { InsertGuideGroupDraft } from '../insert-guide-draft';

@Component({
  selector: 'details[app-admin-insert-guide-group]',
  imports: [FormField, AppIcon, Button, FieldError, SuggestInput, AdminInsertGuideTool],
  host: {
    'data-testid': 'admin-insert-guide-group',
    class: 'group block min-w-0 rounded-md border border-line',
    '[open]': 'open()',
    '(toggle)': 'syncOpen($event)',
  },
  template: `
    @let block = group();
    @let id = 'insert-guide-g' + rank();
    <summary
      class="flex min-h-11 cursor-pointer list-none items-center gap-3 rounded-md px-4 py-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary [&::-webkit-details-marker]:hidden"
    >
      <app-icon
        name="chevron-right"
        [size]="16"
        class="shrink-0 text-muted group-open:rotate-90 motion-safe:transition-transform"
      />
      <span
        data-testid="admin-insert-guide-group-title"
        class="min-w-0 font-display font-bold [overflow-wrap:anywhere]"
        >{{ title() }}</span
      >
      <span
        data-testid="admin-insert-guide-group-count"
        class="ms-auto shrink-0 text-sm text-muted"
        >{{ count() }}</span
      >
    </summary>

    <div class="grid gap-3 border-t border-line p-4">
      @if (generic()) {
        <p class="field-hint mt-0">Ces outils s'affichent sous chaque matière du guide.</p>
      } @else {
        @let materialError = block.material().touched() && block.material().invalid();
        <div class="max-w-md">
          <label [for]="id + '-material'" class="field-label">Nom de la matière</label>
          <app-suggest-input
            [inputId]="id + '-material'"
            inputTestId="admin-insert-guide-material"
            [formField]="block.material"
            [suggestions]="materialSuggestions()"
            listLabel="Matières déjà saisies"
            [mandatory]="true"
            [markedInvalid]="materialError"
            [describedBy]="materialError ? id + '-material-error' : null"
          />
          <app-field-error
            [field]="block.material"
            [errorId]="id + '-material-error'"
            testId="admin-insert-guide-material-error"
          />
        </div>
        @if (materialReferences(); as found) {
          <p
            data-testid="admin-insert-guide-material-confidential"
            class="rounded-md border border-status-warn/40 bg-status-warn/10 p-3 text-sm"
          >
            Référence repérée&nbsp;: «&nbsp;{{ found }}&nbsp;». Vérifiez qu'elle ne désigne ni une
            pièce, ni un plan, ni un ordre de fabrication.
          </p>
        }
      }

      <div aria-hidden="true" class="tool-row-grid hidden text-xs text-muted lg:grid">
        <span>Opération</span><span>Plaquette</span><span>Rayon (mm)</span><span>Remarque</span>
      </div>
      @for (tool of tools(); track tool.key; let index = $index) {
        <div
          app-admin-insert-guide-tool
          [entry]="tool.field"
          [rank]="index + 1"
          [owner]="owner()"
          [idPrefix]="id + '-t' + (index + 1)"
          [radiusHintId]="radiusHintId()"
          [insertSuggestions]="insertSuggestions()"
          (removed)="toolRemoved.emit(index)"
        ></div>
      }

      <div class="flex flex-wrap gap-x-6 border-t border-line pt-1">
        <button
          appButton
          type="button"
          variant="text"
          [id]="id + '-add-tool'"
          data-testid="admin-insert-guide-add-tool"
          [attr.aria-label]="'Ajouter un outil ' + target()"
          (click)="toolAdded.emit()"
        >
          <app-icon name="plus" [size]="16" />Ajouter un outil
        </button>
        <button
          appButton
          type="button"
          variant="text-danger"
          data-testid="admin-insert-guide-remove-group"
          [attr.aria-label]="removeLabel()"
          (click)="removed.emit()"
        >
          <app-icon name="trash" [size]="16" />{{
            generic() ? 'Retirer le bloc' : 'Retirer la matière'
          }}
        </button>
      </div>
    </div>
  `,
})
export class AdminInsertGuideGroup {
  private readonly host = inject<ElementRef<HTMLDetailsElement>>(ElementRef);

  readonly group = input.required<FieldTree<InsertGuideGroupDraft>>();
  readonly rank = input.required<number>();
  readonly radiusHintId = input.required<string>();
  readonly materialSuggestions = input.required<readonly string[]>();
  readonly insertSuggestions = input.required<readonly string[]>();
  readonly open = model.required<boolean>();
  readonly toolAdded = output<void>();
  readonly toolRemoved = output<number>();
  readonly removed = output<void>();

  protected readonly generic = computed(() => this.group().allMaterials().value());
  private readonly material = computed(() => this.group().material().value().trim());

  protected readonly title = computed(() =>
    this.generic() ? 'Toutes matières' : this.material() || 'Nouvelle matière',
  );
  protected readonly owner = computed(() =>
    this.generic() || this.material() ? this.title() : `bloc ${this.rank()}`,
  );
  protected readonly target = computed(() =>
    this.generic() || this.material() ? `à ${this.title()}` : `au bloc ${this.rank()}`,
  );
  protected readonly removeLabel = computed(() =>
    this.generic()
      ? 'Retirer le bloc Toutes matières'
      : `Retirer la matière ${this.material() || `du bloc ${this.rank()}`}`,
  );

  protected readonly tools = computed(() =>
    Array.from(this.group().tools, (field) => ({ field, key: field().value().key })),
  );
  protected readonly count = computed(() => counted(this.tools().length, 'outil', 'outils'));

  protected readonly materialReferences = computed(() =>
    findConfidentialReferences(this.material()).join(', '),
  );

  // `toggle` ne remonte pas, mais un descendant (popover) peut en émettre un : seul l'hôte compte.
  protected syncOpen(event: Event): void {
    const details = this.host.nativeElement;
    if (event.target === details) this.open.set(details.open);
  }
}
