import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { LOCALE_ID, NO_ERRORS_SCHEMA } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import { NEVER, of, throwError, type Observable } from 'rxjs';
import { AdminBlog } from './admin-blog';
import { BlogGateway } from '@features/blog/domain/gateways/blog.gateway';
import type { BlogPost, BlogPostInput } from '@features/blog/domain/models/blog-post.model';
import { ToastStore } from '@shared/ui/toast-store';
import { makeBlogPost } from '@features/blog/testing/blog-post-builders';
import { byTestId, testIdText } from '@shared/testing/by-test-id';
import { captureCrash } from '@shared/testing/capture-crash';
import { pressTestId } from '@shared/testing/press-test-id';
import { settleBounded } from '@shared/testing/settle';
import { answerConfirmDialog, readConfirmDialog } from '@shared/ui/testing/confirm-dialog-page';

registerLocaleData(localeFr);

const post = (p: Partial<BlogPost> = {}): BlogPost => ({
  id: '1',
  title: 'Article 1',
  slug: 'article-1',
  excerpt: 'Résumé',
  contentMarkdown: '# Contenu',
  coverImage: '',
  tags: ['Angular'],
  status: 'draft',
  likesCount: 0,
  publishedAt: null,
  updatedAt: '2026-08-01T00:00:00Z',
  ...p,
});

const input = (p: Partial<BlogPostInput> = {}): BlogPostInput => ({
  title: 'Nouveau',
  excerpt: 'Résumé',
  contentMarkdown: '# Contenu',
  tags: [],
  status: 'draft',
  ...p,
});

function makeBlogGateway(overrides: Partial<BlogGateway> = {}): BlogGateway {
  return {
    getPublishedPosts: () => of([]),
    getAllPostsForAdmin: () => of([]),
    invalidateAdminPosts: () => undefined,
    getPostBySlug: () => of(post()),
    createPost: () => of(post()),
    updatePost: () => of(post()),
    deletePost: () => of(undefined),
    uploadCoverImage: () => of('uploaded-key'),
    likePost: () => of({ likesCount: 1 }),
    ...overrides,
  } as BlogGateway;
}

async function setup(gateway: BlogGateway = makeBlogGateway()): Promise<{
  component: AdminBlog;
  toast: { add: ReturnType<typeof vi.fn> };
  fixture: ComponentFixture<AdminBlog>;
}> {
  const toast = { add: vi.fn() };
  TestBed.configureTestingModule({
    providers: [
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

describe('AdminBlog', () => {
  it('charge les articles depuis le gateway', async () => {
    const { component } = await setup(
      makeBlogGateway({
        getAllPostsForAdmin: () => of([post({ id: '1' }), post({ id: '2' })]),
      }),
    );
    expect(component.posts().map((p) => p.id)).toEqual(['1', '2']);
  });

  it('affiche le statut en français et la date de publication au format court', async () => {
    const { fixture } = await setup(
      makeBlogGateway({
        getAllPostsForAdmin: () =>
          of([
            makeBlogPost({ id: '1', status: 'published', publishedAt: '2026-09-09T10:00:00Z' }),
            makeBlogPost({ id: '2', status: 'draft', publishedAt: null }),
          ]),
      }),
    );
    const host = fixture.nativeElement as HTMLElement;
    const cells = (testId: string): readonly string[] =>
      [...host.querySelectorAll(`[data-testid="${testId}"]`)].map((cell) =>
        (cell.textContent ?? '').replace(/[ \t\n\r]+/g, ' ').replace(/^ | $/g, ''),
      );

    expect({
      status: cells('admin-post-status'),
      published: cells('admin-post-date')[0],
    }).toEqual({ status: ['Publié', 'Brouillon'], published: '9 sept. 2026' });
  });

  describe('onSaved (création)', () => {
    it('crée l’article, ferme le formulaire et notifie le succès (sans image)', async () => {
      const { component, toast } = await setup(
        makeBlogGateway({ createPost: () => of(post({ id: '99' })) }),
      );
      component.editing.set('new');

      await component.onSaved({ data: input(), file: null }, undefined);

      expect(component.editing()).toBeUndefined();
      expect(toast.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'success' }));
    });

    it('notifie une erreur et laisse le formulaire ouvert si la création échoue', async () => {
      const { component, toast } = await setup(
        makeBlogGateway({ createPost: () => throwError(() => new Error('boom')) }),
      );
      component.editing.set('new');

      await component.onSaved({ data: input(), file: null }, undefined);

      expect(component.editing()).toBe('new');
      expect(toast.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error' }));
    });

    it('clôt quand même le formulaire (article déjà créé) mais avertit si l’upload de l’image échoue', async () => {
      const { component, toast } = await setup(
        makeBlogGateway({
          createPost: () => of(post({ id: '99' })),
          uploadCoverImage: () => throwError(() => new Error('upload')),
        }),
      );
      component.editing.set('new');

      await component.onSaved({ data: input(), file: new File([], 'cover.png') }, undefined);

      // L'article est déjà persisté côté serveur : le formulaire doit se fermer pour éviter
      // qu'un resubmit ne crée un doublon, avec un toast distinct pour l'échec d'upload.
      expect(component.editing()).toBeUndefined();
      expect(toast.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'warn' }));
      expect(toast.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'success' }));
    });
  });

  describe('onSaved (édition)', () => {
    it('met à jour l’article, ferme le formulaire et notifie le succès', async () => {
      const { component, toast } = await setup(
        makeBlogGateway({ updatePost: () => of(post({ id: '1', title: 'Modifié' })) }),
      );
      component.editing.set(post({ id: '1' }));

      await component.onSaved({ data: input({ title: 'Modifié' }), file: null }, '1');

      expect(component.editing()).toBeUndefined();
      expect(toast.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'success' }));
    });

    it('notifie une erreur si la mise à jour échoue', async () => {
      const { component, toast } = await setup(
        makeBlogGateway({ updatePost: () => throwError(() => new Error('boom')) }),
      );
      component.editing.set(post({ id: '1' }));

      await component.onSaved({ data: input(), file: null }, '1');

      expect(component.editing()).toEqual(post({ id: '1' }));
      expect(toast.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error' }));
    });
  });

  describe('remove', () => {
    it('retire l’article de façon optimiste et notifie le succès', async () => {
      const { component, toast } = await setup(
        makeBlogGateway({
          getAllPostsForAdmin: () => of([post({ id: '1' }), post({ id: '2' })]),
          deletePost: () => of(undefined),
        }),
      );
      component.remove('1');
      expect(component.posts().map((p) => p.id)).toEqual(['2']);
      expect(toast.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'success' }));
    });

    it('restaure la liste et notifie une erreur si la suppression échoue', async () => {
      const { component, toast } = await setup(
        makeBlogGateway({
          getAllPostsForAdmin: () => of([post({ id: '1' }), post({ id: '2' })]),
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
      makeBlogGateway({ getAllPostsForAdmin: () => of([FIRST, SECOND]), deletePost }),
    );
    return { fixture, host: fixture.nativeElement as HTMLElement, deletePost };
  }

  it('Given the list When the trash of the first article is pressed Then the dialog asks to confirm and nothing is deleted yet', async () => {
    const { fixture, host, deletePost } = await renderList();

    await pressTestId(fixture, 'admin-post-delete', 0);

    expect({
      dialog: readConfirmDialog(host),
      deleteCalls: deletePost.mock.calls.length,
      posts: fixture.componentInstance.posts().map((post) => post.id),
    }).toEqual({
      dialog: expect.objectContaining({
        open: true,
        heading: "Supprimer l'article Chiffrer côté client\u202f?",
        confirm: 'Supprimer Chiffrer côté client',
        cancel: 'Annuler',
      }),
      deleteCalls: 0,
      posts: ['b-1', 'b-2'],
    });
  });

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
  const STATE_TEST_IDS = [
    'admin-posts-loading',
    'load-error',
    'admin-posts-empty',
    'admin-posts-list',
  ] as const;

  async function renderWith(getAllPostsForAdmin: BlogGateway['getAllPostsForAdmin']): Promise<{
    fixture: ComponentFixture<AdminBlog>;
    host: HTMLElement;
    crash: unknown;
  }> {
    TestBed.configureTestingModule({
      providers: [
        { provide: BlogGateway, useValue: makeBlogGateway({ getAllPostsForAdmin }) },
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
    { state: 'loading', stream: NEVER, shown: 'admin-posts-loading' },
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

  it('Given the article list is loading Then the placeholder is announced as a status', async () => {
    const { host } = await renderWith(() => NEVER);

    expect(byTestId(host, 'admin-posts-loading')?.getAttribute('role')).toBe('status');
  });

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

describe('AdminBlog: tableau en français, tampons et actions nommées', () => {
  const PUBLISHED = makeBlogPost({
    id: 'b-1',
    title: 'Chiffrer côté client',
    status: 'published',
    publishedAt: '2026-09-09T10:00:00Z',
  });
  const DRAFT = makeBlogPost({
    id: 'b-2',
    title: 'De la fraiseuse à Angular',
    status: 'draft',
    publishedAt: null,
  });

  const normalized = (element: Element | null | undefined): string =>
    (element?.textContent ?? '').replace(/[ \t\n\r]+/g, ' ').replace(/^ | $/g, '');

  const nativeButton = (element: Element | null): HTMLButtonElement | null =>
    element instanceof HTMLButtonElement ? element : (element?.querySelector('button') ?? null);

  const accessibleName = (button: HTMLButtonElement | null): string =>
    button?.getAttribute('aria-label') ?? normalized(button);

  const all = (host: HTMLElement, testId: string): readonly HTMLElement[] => [
    ...host.querySelectorAll<HTMLElement>(`[data-testid="${testId}"]`),
  ];

  async function renderPosts(): Promise<{
    fixture: ComponentFixture<AdminBlog>;
    host: HTMLElement;
  }> {
    const { fixture } = await setup(
      makeBlogGateway({ getAllPostsForAdmin: () => of([PUBLISHED, DRAFT]) }),
    );
    return { fixture, host: fixture.nativeElement as HTMLElement };
  }

  it('Given the list When it renders Then the column headers are in French', async () => {
    const { host } = await renderPosts();
    const headers = [...(byTestId(host, 'admin-posts-list')?.querySelectorAll('th') ?? [])].map(
      (header) => normalized(header),
    );

    expect(headers.slice(0, 4)).toEqual(['Titre', 'Statut', 'Date', "J'aime"]);
  });

  it('Given a published and a draft article When the list renders Then each status is a stamp', async () => {
    const { host } = await renderPosts();

    expect(
      all(host, 'admin-post-status').map((status) => ({
        tag: status.tagName,
        text: normalized(status),
      })),
    ).toEqual([
      { tag: 'APP-STAMP', text: 'Publié' },
      { tag: 'APP-STAMP', text: 'Brouillon' },
    ]);
  });

  it('Given the list When it renders Then the edit and delete actions name their article', async () => {
    const { host } = await renderPosts();

    expect({
      edit: all(host, 'admin-post-edit').map((el) => accessibleName(nativeButton(el))),
      delete: all(host, 'admin-post-delete').map((el) => accessibleName(nativeButton(el))),
    }).toEqual({
      edit: ['Modifier\u00a0: Chiffrer côté client', 'Modifier\u00a0: De la fraiseuse à Angular'],
      delete: [
        'Supprimer\u00a0: Chiffrer côté client',
        'Supprimer\u00a0: De la fraiseuse à Angular',
      ],
    });
  });

  it('Given the list When the edit action of the second article is pressed Then that article opens in the form', async () => {
    const { fixture } = await renderPosts();

    await pressTestId(fixture, 'admin-post-edit', 1);

    expect(fixture.componentInstance.editing()).toEqual(DRAFT);
  });
});

describe('AdminBlog: la liste partagée est invalidée après une écriture', () => {
  async function writeWith(write: 'create' | 'update' | 'delete'): Promise<{
    invalidations: number;
    listSubscriptions: number;
  }> {
    const invalidateAdminPosts = vi.fn();
    const getAllPostsForAdmin = vi.fn(() => of([makeBlogPost({ id: 'b-1' })]));
    const { component, fixture } = await setup(
      makeBlogGateway({ getAllPostsForAdmin, invalidateAdminPosts }),
    );

    if (write === 'delete') component.remove('b-1');
    else
      await component.onSaved(
        { data: input(), file: null },
        write === 'update' ? 'b-1' : undefined,
      );
    await settleBounded(fixture);

    return {
      invalidations: invalidateAdminPosts.mock.calls.length,
      listSubscriptions: getAllPostsForAdmin.mock.calls.length,
    };
  }

  it.each(['create', 'update', 'delete'] as const)(
    'Given the list When a %s succeeds Then the shared admin list is invalidated once instead of being requested again',
    async (write) => {
      expect(await writeWith(write)).toEqual({ invalidations: 1, listSubscriptions: 1 });
    },
  );

  it('Given the list When a deletion fails Then the list is restored and only a successful deletion invalidates it', async () => {
    const invalidateAdminPosts = vi.fn();
    const deletePost = vi
      .fn<BlogGateway['deletePost']>()
      .mockReturnValueOnce(throwError(() => new Error('down')))
      .mockReturnValueOnce(of(undefined));
    const { component, fixture } = await setup(
      makeBlogGateway({
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

describe('AdminBlog: en-tête de page', () => {
  it('Given one published article and one draft When the page renders Then its single h1 is « Articles » under the overline « 2 articles · 1 publié · 1 brouillon »', async () => {
    const { fixture } = await setup(
      makeBlogGateway({
        getAllPostsForAdmin: () =>
          of([
            makeBlogPost({ id: 'b-1', status: 'published' }),
            makeBlogPost({ id: 'b-2', status: 'draft', publishedAt: null }),
          ]),
      }),
    );
    const host = fixture.nativeElement as HTMLElement;

    expect({
      overline: testIdText(host, 'admin-page-overline'),
      title: testIdText(host, 'admin-page-title'),
      headings: host.querySelectorAll('h1').length,
    }).toEqual({ overline: '2 articles · 1 publié · 1 brouillon', title: 'Articles', headings: 1 });
  });
});
