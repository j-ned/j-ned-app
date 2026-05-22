import { TestBed } from '@angular/core/testing';
import { AppPaginator, type AppPaginatorEvent } from './paginator';

describe('AppPaginator', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [AppPaginator] });
  });

  function renderPaginator(props: { rows: number; totalRecords: number; first: number }) {
    const fixture = TestBed.createComponent(AppPaginator);
    fixture.componentRef.setInput('rows', props.rows);
    fixture.componentRef.setInput('totalRecords', props.totalRecords);
    fixture.componentRef.setInput('first', props.first);
    fixture.detectChanges();
    return fixture;
  }

  it('emits pageChange with {first, page, rows} when Next is clicked', () => {
    const fixture = renderPaginator({ rows: 10, totalRecords: 100, first: 0 });
    let received: AppPaginatorEvent | undefined;
    fixture.componentInstance.pageChange.subscribe((e) => (received = e));

    const next = fixture.nativeElement.querySelector('[data-testid="paginator-next"]') as HTMLButtonElement;
    next.click();

    expect(received).toEqual({ first: 10, page: 1, rows: 10 });
  });

  it('emits pageChange with {first, page, rows} when Prev is clicked from page 1', () => {
    const fixture = renderPaginator({ rows: 10, totalRecords: 100, first: 10 });
    let received: AppPaginatorEvent | undefined;
    fixture.componentInstance.pageChange.subscribe((e) => (received = e));

    const prev = fixture.nativeElement.querySelector('[data-testid="paginator-prev"]') as HTMLButtonElement;
    prev.click();

    expect(received).toEqual({ first: 0, page: 0, rows: 10 });
  });

  it('disables Prev on the first page', () => {
    const fixture = renderPaginator({ rows: 10, totalRecords: 30, first: 0 });
    const prev = fixture.nativeElement.querySelector('[data-testid="paginator-prev"]') as HTMLButtonElement;
    expect(prev.disabled).toBe(true);
  });

  it('disables Next on the last page', () => {
    const fixture = renderPaginator({ rows: 10, totalRecords: 30, first: 20 });
    const next = fixture.nativeElement.querySelector('[data-testid="paginator-next"]') as HTMLButtonElement;
    expect(next.disabled).toBe(true);
  });

  it('shows all page buttons when totalPages <= 7', () => {
    const fixture = renderPaginator({ rows: 10, totalRecords: 50, first: 0 });
    const pageButtons = fixture.nativeElement.querySelectorAll('[data-testid="paginator-page"]');
    expect(pageButtons.length).toBe(5);
  });

  it('shows ellipsis when totalPages > 7', () => {
    const fixture = renderPaginator({ rows: 10, totalRecords: 200, first: 100 });
    const text = fixture.nativeElement.textContent ?? '';
    expect(text).toContain('…');
  });

  it('marks the current page with aria-current="page"', () => {
    const fixture = renderPaginator({ rows: 10, totalRecords: 30, first: 10 });
    const current = fixture.nativeElement.querySelector('button[aria-current="page"]') as HTMLButtonElement;
    expect(current).not.toBeNull();
    expect(current.textContent?.trim()).toBe('2');
  });
});
