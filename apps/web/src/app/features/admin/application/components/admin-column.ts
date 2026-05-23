import {
  Directive,
  TemplateRef,
  booleanAttribute,
  input,
  output,
  viewChild,
  ChangeDetectionStrategy,
  Component,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { AppIcon } from '@shared/icons';

/**
 * Base abstraite pour toutes les colonnes admin.
 * Sert de token d'injection pour `contentChildren(AdminColumnBase)` côté table.
 * Chaque sous-classe expose son template + ses metadata via des méthodes
 * (et non via des `input()` typés directement, à cause du contrat strict
 * d'InputSignal qui interdit l'élargissement de type entre base et subclass).
 */
@Directive()
export abstract class AdminColumnBase<T = unknown> {
  abstract getKey(): string;
  abstract getLabel(): string;
  abstract isSortable(): boolean;
  abstract getAlign(): 'left' | 'right';
  abstract getTpl(): TemplateRef<{ $implicit: T }>;
  getSortAccessor(): ((row: T) => unknown) | undefined {
    return undefined;
  }
}

/* ───────────────────── Column: text ───────────────────── */

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

/* ───────────────────── Column: muted text (descriptions, secondary) ───────────────────── */

@Component({
  selector: 'app-admin-col-muted',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: AdminColumnBase, useExisting: AdminColMuted }],
  template: `
    <ng-template #tpl let-row>
      <td class="admin-td text-muted" [class.text-right]="align() === 'right'">
        @if (truncate()) {
          <span class="line-clamp-2 max-w-2xl">{{ accessor()(row) }}</span>
        } @else {
          {{ accessor()(row) }}
        }
      </td>
    </ng-template>
  `,
})
export class AdminColMuted<T> extends AdminColumnBase<T> {
  readonly key = input.required<string>();
  readonly label = input.required<string>();
  readonly sortable = input(false, { transform: booleanAttribute });
  readonly align = input<'left' | 'right'>('left');
  readonly truncate = input(false, { transform: booleanAttribute });
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
}

/* ───────────────────── Column: monospaced (icon names, codes) ───────────────────── */

@Component({
  selector: 'app-admin-col-mono',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: AdminColumnBase, useExisting: AdminColMono }],
  template: `
    <ng-template #tpl let-row>
      <td class="admin-td text-muted font-mono text-xs">
        {{ accessor()(row) }}
      </td>
    </ng-template>
  `,
})
export class AdminColMono<T> extends AdminColumnBase<T> {
  readonly key = input.required<string>();
  readonly label = input.required<string>();
  readonly sortable = input(false, { transform: booleanAttribute });
  readonly align = input<'left' | 'right'>('left');
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
}

/* ───────────────────── Column: numeric (right-aligned, tabular) ───────────────────── */

@Component({
  selector: 'app-admin-col-number',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: AdminColumnBase, useExisting: AdminColNumber }],
  template: `
    <ng-template #tpl let-row>
      <td class="admin-td text-muted tabular-nums w-20">
        {{ accessor()(row) }}
      </td>
    </ng-template>
  `,
})
export class AdminColNumber<T> extends AdminColumnBase<T> {
  readonly key = input.required<string>();
  readonly label = input.required<string>();
  readonly sortable = input(false, { transform: booleanAttribute });
  readonly align = input<'left' | 'right'>('left');
  readonly accessor = input.required<(row: T) => number | null | undefined>();
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

/* ───────────────────── Column: badge (colored chip) ───────────────────── */

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

/* ───────────────────── Column: date ───────────────────── */

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

/* ───────────────────── Column: contact (name + email stacked) ───────────────────── */

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

/* ───────────────────── Column: actions (edit + delete + extras) ───────────────────── */

export type ExtraAction<T> = {
  /** Nom de l'icône AppIcon (ex: 'check', 'pencil', 'trash') */
  readonly icon: string;
  /** Label aria + tooltip */
  readonly label: string;
  /** Handler appelé au clic */
  readonly handler: (row: T) => void;
  /** Visibilité conditionnelle (default: toujours visible) */
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

/* ───────────────────── Column: toggle (boolean switch inline) ───────────────────── */

@Component({
  selector: 'app-admin-col-toggle',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: AdminColumnBase, useExisting: AdminColToggle }],
  template: `
    <ng-template #tpl let-row>
      @let checked = accessor()(row);
      <td class="admin-td">
        <button
          type="button"
          role="switch"
          [attr.aria-checked]="checked"
          [attr.aria-label]="checked ? 'Désactiver' : 'Activer'"
          (click)="onToggle(row, $event)"
          [class]="
            checked
              ? 'bg-primary-bg/80 hover:bg-primary-bg'
              : 'bg-foreground/15 hover:bg-foreground/20'
          "
          class="relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <span
            aria-hidden="true"
            [class]="checked ? 'translate-x-4' : 'translate-x-0.5'"
            class="pointer-events-none inline-block h-4 w-4 self-center transform rounded-full bg-white shadow-sm transition-transform"
          ></span>
        </button>
      </td>
    </ng-template>
  `,
})
export class AdminColToggle<T> extends AdminColumnBase<T> {
  readonly key = input.required<string>();
  readonly label = input.required<string>();
  readonly align = input<'left' | 'right'>('left');
  readonly accessor = input.required<(row: T) => boolean>();
  readonly toggleChange = output<T>();
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

  protected onToggle(row: T, event: Event): void {
    event.stopPropagation();
    this.toggleChange.emit(row);
  }
}

/* ───────────────────── Column: expand chevron ───────────────────── */

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
