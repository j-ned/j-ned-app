import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
  type TestRequest,
} from '@angular/common/http/testing';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import type { Mock } from 'vitest';
import { ToastStore } from '@core/notifications/toast-store';
import type { AdminComment } from '@features/comments/domain/models/comment.model';
import { CommentsGateway } from '@features/comments/infra/comments.gateway';
import { makeAdminComment, toAdminCommentDto } from '@features/comments/testing/comment-builders';
import { API_BASE_URL } from '@shared/api/api-config';
import { asButton } from '@shared/testing/as-button';
import { byTestId, testIdText } from '@shared/testing/by-test-id';
import { normalized } from '@shared/testing/normalized-text';
import { pressTestId } from '@shared/testing/press-test-id';
import { settleBounded } from '@shared/testing/settle';
import { answerConfirmDialog, readConfirmDialog } from '@shared/ui/testing/confirm-dialog-page';
import type { ToastMessage } from '@shared/ui/toast.types';
import { frenchTypographyViolations } from '../../../../testing/french-typography-violations';
import { deleteThroughDialog, readPageTitleFocus } from '../../application/testing/admin-list-page';
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

    expect(testIdText(rendered.host, 'comment-parent')).toBe(
      'En réponse à Lou\u00a0: «\u00a0Super\u00a0»',
    );
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

describe('AdminComments: publier', () => {
  afterEach(() => TestBed.inject(HttpTestingController).verify());

  const LOU = makeAdminComment({
    id: 'c-2',
    author: { kind: 'visitor', name: 'Lou', email: 'lou@example.test' },
  });

  async function renderQueue(): Promise<Rendered & { readonly invalidate: Mock<() => void> }> {
    const rendered = await render();
    const invalidate = vi.spyOn(TestBed.inject(CommentsGateway), 'invalidatePendingCount');
    await answer(rendered, 'pending', [CAMILLE, LOU], { total: 2 });
    return { ...rendered, invalidate };
  }

  const publishRequest = (rendered: Rendered, id: string): TestRequest =>
    rendered.http.expectOne({ method: 'PATCH', url: `/api/blog/comments/${id}` });

  it('Given a pending comment When the queue renders Then its publish button names the visitor, and a published one has none', async () => {
    const rendered = await render();

    await answer(rendered, 'pending', [CAMILLE]);
    const pendingLabel = byTestId(rendered.host, 'comment-publish')?.getAttribute('aria-label');
    await pressFilter(rendered, 'Publiés');
    await answer(rendered, 'published', [makeAdminComment({ status: 'published' })]);

    expect({
      pendingLabel,
      publishedButton: byTestId(rendered.host, 'comment-publish'),
    }).toEqual({ pendingLabel: 'Publier le commentaire de Camille', publishedButton: null });
  });

  it('Given the pending queue When a comment is published Then it leaves the list at once, then the count and the queue are read again and success is told with focus on the title', async () => {
    const rendered = await renderQueue();

    await pressTestId(rendered.fixture, 'comment-publish', 0);
    const during = texts(rendered.host, 'comment-author');
    publishRequest(rendered, 'c-1').flush(toAdminCommentDto({ ...CAMILLE, status: 'published' }));
    await settleBounded(rendered.fixture);
    await answer(rendered, 'pending', [LOU], { total: 1 });

    expect({
      during,
      after: texts(rendered.host, 'comment-author'),
      summary: testIdText(rendered.host, 'admin-comments-summary'),
      invalidated: rendered.invalidate.mock.calls.length,
      toasts: rendered.toast.add.mock.calls.map(([toast]) => toast),
      focus: readPageTitleFocus(rendered.host),
    }).toEqual({
      during: ['Lou'],
      after: ['Lou'],
      summary: '1 commentaire en attente',
      invalidated: 1,
      toasts: [{ severity: 'success', detail: 'Commentaire de Camille publié' }],
      focus: { tag: 'H1', tabindex: '-1', focused: true },
    });
  });

  it('Given the server fails When a comment is published Then the row comes back in place and the failure is told', async () => {
    const rendered = await renderQueue();

    await pressTestId(rendered.fixture, 'comment-publish', 0);
    publishRequest(rendered, 'c-1').flush('boom', { status: 500, statusText: 'Error' });
    await settleBounded(rendered.fixture);

    expect({
      authors: texts(rendered.host, 'comment-author'),
      invalidated: rendered.invalidate.mock.calls.length,
      toasts: rendered.toast.add.mock.calls.map(([toast]) => toast),
    }).toEqual({
      authors: ['Camille', 'Lou'],
      invalidated: 0,
      toasts: [
        {
          severity: 'error',
          detail: "Le commentaire n'a pas pu être publié. Réessaie dans un instant.",
        },
      ],
    });
  });

  it.each([
    {
      status: 409,
      detail: 'Ce commentaire est déjà publié. La liste est à jour.',
    },
    {
      status: 404,
      detail: 'Ce commentaire a été supprimé entre-temps. La liste est à jour.',
    },
  ])(
    'Given the comment changed elsewhere ($status) When it is published Then the reason is told and the queue and count are read again',
    async ({ status, detail }) => {
      const rendered = await renderQueue();

      await pressTestId(rendered.fixture, 'comment-publish', 0);
      publishRequest(rendered, 'c-1').flush('nope', { status, statusText: 'Nope' });
      await settleBounded(rendered.fixture);
      await answer(rendered, 'pending', [LOU], { total: 1 });

      expect({
        authors: texts(rendered.host, 'comment-author'),
        invalidated: rendered.invalidate.mock.calls.length,
        toasts: rendered.toast.add.mock.calls.map(([toast]) => toast),
      }).toEqual({
        authors: ['Lou'],
        invalidated: 1,
        toasts: [{ severity: 'error', detail }],
      });
    },
  );
});

describe('AdminComments: refuser ou supprimer après confirmation', () => {
  afterEach(() => TestBed.inject(HttpTestingController).verify());

  const PUBLISHED = makeAdminComment({ id: 'c-1', status: 'published', replyCount: 2 });
  const OTHER = makeAdminComment({
    id: 'c-2',
    status: 'published',
    author: { kind: 'visitor', name: 'Lou', email: 'lou@example.test' },
  });

  async function renderPublished(): Promise<Rendered & { readonly invalidate: Mock<() => void> }> {
    const rendered = await render();
    const invalidate = vi.spyOn(TestBed.inject(CommentsGateway), 'invalidatePendingCount');
    await answer(rendered, 'pending', []);
    await pressFilter(rendered, 'Publiés');
    await answer(rendered, 'published', [PUBLISHED, OTHER], { total: 2 });
    return { ...rendered, invalidate };
  }

  const deleteRequest = (rendered: Rendered, id: string): TestRequest =>
    rendered.http.expectOne({ method: 'DELETE', url: `/api/blog/comments/${id}` });

  it('Given a published comment with 2 replies When its deletion is asked for Then the dialog names the visitor and says the replies go too', async () => {
    const rendered = await renderPublished();
    const label = byTestId(rendered.host, 'comment-delete')?.getAttribute('aria-label');

    await pressTestId(rendered.fixture, 'comment-delete', 0);

    expect({ label, dialog: readConfirmDialog(rendered.host) }).toEqual({
      label: 'Supprimer le commentaire de Camille',
      dialog: {
        open: true,
        heading: 'Supprimer le commentaire de Camille\u202f?',
        description:
          "Le commentaire disparaît de l'article, et ses 2 réponses avec lui. Cette action est définitive.",
        confirm: 'Supprimer le commentaire',
        cancel: 'Annuler',
      },
    });

    await answerConfirmDialog(rendered.fixture, 'cancel');
  });

  it('Given the dialog When the deletion is confirmed Then the comment leaves the list, the API deletes it, success is told, the count and queue are read again and focus goes to the title', async () => {
    const rendered = await renderPublished();

    await deleteThroughDialog(rendered.fixture, 'comment-delete', 'confirm');
    const during = texts(rendered.host, 'comment-author');
    deleteRequest(rendered, 'c-1').flush(null, { status: 204, statusText: 'No Content' });
    await settleBounded(rendered.fixture);
    await answer(rendered, 'published', [OTHER], { total: 1 });

    expect({
      during,
      after: texts(rendered.host, 'comment-author'),
      summary: testIdText(rendered.host, 'admin-comments-summary'),
      invalidated: rendered.invalidate.mock.calls.length,
      toasts: rendered.toast.add.mock.calls.map(([toast]) => toast),
      focus: readPageTitleFocus(rendered.host),
    }).toEqual({
      during: ['Lou'],
      after: ['Lou'],
      summary: '1 commentaire publié',
      invalidated: 1,
      toasts: [{ severity: 'success', detail: 'Commentaire de Camille supprimé' }],
      focus: { tag: 'H1', tabindex: '-1', focused: true },
    });
  });

  it.each(['cancel', 'escape'] as const)(
    'Given the dialog When it is answered « %s » Then nothing is deleted and the list is kept',
    async (answerWith) => {
      const rendered = await renderPublished();

      await deleteThroughDialog(rendered.fixture, 'comment-delete', answerWith);

      expect({
        open: readConfirmDialog(rendered.host).open,
        authors: texts(rendered.host, 'comment-author'),
      }).toEqual({ open: false, authors: ['Camille', 'Lou'] });
    },
  );

  it('Given a pending comment When it is refused Then the dialog says refusing deletes it, and the API deletes it', async () => {
    const rendered = await render();
    await answer(rendered, 'pending', [CAMILLE]);

    await pressTestId(rendered.fixture, 'comment-delete', 0);
    const dialog = readConfirmDialog(rendered.host);
    await answerConfirmDialog(rendered.fixture, 'confirm');
    deleteRequest(rendered, 'c-1').flush(null, { status: 204, statusText: 'No Content' });
    await settleBounded(rendered.fixture);
    await answer(rendered, 'pending', []);

    expect({
      heading: dialog.heading,
      description: dialog.description,
      confirm: dialog.confirm,
      toasts: rendered.toast.add.mock.calls.map(([toast]) => toast.detail),
    }).toEqual({
      heading: 'Refuser le commentaire de Camille\u202f?',
      description: 'Un commentaire refusé est supprimé définitivement.',
      confirm: 'Refuser et supprimer',
      toasts: ['Commentaire de Camille refusé et supprimé'],
    });
  });

  it('Given the server fails When a deletion is confirmed Then the comment comes back in place and the failure is told', async () => {
    const rendered = await renderPublished();

    await deleteThroughDialog(rendered.fixture, 'comment-delete', 'confirm');
    deleteRequest(rendered, 'c-1').flush('boom', { status: 500, statusText: 'Error' });
    await settleBounded(rendered.fixture);

    expect({
      authors: texts(rendered.host, 'comment-author'),
      toasts: rendered.toast.add.mock.calls.map(([toast]) => toast),
    }).toEqual({
      authors: ['Camille', 'Lou'],
      toasts: [
        {
          severity: 'error',
          detail: "Le commentaire n'a pas pu être supprimé. Réessaie dans un instant.",
        },
      ],
    });
  });

  it('Given the comment was already deleted elsewhere When its deletion is confirmed Then it is told and the queue and count are read again', async () => {
    const rendered = await renderPublished();

    await deleteThroughDialog(rendered.fixture, 'comment-delete', 'confirm');
    deleteRequest(rendered, 'c-1').flush('gone', { status: 404, statusText: 'Not Found' });
    await settleBounded(rendered.fixture);
    await answer(rendered, 'published', [OTHER], { total: 1 });

    expect({
      authors: texts(rendered.host, 'comment-author'),
      invalidated: rendered.invalidate.mock.calls.length,
      toasts: rendered.toast.add.mock.calls.map(([toast]) => toast),
    }).toEqual({
      authors: ['Lou'],
      invalidated: 1,
      toasts: [
        { severity: 'error', detail: 'Ce commentaire était déjà supprimé. La liste est à jour.' },
      ],
    });
  });
});

describe('AdminComments: répondre en tant qu’auteur', () => {
  afterEach(() => TestBed.inject(HttpTestingController).verify());

  const PUBLISHED = makeAdminComment({ id: 'c-1', status: 'published' });
  const VISITOR_REPLY = makeAdminComment({
    id: 'c-2',
    status: 'published',
    author: { kind: 'visitor', name: 'Lou', email: 'lou@example.test' },
    parent: { id: 'c-0', author: { kind: 'visitor', name: 'Sami' }, excerpt: 'Bonjour' },
  });
  const OWNER_REPLY = makeAdminComment({
    id: 'c-9',
    status: 'published',
    author: { kind: 'owner' },
    body: 'Avec plaisir',
    createdAt: '2026-11-22T10:00:00.000Z',
    parent: { id: 'c-1', author: { kind: 'visitor', name: 'Camille' }, excerpt: 'Merci' },
  });

  async function renderPublished(): Promise<Rendered> {
    const rendered = await render();
    await answer(rendered, 'pending', [CAMILLE]);
    await pressFilter(rendered, 'Publiés');
    await answer(rendered, 'published', [PUBLISHED, VISITOR_REPLY], { total: 2 });
    return rendered;
  }

  const replyButtons = (host: HTMLElement): readonly HTMLElement[] => [
    ...host.querySelectorAll<HTMLElement>('[data-testid="comment-reply"]'),
  ];

  async function typeReply(rendered: Rendered, text: string): Promise<void> {
    const field = byTestId(rendered.host, 'reply-body');
    if (!(field instanceof HTMLTextAreaElement)) throw new Error('Expected the reply textarea');
    field.value = text;
    field.dispatchEvent(new Event('input'));
    await settleBounded(rendered.fixture);
  }

  it('Given pending comments When the queue renders Then none offers a reply', async () => {
    const rendered = await render();

    await answer(rendered, 'pending', [CAMILLE]);

    expect(replyButtons(rendered.host)).toEqual([]);
  });

  it('Given a published comment and a published reply When the list renders Then only the comment offers a reply, named after its visitor', async () => {
    const rendered = await renderPublished();

    expect(
      replyButtons(rendered.host).map((button) => ({
        label: button.getAttribute('aria-label'),
        expanded: button.getAttribute('aria-expanded'),
      })),
    ).toEqual([{ label: 'Répondre à Camille', expanded: 'false' }]);
  });

  it('Given a published comment When « Répondre » is pressed Then the form it controls opens under the comment with the focus in its field', async () => {
    const rendered = await renderPublished();

    await pressTestId(rendered.fixture, 'comment-reply');
    const button = byTestId(rendered.host, 'comment-reply');
    const form = rendered.host.ownerDocument.getElementById(
      button?.getAttribute('aria-controls') ?? '',
    );

    expect({
      expanded: button?.getAttribute('aria-expanded'),
      formInRow: byTestId(rendered.host, 'admin-comment-row')?.contains(form) ?? false,
      legend: testIdText(rendered.host, 'reply-legend'),
      focused: rendered.host.ownerDocument.activeElement === byTestId(rendered.host, 'reply-body'),
    }).toEqual({ expanded: 'true', formInRow: true, legend: 'Répondre à Camille', focused: true });
  });

  it('Given an open reply form When it is cancelled Then it closes and the focus returns to « Répondre »', async () => {
    const rendered = await renderPublished();
    await pressTestId(rendered.fixture, 'comment-reply');

    await pressTestId(rendered.fixture, 'reply-cancel');

    expect({
      form: byTestId(rendered.host, 'reply-body'),
      focused:
        rendered.host.ownerDocument.activeElement === byTestId(rendered.host, 'comment-reply'),
    }).toEqual({ form: null, focused: true });
  });

  it('Given a written reply When it is sent Then it is posted, shown published at the top as the owner’s, the comment counts it, and the form closes with focus back on « Répondre »', async () => {
    const rendered = await renderPublished();
    await pressTestId(rendered.fixture, 'comment-reply');
    await typeReply(rendered, 'Avec plaisir');

    await pressTestId(rendered.fixture, 'reply-submit');
    const req = rendered.http.expectOne({
      method: 'POST',
      url: '/api/blog/comments/c-1/replies',
    });
    const body: unknown = req.request.body;
    req.flush(toAdminCommentDto(OWNER_REPLY), { status: 201, statusText: 'Created' });
    await settleBounded(rendered.fixture);

    expect({
      body,
      authors: texts(rendered.host, 'comment-author'),
      status: texts(rendered.host, 'comment-status'),
      replies: texts(rendered.host, 'comment-replies'),
      summary: testIdText(rendered.host, 'admin-comments-summary'),
      form: byTestId(rendered.host, 'reply-body'),
      toasts: rendered.toast.add.mock.calls.map(([toast]) => toast),
      focused:
        rendered.host.ownerDocument.activeElement === byTestId(rendered.host, 'comment-reply'),
    }).toEqual({
      body: { body: 'Avec plaisir' },
      authors: ['Toi, auteur du site', 'Camille', 'Lou'],
      status: ['Publié', 'Publié', 'Publié'],
      replies: ['1 réponse'],
      summary: '3 commentaires publiés',
      form: null,
      toasts: [{ severity: 'success', detail: 'Ta réponse à Camille est publiée' }],
      focused: true,
    });
  });

  it('Given the server fails When a reply is sent Then the form stays open with the text and the failure is told', async () => {
    const rendered = await renderPublished();
    await pressTestId(rendered.fixture, 'comment-reply');
    await typeReply(rendered, 'Avec plaisir');

    await pressTestId(rendered.fixture, 'reply-submit');
    rendered.http
      .expectOne('/api/blog/comments/c-1/replies')
      .flush('boom', { status: 500, statusText: 'Error' });
    await settleBounded(rendered.fixture);

    const field = byTestId(rendered.host, 'reply-body');
    expect({
      text: field instanceof HTMLTextAreaElement ? field.value : null,
      sending: asButton(byTestId(rendered.host, 'reply-submit')).disabled,
      toasts: rendered.toast.add.mock.calls.map(([toast]) => toast),
    }).toEqual({
      text: 'Avec plaisir',
      sending: false,
      toasts: [
        {
          severity: 'error',
          detail: "Ta réponse n'a pas pu être publiée. Réessaie dans un instant.",
        },
      ],
    });
  });

  it('Given the comment was deleted elsewhere When a reply is sent Then it is told, the form closes and the list is read again', async () => {
    const rendered = await renderPublished();
    await pressTestId(rendered.fixture, 'comment-reply');
    await typeReply(rendered, 'Avec plaisir');

    await pressTestId(rendered.fixture, 'reply-submit');
    rendered.http
      .expectOne('/api/blog/comments/c-1/replies')
      .flush('gone', { status: 404, statusText: 'Not Found' });
    await settleBounded(rendered.fixture);
    await answer(rendered, 'published', [VISITOR_REPLY], { total: 1 });

    expect({
      form: byTestId(rendered.host, 'reply-body'),
      authors: texts(rendered.host, 'comment-author'),
      toasts: rendered.toast.add.mock.calls.map(([toast]) => toast.detail),
    }).toEqual({
      form: null,
      authors: ['Lou'],
      toasts: [
        "Ce commentaire a été supprimé entre-temps\u00a0: ta réponse n'est pas publiée. La liste est à jour.",
      ],
    });
  });
});

describe('AdminComments: typographie', () => {
  afterEach(() => TestBed.inject(HttpTestingController).verify());

  it('Given the empty pending queue When the page renders Then its own texts follow French typography', async () => {
    const rendered = await render();

    await answer(rendered, 'pending', []);

    expect(frenchTypographyViolations(rendered.host.textContent ?? '', 'admin-comments')).toEqual(
      [],
    );
  });
});
