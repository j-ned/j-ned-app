import { ChangeDetectionStrategy, Component, TemplateRef, input, viewChild } from '@angular/core';
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
        @let expanded = isExpanded()(row);
        <button
          type="button"
          data-testid="message-expand"
          [attr.aria-expanded]="expanded"
          [attr.aria-controls]="controlsId()(row)"
          (click)="toggle()(row)"
          class="inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-md text-muted transition-colors hover:bg-foreground/5 hover:text-foreground"
        >
          <app-icon [name]="expanded ? 'chevron-down' : 'chevron-right'" [size]="12" />
          <span class="sr-only">{{ buttonLabel()(row, expanded) }}</span>
        </button>
      </td>
    </ng-template>
  `,
})
export class AdminColExpand<T> extends AdminColumnBase<T> {
  readonly key = input<string>('__expand');
  readonly label = input<string>('Détail');
  readonly align = input<'left' | 'right'>('left');
  readonly isExpanded = input.required<(row: T) => boolean>();
  readonly toggle = input.required<(row: T) => void>();
  readonly buttonLabel = input.required<(row: T, expanded: boolean) => string>();
  readonly controlsId = input.required<(row: T) => string>();
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
  override isLabelHidden(): boolean {
    return true;
  }
  override getTpl(): TemplateRef<{ $implicit: T }> {
    return this._tpl();
  }
}
