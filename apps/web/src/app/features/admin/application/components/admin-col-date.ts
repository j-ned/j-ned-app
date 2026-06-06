import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  booleanAttribute,
  input,
  viewChild,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { AdminColumnBase } from './admin-column-base';

@Component({
  selector: 'app-admin-col-date',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe],
  providers: [{ provide: AdminColumnBase, useExisting: AdminColDate }],
  template: `
    <ng-template #tpl let-row>
      <td class="admin-td text-muted text-xs tabular-nums">
        {{ accessor()(row) | date: format() }}
      </td>
    </ng-template>
  `,
})
export class AdminColDate<T> extends AdminColumnBase<T> {
  readonly key = input.required<string>();
  readonly label = input.required<string>();
  readonly sortable = input(false, { transform: booleanAttribute });
  readonly align = input<'left' | 'right'>('left');
  readonly format = input('dd/MM/yyyy HH:mm');
  readonly accessor = input.required<(row: T) => string | Date | null | undefined>();
  protected readonly _tpl = viewChild.required<TemplateRef<{ $implicit: T }>>('tpl');

  override getKey(): string {
    return this.key();
  }
  override getLabel(): string {
    return this.label();
  }
  override isSortable(): boolean {
    return this.sortable();
  }
  override getAlign(): 'left' | 'right' {
    return this.align();
  }
  override getTpl(): TemplateRef<{ $implicit: T }> {
    return this._tpl();
  }
  override getSortAccessor(): (row: T) => unknown {
    return this.accessor() as (row: T) => unknown;
  }
}
