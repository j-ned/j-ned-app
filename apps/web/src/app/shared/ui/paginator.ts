import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

export type AppPaginatorEvent = {
  readonly first: number;
  readonly page: number;
  readonly rows: number;
};

const ELLIPSIS = -1;

@Component({
  selector: 'app-paginator',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <nav aria-label="Pagination" class="flex items-center gap-1 justify-center">
      <button
        type="button"
        data-testid="paginator-prev"
        class="inline-flex items-center justify-center min-w-11 min-h-11 px-3 rounded-md text-sm border border-foreground/10 hover:bg-foreground/5 disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        [disabled]="currentPage() === 0"
        (click)="goTo(currentPage() - 1)"
        aria-label="Page précédente"
      >‹</button>
      @for (page of visiblePages(); track $index) {
        @if (page === -1) {
          <span class="px-2 text-sm text-muted" aria-hidden="true">…</span>
        } @else {
          <button
            type="button"
            data-testid="paginator-page"
            class="inline-flex items-center justify-center min-w-11 min-h-11 px-3 rounded-md text-sm border border-foreground/10 hover:bg-foreground/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            [class.bg-primary]="page === currentPage()"
            [class.text-white]="page === currentPage()"
            [class.border-primary]="page === currentPage()"
            [attr.aria-current]="page === currentPage() ? 'page' : null"
            (click)="goTo(page)"
          >{{ page + 1 }}</button>
        }
      }
      <button
        type="button"
        data-testid="paginator-next"
        class="inline-flex items-center justify-center min-w-11 min-h-11 px-3 rounded-md text-sm border border-foreground/10 hover:bg-foreground/5 disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        [disabled]="currentPage() >= totalPages() - 1"
        (click)="goTo(currentPage() + 1)"
        aria-label="Page suivante"
      >›</button>
    </nav>
  `,
})
export class AppPaginator {
  readonly rows = input.required<number>();
  readonly totalRecords = input.required<number>();
  readonly first = input.required<number>();
  readonly pageChange = output<AppPaginatorEvent>();

  protected readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.totalRecords() / this.rows())),
  );

  protected readonly currentPage = computed(() => Math.floor(this.first() / this.rows()));

  protected readonly visiblePages = computed<number[]>(() => {
    const total = this.totalPages();
    const current = this.currentPage();
    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i);
    }
    const pages: number[] = [0];
    const start = Math.max(1, current - 1);
    const end = Math.min(total - 2, current + 1);
    if (start > 1) pages.push(ELLIPSIS);
    for (let i = start; i <= end; i++) pages.push(i);
    if (end < total - 2) pages.push(ELLIPSIS);
    pages.push(total - 1);
    return pages;
  });

  protected goTo(page: number): void {
    const rows = this.rows();
    this.pageChange.emit({ first: page * rows, page, rows });
  }
}
