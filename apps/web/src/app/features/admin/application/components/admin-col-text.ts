import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  booleanAttribute,
  input,
  viewChild,
} from '@angular/core';
import { AdminColumnBase } from './admin-column-base';

@Component({
  selector: 'app-admin-col-text',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: AdminColumnBase, useExisting: AdminColText }],
  template: `
    <ng-template #tpl let-row>
      <td class="admin-td" [class.font-medium]="bold()" [class.text-right]="align() === 'right'">
        {{ accessor()(row) }}
      </td>
    </ng-template>
  `,
})
export class AdminColText<T> extends AdminColumnBase<T> {
  readonly key = input.required<string>();
  readonly label = input.required<string>();
  readonly sortable = input(false, { transform: booleanAttribute });
  readonly align = input<'left' | 'right'>('left');
  readonly bold = input(false, { transform: booleanAttribute });
  readonly accessor = input.required<(row: T) => string | number | null | undefined>();
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
