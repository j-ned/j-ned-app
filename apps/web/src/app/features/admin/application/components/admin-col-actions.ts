import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  booleanAttribute,
  input,
  output,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { AppIcon } from '@shared/icons/app-icon';
import { AdminColumnBase } from './admin-column-base';

export type ExtraAction<T> = {
  readonly icon: string;
  readonly label: string;
  readonly handler: (row: T) => void;
  readonly visible?: (row: T) => boolean;
};

@Component({
  selector: 'app-admin-col-actions',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, AppIcon],
  providers: [{ provide: AdminColumnBase, useExisting: AdminColActions }],
  template: `
    <ng-template #tpl let-row>
      <td class="admin-td text-right">
        <div class="flex items-center justify-end gap-1">
          @for (extra of visibleExtras(row); track extra.label) {
            <button
              type="button"
              (click)="onExtraClick(extra, row, $event)"
              [attr.aria-label]="extra.label"
              [title]="extra.label"
              class="admin-icon-btn"
            >
              <app-icon [name]="extra.icon" [size]="20" />
            </button>
          }
          @if (editRoute(); as editFn) {
            <a
              [routerLink]="editFn(row)"
              aria-label="Modifier"
              class="admin-icon-btn"
              (click)="$event.stopPropagation()"
            >
              <app-icon name="pencil" [size]="20" />
            </a>
          }
          @if (!hideDelete()) {
            <button
              type="button"
              (click)="onDeleteClick(row, $event)"
              aria-label="Supprimer"
              class="admin-icon-btn-danger"
            >
              <app-icon name="trash" [size]="20" />
            </button>
          }
        </div>
      </td>
    </ng-template>
  `,
})
export class AdminColActions<T> extends AdminColumnBase<T> {
  readonly key = input<string>('__actions');
  readonly label = input<string>('Actions');
  readonly align = input<'left' | 'right'>('right');
  readonly editRoute = input<((row: T) => readonly string[]) | undefined>(undefined);
  readonly hideDelete = input(false, { transform: booleanAttribute });
  readonly extraActions = input<readonly ExtraAction<T>[]>([]);
  readonly delete = output<T>();
  protected readonly _tpl = viewChild.required<TemplateRef<{ $implicit: T }>>('tpl');

  override getKey(): string {
    return this.key();
  }
  override getLabel(): string {
    return this.label();
  }
  override isSortable(): boolean {
    return false;
  }
  override getAlign(): 'left' | 'right' {
    return this.align();
  }
  override getTpl(): TemplateRef<{ $implicit: T }> {
    return this._tpl();
  }

  protected visibleExtras(row: T): readonly ExtraAction<T>[] {
    return this.extraActions().filter((a) => (a.visible ? a.visible(row) : true));
  }

  protected onExtraClick(extra: ExtraAction<T>, row: T, event: Event): void {
    event.stopPropagation();
    extra.handler(row);
  }

  protected onDeleteClick(row: T, event: Event): void {
    event.stopPropagation();
    this.delete.emit(row);
  }
}
