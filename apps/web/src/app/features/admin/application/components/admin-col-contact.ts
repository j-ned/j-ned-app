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
  selector: 'app-admin-col-contact',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: AdminColumnBase, useExisting: AdminColContact }],
  template: `
    <ng-template #tpl let-row>
      <td class="admin-td">
        <div class="font-medium text-foreground">{{ nameAccessor()(row) }}</div>
        <div class="text-xs text-muted">{{ subAccessor()(row) }}</div>
      </td>
    </ng-template>
  `,
})
export class AdminColContact<T> extends AdminColumnBase<T> {
  readonly key = input.required<string>();
  readonly label = input.required<string>();
  readonly sortable = input(false, { transform: booleanAttribute });
  readonly align = input<'left' | 'right'>('left');
  readonly nameAccessor = input.required<(row: T) => string>();
  readonly subAccessor = input.required<(row: T) => string>();
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
    return this.nameAccessor() as (row: T) => unknown;
  }
}
