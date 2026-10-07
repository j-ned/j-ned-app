import {
  Component,
  ChangeDetectionStrategy,
  computed,
  contentChild,
  contentChildren,
  input,
  signal,
  TemplateRef,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { AdminColumnBase } from './admin-column-base';
import { AppIcon } from '@shared/icons/app-icon';

type SortDir = 'asc' | 'desc';

@Component({
  selector: 'app-admin-table',
  imports: [NgTemplateOutlet, AppIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <ng-content />

    @if (sortedItems().length === 0) {
      <div class="admin-empty">{{ emptyMessage() }}</div>
    } @else {
      <div class="admin-table-shell">
        <table class="admin-table">
          <thead>
            <tr>
              @for (col of columns(); track col.getKey()) {
                @if (col.isSortable()) {
                  <th
                    scope="col"
                    class="admin-th-sortable"
                    [class.text-right]="col.getAlign() === 'right'"
                    [attr.aria-sort]="ariaSortFor(col.getKey())"
                  >
                    <button
                      type="button"
                      [attr.data-testid]="'sort-' + col.getKey()"
                      (click)="toggleSort(col)"
                      class="inline-flex min-h-11 cursor-pointer items-center gap-1.5 uppercase"
                    >
                      {{ col.getLabel() }}
                      @if (sortKey() === col.getKey()) {
                        @if (sortDir() === 'asc') {
                          <app-icon name="sort-up-fill" [size]="12" class="text-primary" />
                        } @else {
                          <app-icon name="sort-down-fill" [size]="12" class="text-primary" />
                        }
                      } @else {
                        <app-icon name="sort" [size]="12" class="opacity-40" />
                      }
                    </button>
                  </th>
                } @else {
                  <th scope="col" class="admin-th" [class.text-right]="col.getAlign() === 'right'">
                    <span [class.sr-only]="col.isLabelHidden()">{{ col.getLabel() }}</span>
                  </th>
                }
              }
            </tr>
          </thead>
          <tbody>
            @for (row of pagedItems(); track trackId(row); let idx = $index) {
              <tr [class]="rowClass()(row, idx)">
                @for (col of columns(); track col.getKey()) {
                  <ng-container *ngTemplateOutlet="col.getTpl(); context: { $implicit: row }" />
                }
              </tr>
              @if (isExpanded(row) && expandedTpl()) {
                <ng-container *ngTemplateOutlet="expandedTpl()!; context: { $implicit: row }" />
              }
            }
          </tbody>
        </table>
      </div>

      @if (totalPages() > 1) {
        <nav class="mt-4 flex items-center justify-between gap-3 text-sm" aria-label="Pagination">
          <p class="text-xs text-muted">
            {{ rangeStart() }}–{{ rangeEnd() }} sur {{ sortedItems().length }}
          </p>
          <div class="flex items-center gap-1">
            <button
              type="button"
              class="admin-pager-btn"
              [disabled]="currentPage() === 1"
              (click)="goToPage(currentPage() - 1)"
              aria-label="Page précédente"
            >
              <app-icon name="chevron-left" [size]="20" />
            </button>
            @for (p of pages(); track p) {
              <button
                type="button"
                [class]="p === currentPage() ? 'admin-pager-btn-active' : 'admin-pager-btn'"
                (click)="goToPage(p)"
                [attr.aria-current]="p === currentPage() ? 'page' : null"
              >
                {{ p }}
              </button>
            }
            <button
              type="button"
              class="admin-pager-btn"
              [disabled]="currentPage() === totalPages()"
              (click)="goToPage(currentPage() + 1)"
              aria-label="Page suivante"
            >
              <app-icon name="chevron-right" [size]="20" />
            </button>
          </div>
        </nav>
      }
    }
  `,
})
export class AdminTable<T extends { id?: string | number }> {
  readonly items = input<readonly T[]>([]);
  readonly emptyMessage = input<string>('Aucun élément');
  readonly pageSize = input<number>(10);
  readonly defaultSort = input<{ key: string; dir?: SortDir } | undefined>(undefined);
  readonly expandedIds = input<ReadonlySet<string | number>>(new Set());
  readonly rowClass = input<(row: T, idx: number) => string>(
    (_row: T, _idx: number): string => 'admin-row',
  );

  protected readonly columns = contentChildren<AdminColumnBase<T>>(AdminColumnBase);
  protected readonly expandedTpl = contentChild<TemplateRef<unknown>>('expandedRow');

  protected readonly sortKey = signal<string | null>(null);
  protected readonly sortDir = signal<SortDir>('asc');
  protected readonly currentPage = signal(1);

  constructor() {
    queueMicrotask(() => {
      const initial = this.defaultSort();
      if (initial && this.sortKey() === null) {
        this.sortKey.set(initial.key);
        this.sortDir.set(initial.dir ?? 'asc');
      }
    });
  }

  protected readonly sortedItems = computed<readonly T[]>(() => {
    const list = [...(this.items() ?? [])];
    const key = this.sortKey();
    if (!key) return list;
    const col = this.columns().find((c) => c.getKey() === key);
    if (!col) return list;
    const dir = this.sortDir() === 'asc' ? 1 : -1;
    const accessor: (row: T) => unknown =
      col.getSortAccessor() ?? ((row: T): unknown => (row as Record<string, unknown>)[key]);
    return list.sort((a, b) => {
      const av = accessor(a);
      const bv = accessor(b);
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir;
      return String(av).localeCompare(String(bv), 'fr', { numeric: true }) * dir;
    });
  });

  protected readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.sortedItems().length / this.pageSize())),
  );

  protected readonly pagedItems = computed<readonly T[]>(() => {
    const size = this.pageSize();
    const total = this.totalPages();
    const page = Math.min(this.currentPage(), total);
    const start = (page - 1) * size;
    return this.sortedItems().slice(start, start + size);
  });

  protected readonly rangeStart = computed(() =>
    this.sortedItems().length === 0 ? 0 : (this.currentPage() - 1) * this.pageSize() + 1,
  );

  protected readonly rangeEnd = computed(() =>
    Math.min(this.currentPage() * this.pageSize(), this.sortedItems().length),
  );

  protected readonly pages = computed<readonly number[]>(() => {
    const total = this.totalPages();
    return Array.from({ length: total }, (_, i) => i + 1);
  });

  protected toggleSort(col: AdminColumnBase<T>): void {
    const key = col.getKey();
    if (this.sortKey() === key) {
      this.sortDir.update((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      this.sortKey.set(key);
      this.sortDir.set('asc');
    }
    this.currentPage.set(1);
  }

  protected ariaSortFor(key: string): 'ascending' | 'descending' | null {
    if (this.sortKey() !== key) return null;
    return this.sortDir() === 'asc' ? 'ascending' : 'descending';
  }

  protected goToPage(page: number): void {
    const clamped = Math.max(1, Math.min(page, this.totalPages()));
    this.currentPage.set(clamped);
  }

  protected isExpanded(row: T): boolean {
    const id = row.id;
    if (id == null) return false;
    return this.expandedIds().has(id);
  }

  protected trackId(row: T): unknown {
    return row.id ?? row;
  }
}
