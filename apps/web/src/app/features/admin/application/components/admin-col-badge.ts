import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  booleanAttribute,
  input,
  viewChild,
} from '@angular/core';
import { AdminColumnBase } from './admin-column-base';

export type BadgeTone = 'primary' | 'accent' | 'neutral' | 'success';

@Component({
  selector: 'app-admin-col-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: AdminColumnBase, useExisting: AdminColBadge }],
  template: `
    <ng-template #tpl let-row>
      <td class="admin-td">
        @if (accessor()(row); as val) {
          <span [class]="badgeClass(toneAccessor() ? toneAccessor()!(row) : tone())">
            {{ val }}
          </span>
        } @else {
          <span class="text-muted text-xs">—</span>
        }
      </td>
    </ng-template>
  `,
})
export class AdminColBadge<T> extends AdminColumnBase<T> {
  readonly key = input.required<string>();
  readonly label = input.required<string>();
  readonly sortable = input(false, { transform: booleanAttribute });
  readonly align = input<'left' | 'right'>('left');
  readonly tone = input<BadgeTone>('primary');
  readonly toneAccessor = input<((row: T) => BadgeTone) | undefined>(undefined);
  readonly accessor = input.required<(row: T) => string | null | undefined>();
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

  protected badgeClass(tone: BadgeTone): string {
    const base = 'inline-flex items-center rounded-md px-2 py-1 text-xs font-medium';
    switch (tone) {
      case 'primary':
        return `${base} bg-primary-bg/15 text-primary`;
      case 'accent':
        return `${base} bg-accent/15 text-accent`;
      case 'success':
        return `${base} bg-status-success/15 text-status-success`;
      case 'neutral':
      default:
        return `${base} bg-foreground/8 text-foreground/80`;
    }
  }
}
