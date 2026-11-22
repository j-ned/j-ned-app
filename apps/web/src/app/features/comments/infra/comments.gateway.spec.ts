import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { SKIP_ERROR_TOAST } from '@core/interceptors/skip-error-toast';
import { API_BASE_URL } from '@shared/api/api-config';
import { makeAdminComment, toAdminCommentDto } from '../testing/comment-builders';
import { CommentsGateway } from './comments.gateway';

const PENDING_COUNT_URL = '/api/blog/comments/pending-count';

describe('CommentsGateway: lectures de l’admin', () => {
  let gateway: CommentsGateway;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: '/api' },
      ],
    });
    gateway = TestBed.inject(CommentsGateway);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it.each(['pending', 'published'] as const)(
    'Given the %s filter on page 2 When the queue is read Then the API is asked for that status and page, and the comments come back with the total',
    async (status) => {
      const comment = makeAdminComment({ status });
      const page = firstValueFrom(gateway.getAdminPage(status, 2, 20));

      const req = http.expectOne(`/api/blog/comments?status=${status}&page=2&limit=20`);
      expect(req.request.method).toBe('GET');
      req.flush({ data: [toAdminCommentDto(comment)], total: 21, page: 2, limit: 20 });

      await expect(page).resolves.toEqual({ comments: [comment], total: 21 });
    },
  );

  it('Given the admin page shows its own error state When the queue is read Then a failure raises no toast', () => {
    gateway.getAdminPage('pending', 1, 20).subscribe();

    const req = http.expectOne('/api/blog/comments?status=pending&page=1&limit=20');
    expect(req.request.context.get(SKIP_ERROR_TOAST)).toBe(true);
    req.flush({ data: [], total: 0, page: 1, limit: 20 });
  });

  it('Given 4 comments awaiting moderation When the pending count is read Then it comes back as a number', async () => {
    const count = firstValueFrom(gateway.getPendingCount());

    http.expectOne(PENDING_COUNT_URL).flush({ count: 4 });

    await expect(count).resolves.toBe(4);
  });

  it('Given the pending count was read When it is invalidated Then its readers receive the new count', () => {
    const counts: number[] = [];
    const subscription = gateway.getPendingCount().subscribe((count) => counts.push(count));
    http.expectOne(PENDING_COUNT_URL).flush({ count: 4 });

    gateway.invalidatePendingCount();
    http.expectOne(PENDING_COUNT_URL).flush({ count: 3 });
    subscription.unsubscribe();

    expect(counts).toEqual([4, 3]);
  });

  it('Given the first read of the pending count fails silently When it is retried Then the retry may toast and its count is kept', async () => {
    const count = firstValueFrom(gateway.getPendingCount());

    const first = http.expectOne(PENDING_COUNT_URL);
    const silent = first.request.context.get(SKIP_ERROR_TOAST);
    first.flush('down', { status: 500, statusText: 'Error' });
    const retry = http.expectOne(PENDING_COUNT_URL);
    const retrySilent = retry.request.context.get(SKIP_ERROR_TOAST);
    retry.flush({ count: 2 });

    expect({ silent, retrySilent, count: await count }).toEqual({
      silent: true,
      retrySilent: false,
      count: 2,
    });
  });
});
