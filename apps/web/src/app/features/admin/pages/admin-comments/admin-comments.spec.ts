import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import type { Mock } from 'vitest';
import { ToastStore } from '@core/notifications/toast-store';
import type { AdminComment } from '@features/comments/domain/models/comment.model';
import { makeAdminComment, toAdminCommentDto } from '@features/comments/testing/comment-builders';
import { API_BASE_URL } from '@shared/api/api-config';
import { byTestId, testIdText } from '@shared/testing/by-test-id';
import { normalized } from '@shared/testing/normalized-text';
import { pressTestId } from '@shared/testing/press-test-id';
import { settleBounded } from '@shared/testing/settle';
import type { ToastMessage } from '@shared/ui/toast.types';
import { AdminComments } from './admin-comments';

type Status = 'pending' | 'published';

const listUrl = (status: Status, page = 1): string =>
  `/api/blog/comments?status=${status}&page=${page}&limit=20`;

type Rendered = {
  readonly fixture: ComponentFixture<AdminComments>;
  readonly host: HTMLElement;
  readonly http: HttpTestingController;
  readonly toast: { readonly add: Mock<(message: ToastMessage) => void> };
};

async function render(): Promise<Rendered> {
  const toast = { add: vi.fn<(message: ToastMessage) => void>() };
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      provideHttpClient(),
      provideHttpClientTesting(),
      { provide: API_BASE_URL, useValue: '/api' },
      { provide: ToastStore, useValue: toast },
    ],
  });
  const fixture = TestBed.createComponent(AdminComments);
  await settleBounded(fixture);
  return {
    fixture,
    host: fixture.nativeElement as HTMLElement,
    http: TestBed.inject(HttpTestingController),
    toast,
  };
}

async function answer(
  { fixture, http }: Rendered,
  status: Status,
  comments: readonly AdminComment[],
  { page = 1, total = comments.length }: { readonly page?: number; readonly total?: number } = {},
): Promise<void> {
  http
    .expectOne(listUrl(status, page))
    .flush({ data: comments.map(toAdminCommentDto), total, page, limit: 20 });
  await settleBounded(fixture);
}

const texts = (host: HTMLElement, testId: string): readonly string[] =>
  [...host.querySelectorAll<HTMLElement>(`[data-testid="${testId}"]`)].map((element) =>
    normalized(element),
  );

async function pressFilter(rendered: Rendered, label: string): Promise<void> {
  [...rendered.host.querySelectorAll<HTMLElement>('[data-testid="filter-option"]')]
    .find((option) => testIdText(option, 'filter-option-label') === label)
    ?.click();
  await settleBounded(rendered.fixture);
}

const CAMILLE = makeAdminComment({
  id: 'c-1',
  author: { kind: 'visitor', name: 'Camille', email: 'camille@example.test' },
  body: 'Merci pour cet article.',
  post: { id: 'p-1', slug: 'article-temoin', title: 'Article témoin' },
});

describe('AdminComments: lecture de la file', () => {
  afterEach(() => TestBed.inject(HttpTestingController).verify());

  it('Given the queue is still loading When the page opens Then a loading status is announced under the page title', async () => {
    const rendered = await render();

    expect({
      title: testIdText(rendered.host, 'admin-page-title'),
      loading: byTestId(rendered.host, 'admin-comments-loading')?.getAttribute('role'),
      list: byTestId(rendered.host, 'admin-comments-list'),
    }).toEqual({ title: 'Commentaires', loading: 'status', list: null });

    await answer(rendered, 'pending', []);
  });

  it('Given a pending comment When the page opens Then its row shows the article, the visitor, the e-mail, the text and the status', async () => {
    const rendered = await render();

    await answer(rendered, 'pending', [CAMILLE]);

    const email = byTestId(rendered.host, 'comment-email');
    const post = byTestId(rendered.host, 'comment-post');
    expect({
      rows: texts(rendered.host, 'admin-comment-row').length,
      author: testIdText(rendered.host, 'comment-author'),
      email: normalized(email),
      mailto: email?.getAttribute('href'),
      post: normalized(post),
      postHref: post?.getAttribute('href'),
      body: testIdText(rendered.host, 'comment-body'),
      status: testIdText(rendered.host, 'comment-status'),
      date: byTestId(rendered.host, 'comment-date')?.getAttribute('datetime'),
    }).toEqual({
      rows: 1,
      author: 'Camille',
      email: 'camille@example.test',
      mailto: 'mailto:camille@example.test',
      post: 'Article témoin',
      postHref: '/blog/article-temoin',
      body: 'Merci pour cet article.',
      status: 'En attente',
      date: '2026-11-21T10:00:00.000Z',
    });
  });

  it('Given a reply When the page opens Then its row quotes the comment it answers', async () => {
    const rendered = await render();

    await answer(rendered, 'pending', [
      makeAdminComment({
        parent: { id: 'c-0', author: { kind: 'visitor', name: 'Lou' }, excerpt: 'Super' },
      }),
    ]);

    expect(testIdText(rendered.host, 'comment-parent')).toBe('En réponse à Lou : « Super »');
  });

  it('Given a comment whose text holds markup When the page opens Then the markup is shown as text', async () => {
    const rendered = await render();

    await answer(rendered, 'pending', [makeAdminComment({ body: '<img src=x onerror=alert(1)>' })]);

    expect({
      text: testIdText(rendered.host, 'comment-body'),
      images: byTestId(rendered.host, 'comment-body')?.querySelectorAll('img').length,
    }).toEqual({ text: '<img src=x onerror=alert(1)>', images: 0 });
  });

  it('Given 4 pending comments in all When the first page loads Then the summary counts them', async () => {
    const rendered = await render();

    await answer(rendered, 'pending', [CAMILLE], { total: 4 });

    expect(testIdText(rendered.host, 'admin-comments-summary')).toBe('4 commentaires en attente');
  });

  it('Given no pending comment When the page opens Then an empty state explains it, without list', async () => {
    const rendered = await render();

    await answer(rendered, 'pending', []);

    expect({
      empty: byTestId(rendered.host, 'empty-state') !== null,
      list: byTestId(rendered.host, 'admin-comments-list'),
    }).toEqual({ empty: true, list: null });
  });

  it('Given the API fails When the queue loads Then an error is shown, and retrying asks again', async () => {
    const rendered = await render();
    rendered.http
      .expectOne(listUrl('pending'))
      .flush({ message: 'boom' }, { status: 500, statusText: 'Server Error' });
    await settleBounded(rendered.fixture);
    const error = byTestId(rendered.host, 'load-error') !== null;

    await pressTestId(rendered.fixture, 'load-error-retry');
    await answer(rendered, 'pending', [CAMILLE]);

    expect({ error, authors: texts(rendered.host, 'comment-author') }).toEqual({
      error: true,
      authors: ['Camille'],
    });
  });
});

describe('AdminComments: filtre et pages', () => {
  afterEach(() => TestBed.inject(HttpTestingController).verify());

  it('Given the pending queue When « Publiés » is pressed Then the published comments are asked for and listed', async () => {
    const rendered = await render();
    await answer(rendered, 'pending', [CAMILLE]);

    await pressFilter(rendered, 'Publiés');
    await answer(rendered, 'published', [
      makeAdminComment({ id: 'c-9', status: 'published', author: { kind: 'owner' } }),
    ]);

    expect({
      authors: texts(rendered.host, 'comment-author'),
      status: texts(rendered.host, 'comment-status'),
      email: byTestId(rendered.host, 'comment-email'),
    }).toEqual({ authors: ['Toi, auteur du site'], status: ['Publié'], email: null });
  });

  it('Given 45 pending comments When older ones are asked for Then page 2 is requested and announced', async () => {
    const rendered = await render();
    await answer(rendered, 'pending', [CAMILLE], { total: 45 });

    await pressTestId(rendered.fixture, 'admin-comments-older');
    await answer(rendered, 'pending', [makeAdminComment({ id: 'c-21' })], { page: 2, total: 45 });

    expect({
      page: testIdText(rendered.host, 'admin-comments-page'),
      pageRole: byTestId(rendered.host, 'admin-comments-page')?.getAttribute('role'),
    }).toEqual({ page: 'Page 2 sur 3', pageRole: 'status' });
  });

  it('Given page 2 of the pending queue When the filter changes Then the first page of the other status is asked for', async () => {
    const rendered = await render();
    await answer(rendered, 'pending', [CAMILLE], { total: 45 });
    await pressTestId(rendered.fixture, 'admin-comments-older');
    await answer(rendered, 'pending', [CAMILLE], { page: 2, total: 45 });

    await pressFilter(rendered, 'Publiés');

    rendered.http.expectOne(listUrl('published', 1)).flush({ data: [], total: 0 });
    await settleBounded(rendered.fixture);
    expect(byTestId(rendered.host, 'empty-state')).not.toBeNull();
  });

  it('Given 20 comments or fewer When the page loads Then no pager is shown', async () => {
    const rendered = await render();

    await answer(rendered, 'pending', [CAMILLE], { total: 20 });

    expect(byTestId(rendered.host, 'admin-comments-pager')).toBeNull();
  });
});
