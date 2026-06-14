import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  input,
  viewChild,
} from '@angular/core';
import { AppIcon } from '@shared/icons/app-icon';
import { AdminColumnBase } from './admin-column-base';

@Component({
  selector: 'app-admin-col-expand',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AppIcon],
  providers: [{ provide: AdminColumnBase, useExisting: AdminColExpand }],
  template: `
    <ng-template #tpl let-row>
      <td class="admin-td w-12">
        @if (isExpanded()(row)) {
          <app-icon name="chevron-down" [size]="12" class="text-muted" />
        } @else {
          <app-icon name="chevron-right" [size]="12" class="text-muted" />
        }
      </td>
    </ng-template>
  `,
})
export class AdminColExpand<T> extends AdminColumnBase<T> {
  readonly key = input<string>('__expand');
  readonly label = input<string>('');
  readonly align = input<'left' | 'right'>('left');
  readonly isExpanded = input.required<(row: T) => boolean>();
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
}
