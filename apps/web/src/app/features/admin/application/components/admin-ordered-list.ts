import { NgTemplateOutlet } from '@angular/common';
import {
  Component,
  ElementRef,
  Injector,
  TemplateRef,
  afterNextRender,
  computed,
  contentChild,
  inject,
  input,
  linkedSignal,
} from '@angular/core';
import type { FieldTree } from '@angular/forms/signals';
import { moveItem } from '@shared/collections/move-item';
import { AppIcon } from '@shared/icons/app-icon';
import { Button } from '@shared/ui/button';
import { FieldError } from '@shared/ui/field-error';

export type OrderedListConfig<T> = {
  readonly testIdPrefix: string;
  readonly item: string;
  readonly moved: string;
  readonly added: string;
  readonly removed: string;
  readonly add: string;
  readonly max: number;
  readonly create: () => T;
  readonly trackKey: (row: T) => string;
  readonly label?: string;
  readonly labelVisible?: boolean;
};

type Announcement = { readonly text: string };

type RowAction = 'up' | 'down' | 'remove';

@Component({
  selector: 'app-admin-ordered-list',
  imports: [NgTemplateOutlet, AppIcon, Button, FieldError],
  host: { class: 'grid gap-3' },
  template: `
    @let settings = config();
    @let prefix = settings.testIdPrefix;
    @if (settings.label && settings.labelVisible !== false) {
      <p [id]="prefix + '-label'" class="field-label">{{ settings.label }}</p>
    }
    <ol
      class="grid gap-3"
      [attr.aria-labelledby]="
        settings.label && settings.labelVisible !== false ? prefix + '-label' : null
      "
      [attr.aria-label]="settings.label && settings.labelVisible === false ? settings.label : null"
    >
      @for (item of items(); track item.key; let index = $index, first = $first, last = $last) {
        @let rank = index + 1;
        <li
          [attr.data-testid]="prefix + '-row'"
          class="grid gap-3 rounded-md border border-line p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start"
        >
          <div class="grid min-w-0 gap-3">
            <ng-container
              [ngTemplateOutlet]="rowTemplate()"
              [ngTemplateOutletContext]="{ $implicit: item.row, rank }"
            />
          </div>
          <div class="flex flex-wrap justify-end">
            @if (!first) {
              <button
                appButton
                type="button"
                variant="text-muted"
                size="icon"
                [attr.data-testid]="prefix + '-up'"
                [attr.aria-label]="'Monter ' + settings.item + ' ' + rank"
                (click)="move(index, -1)"
              >
                <app-icon name="arrow-up" [size]="16" />
              </button>
            }
            @if (!last) {
              <button
                appButton
                type="button"
                variant="text-muted"
                size="icon"
                [attr.data-testid]="prefix + '-down'"
                [attr.aria-label]="'Descendre ' + settings.item + ' ' + rank"
                (click)="move(index, 1)"
              >
                <app-icon name="arrow-down" [size]="16" />
              </button>
            }
            <button
              appButton
              type="button"
              variant="text-danger"
              size="icon"
              [attr.data-testid]="prefix + '-remove'"
              [attr.aria-label]="'Supprimer ' + settings.item + ' ' + rank"
              (click)="remove(index)"
            >
              <app-icon name="trash" [size]="16" />
            </button>
          </div>
        </li>
      }
    </ol>
    <app-field-error [field]="rows()" [errorId]="prefix + '-error'" [testId]="prefix + '-error'" />
    <button
      appButton
      type="button"
      variant="text"
      [attr.data-testid]="prefix + '-add'"
      [attr.aria-disabled]="full() ? 'true' : null"
      class="justify-self-start aria-disabled:cursor-not-allowed aria-disabled:opacity-50"
      (click)="add()"
    >
      <app-icon name="plus" [size]="16" />{{ settings.add }}
    </button>
    <p [attr.data-testid]="prefix + '-announcer'" role="status" class="sr-only">
      @for (message of announcement(); track message) {
        <span>{{ message.text }}</span>
      }
    </p>
  `,
})
export class AdminOrderedList<T extends object> {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);

  readonly rows = input.required<FieldTree<T[]>>();
  readonly config = input.required<OrderedListConfig<T>>();

  protected readonly rowTemplate = contentChild.required(TemplateRef);

  protected readonly items = computed(() => {
    const { trackKey } = this.config();
    return Array.from(this.rows(), (row) => ({ row, key: trackKey(row().value()) }));
  });
  protected readonly full = computed(() => this.items().length >= this.config().max);
  private ownWrite: readonly T[] | null = null;
  // Nouvel objet par action (même phrase réannoncée) ; toute autre écriture de la liste la vide.
  protected readonly announcement = linkedSignal<readonly T[], readonly Announcement[]>({
    source: () => this.rows()().value(),
    computation: (rows, previous) => (rows === this.ownWrite ? (previous?.value ?? []) : []),
  });

  protected move(index: number, delta: -1 | 1): void {
    const target = index + delta;
    const [same, opposite]: RowAction[] = delta < 0 ? ['up', 'down'] : ['down', 'up'];
    this.write(moveItem(this.rows()().value(), index, delta));
    this.announce(`${this.config().moved} en position ${target + 1}`);
    this.focusAfterRender(() => this.action(target, same) ?? this.action(target, opposite));
  }

  protected add(): void {
    if (this.full()) return;
    const position = this.items().length;
    this.write([...this.rows()().value(), this.config().create()]);
    this.announce(`${this.config().added} en position ${position + 1}`);
    this.focusAfterRender(
      () =>
        this.rowElements()[position]?.querySelector<HTMLElement>('input, textarea, select') ?? null,
    );
  }

  protected remove(index: number): void {
    this.write(
      this.rows()()
        .value()
        .filter((_, i) => i !== index),
    );
    this.announce(this.config().removed);
    this.focusAfterRender(() => this.action(index, 'remove') ?? this.addButton());
  }

  private write(rows: T[]): void {
    this.ownWrite = rows;
    this.rows()().value.set(rows);
  }

  private announce(text: string): void {
    this.announcement.set([{ text }]);
  }

  private rowElements(): readonly HTMLElement[] {
    return [
      ...this.host.nativeElement.querySelectorAll<HTMLElement>(
        `[data-testid="${this.config().testIdPrefix}-row"]`,
      ),
    ];
  }

  private action(index: number, action: RowAction): HTMLElement | null {
    return (
      this.rowElements()[index]?.querySelector<HTMLElement>(
        `[data-testid="${this.config().testIdPrefix}-${action}"]`,
      ) ?? null
    );
  }

  private addButton(): HTMLElement | null {
    return this.host.nativeElement.querySelector<HTMLElement>(
      `[data-testid="${this.config().testIdPrefix}-add"]`,
    );
  }

  private focusAfterRender(target: () => HTMLElement | null): void {
    afterNextRender({ write: () => target()?.focus() }, { injector: this.injector });
  }
}
