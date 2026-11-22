import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { SKIP_ERROR_TOAST } from '@core/interceptors/skip-error-toast';
import { API_BASE_URL } from '@shared/api/api-config';
import { OPTIONAL_UPSTREAM } from '@core/ssr/ssr-upstream-interceptor';
import {
  makeAdminComment,
  makeCommentDraft,
  makePublishedComment,
  makePublishedReply,
  makePublishedThread,
  toAdminCommentDto,
  toPublicCommentPageDto,
} from '../testing/comment-builders';
import { ModerationError } from '../domain/moderation-error';
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

describe('CommentsGateway: écritures de l’admin', () => {
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

  const reasonOf = (error: unknown): unknown =>
    error instanceof ModerationError ? error.reason : error;

  it('Given a pending comment When it is published Then the API is asked to publish it, silently, and the published comment comes back', async () => {
    const published = makeAdminComment({ id: 'c-7', status: 'published' });
    const result = firstValueFrom(gateway.publish('c-7'));

    const req = http.expectOne('/api/blog/comments/c-7');
    const sent = {
      method: req.request.method,
      body: req.request.body,
      silent: req.request.context.get(SKIP_ERROR_TOAST),
    };
    req.flush(toAdminCommentDto(published));

    expect({ sent, result: await result }).toEqual({
      sent: { method: 'PATCH', body: { status: 'published' }, silent: true },
      result: published,
    });
  });

  it.each([
    { status: 404, reason: 'not-found' },
    { status: 409, reason: 'conflict' },
    { status: 500, reason: 'failed' },
    { status: 0, reason: 'failed' },
  ] as const)(
    'Given the API answers $status When a comment is published Then the failure is a moderation error « $reason »',
    async ({ status, reason }) => {
      const result = firstValueFrom(gateway.publish('c-7')).catch(reasonOf);

      http.expectOne('/api/blog/comments/c-7').flush('nope', { status, statusText: 'Nope' });

      expect(await result).toBe(reason);
    },
  );
});

describe('CommentsGateway: suppression', () => {
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

  it('Given a comment When it is removed Then the API is asked to delete it, silently', async () => {
    const done = firstValueFrom(gateway.remove('c-7'), { defaultValue: 'completed' });

    const req = http.expectOne('/api/blog/comments/c-7');
    const sent = { method: req.request.method, silent: req.request.context.get(SKIP_ERROR_TOAST) };
    req.flush(null, { status: 204, statusText: 'No Content' });

    expect({ sent, done: await done }).toEqual({
      sent: { method: 'DELETE', silent: true },
      done: null,
    });
  });

  it.each([
    { status: 404, reason: 'not-found' },
    { status: 500, reason: 'failed' },
  ] as const)(
    'Given the API answers $status When a comment is removed Then the failure is a moderation error « $reason »',
    async ({ status, reason }) => {
      const result = firstValueFrom(gateway.remove('c-7')).catch((error: unknown) =>
        error instanceof ModerationError ? error.reason : error,
      );

      http.expectOne('/api/blog/comments/c-7').flush('nope', { status, statusText: 'Nope' });

      expect(await result).toBe(reason);
    },
  );
});

describe('CommentsGateway: réponse du propriétaire', () => {
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

  it('Given a published comment When the owner replies Then the reply is posted silently and comes back published', async () => {
    const reply = makeAdminComment({
      id: 'c-8',
      author: { kind: 'owner' },
      status: 'published',
      parent: { id: 'c-7', author: { kind: 'visitor', name: 'Camille' }, excerpt: 'Merci' },
    });
    const result = firstValueFrom(gateway.reply('c-7', 'Avec plaisir'));

    const req = http.expectOne('/api/blog/comments/c-7/replies');
    const sent = {
      method: req.request.method,
      body: req.request.body,
      silent: req.request.context.get(SKIP_ERROR_TOAST),
    };
    req.flush(toAdminCommentDto(reply), { status: 201, statusText: 'Created' });

    expect({ sent, result: await result }).toEqual({
      sent: { method: 'POST', body: { body: 'Avec plaisir' }, silent: true },
      result: reply,
    });
  });

  it.each([
    { status: 404, reason: 'not-found' },
    { status: 409, reason: 'conflict' },
    { status: 400, reason: 'failed' },
  ] as const)(
    'Given the API answers $status When the owner replies Then the failure is a moderation error « $reason »',
    async ({ status, reason }) => {
      const result = firstValueFrom(gateway.reply('c-7', 'Oui')).catch((error: unknown) =>
        error instanceof ModerationError ? error.reason : error,
      );

      http
        .expectOne('/api/blog/comments/c-7/replies')
        .flush('nope', { status, statusText: 'Nope' });

      expect(await result).toBe(reason);
    },
  );
});

describe('CommentsGateway: lecture publique', () => {
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

  it('Given an article When its comments are read Then the first 100 are asked for and come back with their replies', async () => {
    const thread = makePublishedThread({
      comments: [makePublishedComment({ replies: [makePublishedReply()] })],
    });
    const read = firstValueFrom(gateway.getThread('article-temoin'));

    http
      .expectOne('/api/blog/posts/article-temoin/comments?page=1&limit=100')
      .flush(toPublicCommentPageDto(thread));

    await expect(read).resolves.toEqual(thread);
  });

  it('Given the section shows its own error When the comments are read Then a failure raises no toast and does not fail the article render', () => {
    gateway.getThread('article-temoin').subscribe({ error: () => undefined });

    const req = http.expectOne('/api/blog/posts/article-temoin/comments?page=1&limit=100');
    expect({
      silent: req.request.context.get(SKIP_ERROR_TOAST),
      optional: req.request.context.get(OPTIONAL_UPSTREAM),
    }).toEqual({ silent: true, optional: true });
    req.flush(null, { status: 500, statusText: 'Boom' });
  });

  it('Given a comment When it is sent Then the API receives the name, the e-mail, the text and the trap field, and the acceptance is a success', async () => {
    const draft = makeCommentDraft();
    const result = firstValueFrom(gateway.submit('article-temoin', draft, null));

    const req = http.expectOne('/api/blog/posts/article-temoin/comments');
    const sent = {
      method: req.request.method,
      body: req.request.body,
      silent: req.request.context.get(SKIP_ERROR_TOAST),
    };
    req.flush(null, { status: 202, statusText: 'Accepted' });

    expect({ sent, result: await result }).toEqual({
      sent: {
        method: 'POST',
        body: {
          name: 'Camille',
          email: 'camille@example.test',
          body: 'Merci pour cet article.',
          website: '',
        },
        silent: true,
      },
      result: { success: true },
    });
  });

  it('Given a reply to a published comment When it is sent Then the parent is named in the body', () => {
    gateway.submit('article-temoin', makeCommentDraft(), 'c-7').subscribe();

    const req = http.expectOne('/api/blog/posts/article-temoin/comments');
    expect(req.request.body).toMatchObject({ parentId: 'c-7' });
    req.flush(null, { status: 202, statusText: 'Accepted' });
  });

  it.each([
    { status: 429, error: 'rate-limited' },
    { status: 503, error: 'closed' },
    { status: 404, error: 'not-found' },
  ] as const)(
    'Given the API answers $status When a comment is sent Then the refusal comes back as « $error », never as an error',
    async ({ status, error }) => {
      const result = firstValueFrom(gateway.submit('article-temoin', makeCommentDraft(), null));

      http
        .expectOne('/api/blog/posts/article-temoin/comments')
        .flush({ message: 'Refus' }, { status, statusText: 'Refused' });

      await expect(result).resolves.toEqual({ success: false, error });
    },
  );

  it('Given the network is down When a comment is sent Then the refusal is « network »', async () => {
    const result = firstValueFrom(gateway.submit('article-temoin', makeCommentDraft(), null));

    http.expectOne('/api/blog/posts/article-temoin/comments').error(new ProgressEvent('error'));

    await expect(result).resolves.toEqual({ success: false, error: 'network' });
  });
});
