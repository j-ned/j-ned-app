import { Component, LOCALE_ID, NO_ERRORS_SCHEMA } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import { provideRouter } from '@angular/router';
import { of, throwError, type Observable } from 'rxjs';
import { AdminBlog } from './admin-blog';
import { BlogGateway } from '@features/blog/domain/gateways/blog.gateway';
import type { BlogPost } from '@features/blog/domain/models/blog-post.model';
import { ToastStore } from '@core/notifications/toast-store';
import { makeBlogPost } from '@features/blog/testing/blog-post-builders';
import { stubBlogGateway } from '@features/blog/testing/stub-blog-gateway';
import { byTestId, testIdText } from '@shared/testing/by-test-id';
import { captureCrash } from '@shared/testing/capture-crash';
import { pressTestId } from '@shared/testing/press-test-id';
import { settleBounded } from '@shared/testing/settle';
import { answerConfirmDialog, readConfirmDialog } from '@shared/ui/testing/confirm-dialog-page';

registerLocaleData(localeFr);

@Component({ template: '' })
class BlankPage {}

async function setup(gateway: BlogGateway = stubBlogGateway()): Promise<{
  component: AdminBlog;
  toast: { add: ReturnType<typeof vi.fn> };
  fixture: ComponentFixture<AdminBlog>;
}> {
  const toast = { add: vi.fn() };
  TestBed.configureTestingModule({
    providers: [
      provideRouter([{ path: '**', component: BlankPage }]),
      { provide: BlogGateway, useValue: gateway },
      { provide: ToastStore, useValue: toast },
      { provide: LOCALE_ID, useValue: 'fr-FR' },
    ],
    schemas: [NO_ERRORS_SCHEMA],
  });
  const fixture = TestBed.createComponent(AdminBlog);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  return { component: fixture.componentInstance, toast, fixture };
}

const withPosts = (posts: readonly BlogPost[]): BlogGateway =>
  stubBlogGateway({ getAllPostsForAdmin: () => of(posts) });

const all = (host: ParentNode, testId: string): readonly HTMLElement[] => [
  ...host.querySelectorAll<HTMLElement>(`[data-testid="${testId}"]`),
];

const words = (count: number): string => Array.from({ length: count }, () => 'mot').join(' ');

describe('AdminBlog', () => {
  describe('remove', () => {
    it('retire l’article de façon optimiste et notifie le succès', async () => {
      const { component, toast } = await setup(
        stubBlogGateway({
          getAllPostsForAdmin: () => of([makeBlogPost({ id: '1' }), makeBlogPost({ id: '2' })]),
          deletePost: () => of(undefined),
        }),
      );
      component.remove('1');
      expect(component.posts().map((p) => p.id)).toEqual(['2']);
      expect(toast.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'success' }));
    });

    it('restaure la liste et notifie une erreur si la suppression échoue', async () => {
      const { component, toast } = await setup(
        stubBlogGateway({
          getAllPostsForAdmin: () => of([makeBlogPost({ id: '1' }), makeBlogPost({ id: '2' })]),
          deletePost: () => throwError(() => new Error('boom')),
        }),
      );
      component.remove('1');
      expect(component.posts().map((p) => p.id)).toEqual(['1', '2']);
      expect(toast.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error' }));
    });
  });
});

describe('AdminBlog: suppression confirmée', () => {
  const FIRST = makeBlogPost({ id: 'b-1', title: 'Chiffrer côté client' });
  const SECOND = makeBlogPost({ id: 'b-2', title: 'De la fraiseuse à Angular' });

  async function renderList(): Promise<{
    fixture: ComponentFixture<AdminBlog>;
    host: HTMLElement;
    deletePost: ReturnType<typeof vi.fn>;
  }> {
    const deletePost = vi.fn((): Observable<void> => of(undefined));
    const { fixture } = await setup(
      stubBlogGateway({ getAllPostsForAdmin: () => of([FIRST, SECOND]), deletePost }),
    );
    return { fixture, host: fixture.nativeElement as HTMLElement, deletePost };
  }

  it.each([
    { answer: 'confirm' as const, deleted: [['b-1']], posts: ['b-2'] },
    { answer: 'cancel' as const, deleted: [], posts: ['b-1', 'b-2'] },
    { answer: 'escape' as const, deleted: [], posts: ['b-1', 'b-2'] },
  ])(
    'Given the dialog asks about the first article When the user answers $answer Then the gateway deletes $deleted and the dialog closes',
    async ({ answer, deleted, posts }) => {
      const { fixture, host, deletePost } = await renderList();
      await pressTestId(fixture, 'admin-post-delete', 0);

      await answerConfirmDialog(fixture, answer);

      expect({
        open: readConfirmDialog(host).open,
        deleted: deletePost.mock.calls,
        posts: fixture.componentInstance.posts().map((post) => post.id),
      }).toEqual({ open: false, deleted, posts });
    },
  );

  it('Given a confirmed deletion When the row disappears Then the focus lands on the page title', async () => {
    const { fixture, host } = await renderList();
    await pressTestId(fixture, 'admin-post-delete', 0);

    await answerConfirmDialog(fixture, 'confirm');
    const title = byTestId(host, 'admin-page-title');

    expect({
      tag: title?.tagName,
      tabindex: title?.getAttribute('tabindex'),
      focused: title !== null && host.ownerDocument.activeElement === title,
    }).toEqual({ tag: 'H1', tabindex: '-1', focused: true });
  });
});

describe('AdminBlog: chargement, erreur et vide', () => {
  const STATE_TEST_IDS = ['load-error', 'admin-posts-empty', 'admin-posts-list'] as const;

  async function renderWith(getAllPostsForAdmin: BlogGateway['getAllPostsForAdmin']): Promise<{
    fixture: ComponentFixture<AdminBlog>;
    host: HTMLElement;
    crash: unknown;
  }> {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: '**', component: BlankPage }]),
        { provide: BlogGateway, useValue: stubBlogGateway({ getAllPostsForAdmin }) },
        { provide: ToastStore, useValue: { add: vi.fn() } },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    });
    const fixture = TestBed.createComponent(AdminBlog);
    const crash = await captureCrash(() => settleBounded(fixture));
    return { fixture, host: fixture.nativeElement as HTMLElement, crash };
  }

  const present = (host: HTMLElement): readonly string[] =>
    STATE_TEST_IDS.filter((testId) => byTestId(host, testId) !== null);

  it.each([
    {
      state: 'failed',
      stream: throwError(() => new Error('down')),
      shown: 'load-error',
    },
    { state: 'empty', stream: of([]), shown: 'admin-posts-empty' },
    { state: 'loaded', stream: of([makeBlogPost()]), shown: 'admin-posts-list' },
  ])(
    'Given the article list is $state When the page renders Then only $shown is shown',
    async ({ stream, shown }) => {
      const { host, crash } = await renderWith(() => stream);

      expect({ crash, present: present(host) }).toEqual({ crash: null, present: [shown] });
    },
  );

  it('Given the article list failed When Réessayer is pressed Then the list is requested again and shown', async () => {
    const getAllPostsForAdmin = vi
      .fn<BlogGateway['getAllPostsForAdmin']>()
      .mockReturnValueOnce(throwError(() => new Error('down')))
      .mockReturnValue(of([makeBlogPost({ id: 'b-1' })]));
    const { fixture, host } = await renderWith(getAllPostsForAdmin);

    const crash = await captureCrash(() => pressTestId(fixture, 'load-error-retry'));

    expect({ crash, calls: getAllPostsForAdmin.mock.calls.length, present: present(host) }).toEqual(
      {
        crash: null,
        calls: 2,
        present: ['admin-posts-list'],
      },
    );
  });
});

describe('AdminBlog: la liste partagée est invalidée après une suppression', () => {
  it('Given the list When a deletion succeeds Then the shared admin list is invalidated once instead of being requested again', async () => {
    const invalidateAdminPosts = vi.fn();
    const getAllPostsForAdmin = vi.fn(() => of([makeBlogPost({ id: 'b-1' })]));
    const { component, fixture } = await setup(
      stubBlogGateway({ getAllPostsForAdmin, invalidateAdminPosts }),
    );

    component.remove('b-1');
    await settleBounded(fixture);

    expect({
      invalidations: invalidateAdminPosts.mock.calls.length,
      listSubscriptions: getAllPostsForAdmin.mock.calls.length,
    }).toEqual({ invalidations: 1, listSubscriptions: 1 });
  });

  it('Given the list When a deletion fails Then the list is restored and only a successful deletion invalidates it', async () => {
    const invalidateAdminPosts = vi.fn();
    const deletePost = vi
      .fn<BlogGateway['deletePost']>()
      .mockReturnValueOnce(throwError(() => new Error('down')))
      .mockReturnValueOnce(of(undefined));
    const { component, fixture } = await setup(
      stubBlogGateway({
        getAllPostsForAdmin: () => of([makeBlogPost({ id: 'b-1' })]),
        deletePost,
        invalidateAdminPosts,
      }),
    );

    component.remove('b-1');
    await settleBounded(fixture);
    const afterFailure = {
      invalidations: invalidateAdminPosts.mock.calls.length,
      posts: component.posts().map((post) => post.id),
    };
    component.remove('b-1');
    await settleBounded(fixture);

    expect({ afterFailure, afterSuccess: invalidateAdminPosts.mock.calls.length }).toEqual({
      afterFailure: { invalidations: 0, posts: ['b-1'] },
      afterSuccess: 1,
    });
  });
});

const CHIFFREMENT = makeBlogPost({
  id: 'b-1',
  slug: 'chiffrement-cote-client',
  title: 'Chiffrement côté client',
  contentMarkdown: words(2860),
  coverImage: 'https://cdn.test/blog/b-1.avif',
  tags: ['Chiffrement', 'AES-256-GCM', 'PBKDF2', 'Angular'],
  status: 'published',
  likesCount: 0,
  publishedAt: '2026-09-09T10:00:00Z',
});

const METALLURGIE = makeBlogPost({
  id: 'b-2',
  slug: 'de-la-metallurgie-au-developpement',
  title: 'De 20 ans de métallurgie à développeur Full-Stack',
  contentMarkdown: words(1700),
  coverImage: 'https://cdn.test/blog/b-2.avif',
  tags: ['Reconversion', 'Parcours', 'Angular'],
  status: 'published',
  likesCount: 2,
  publishedAt: '2026-09-01T10:00:00Z',
});

const SIGNAL_FORMS = makeBlogPost({
  id: 'b-3',
  slug: 'signal-forms-en-production',
  title: 'Signal Forms en production',
  contentMarkdown: words(1000),
  coverImage: '',
  tags: ['Angular', 'Tests'],
  status: 'draft',
  likesCount: 0,
  publishedAt: null,
});

async function renderTable(): Promise<{ fixture: ComponentFixture<AdminBlog>; host: HTMLElement }> {
  const { fixture } = await setup(withPosts([METALLURGIE, SIGNAL_FORMS, CHIFFREMENT]));
  return { fixture, host: fixture.nativeElement as HTMLElement };
}

const rowTitles = (host: HTMLElement): readonly string[] =>
  all(host, 'admin-post-row').map((row) => testIdText(row, 'admin-post-title'));

describe('AdminBlog: tri par date de publication', () => {
  const publishedHeader = (host: HTMLElement): HTMLElement | null =>
    byTestId(host, 'sort-published')?.closest('th') ?? null;

  it('Given the newest first When « Publié le » is pressed Then the oldest comes first, the draft stays last, and the order is announced', async () => {
    const { fixture, host } = await renderTable();

    await pressTestId(fixture, 'sort-published');

    expect({
      titles: rowTitles(host),
      sort: publishedHeader(host)?.getAttribute('aria-sort'),
    }).toEqual({
      titles: [
        'De 20 ans de métallurgie à développeur Full-Stack',
        'Chiffrement côté client',
        'Signal Forms en production',
      ],
      sort: 'ascending',
    });
  });
});

describe('AdminBlog: filtre par statut', () => {
  it.each([
    {
      index: 1,
      filter: 'Publiés',
      titles: ['Chiffrement côté client', 'De 20 ans de métallurgie à développeur Full-Stack'],
    },
  ])(
    'Given the full list When « $filter » is pressed Then only its articles remain',
    async ({ index, titles }) => {
      const { fixture, host } = await renderTable();

      await pressTestId(fixture, 'filter-option', index);

      expect({
        titles: rowTitles(host),
        pressed: all(host, 'filter-option').map((option) => option.getAttribute('aria-pressed')),
      }).toEqual({
        titles,
        pressed: [0, 1, 2].map((position) => (position === index ? 'true' : 'false')),
      });
    },
  );
});
