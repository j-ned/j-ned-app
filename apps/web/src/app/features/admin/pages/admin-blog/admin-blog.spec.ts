import { Component, LOCALE_ID, NO_ERRORS_SCHEMA } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import { Router, provideRouter } from '@angular/router';
import { NEVER, of, throwError, type Observable } from 'rxjs';
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

const normalized = (element: Element | null | undefined): string =>
  (element?.textContent ?? '').replace(/[ \t\n\r]+/g, ' ').replace(/^ | $/g, '');

const nativeButton = (element: Element | null): HTMLButtonElement | null =>
  element instanceof HTMLButtonElement ? element : (element?.querySelector('button') ?? null);

const accessibleName = (element: Element | null): string =>
  element?.getAttribute('aria-label') ?? normalized(element);

const all = (host: ParentNode, testId: string): readonly HTMLElement[] => [
  ...host.querySelectorAll<HTMLElement>(`[data-testid="${testId}"]`),
];

const words = (count: number): string => Array.from({ length: count }, () => 'mot').join(' ');

describe('AdminBlog', () => {
  it('charge les articles depuis le gateway', async () => {
    const { component } = await setup(
      withPosts([makeBlogPost({ id: '1' }), makeBlogPost({ id: '2' })]),
    );
    expect(component.posts().map((p) => p.id)).toEqual(['1', '2']);
  });

  it('affiche le statut en français et la date de publication au format court', async () => {
    const { fixture } = await setup(
      withPosts([
        makeBlogPost({ id: '1', status: 'published', publishedAt: '2026-09-09T10:00:00Z' }),
        makeBlogPost({ id: '2', status: 'draft', publishedAt: null }),
      ]),
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
        description: "L'article disparaît du blog dans la seconde. Cette action est définitive.",
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
    slug: 'chiffrer-cote-client',
    title: 'Chiffrement côté client',
    status: 'published',
    publishedAt: '2026-09-09T10:00:00Z',
  });
  const DRAFT = makeBlogPost({
    id: 'b-2',
    slug: 'de-la-fraiseuse-a-angular',
    title: 'De la fraiseuse à Angular',
    status: 'draft',
    publishedAt: null,
  });

  async function renderPosts(): Promise<{
    fixture: ComponentFixture<AdminBlog>;
    host: HTMLElement;
  }> {
    const { fixture } = await setup(withPosts([PUBLISHED, DRAFT]));
    return { fixture, host: fixture.nativeElement as HTMLElement };
  }

  it('Given the list When it renders Then the column headers are in French', async () => {
    const { host } = await renderPosts();
    const headers = [...(byTestId(host, 'admin-posts-list')?.querySelectorAll('th') ?? [])].map(
      (header) => normalized(header),
    );

    expect(headers.slice(0, 5)).toEqual(['Article', 'Statut', 'Publié le', 'Lecture', "J'aime"]);
  });

  it('Given a published and a draft article When the list renders Then each status is a stamp, the draft one dashed', async () => {
    const { host } = await renderPosts();

    expect(
      all(host, 'admin-post-status').map((status) => ({
        tag: status.tagName,
        text: normalized(status),
        dashed: status.classList.contains('border-dashed'),
      })),
    ).toEqual([
      { tag: 'APP-STAMP', text: 'Publié', dashed: false },
      { tag: 'APP-STAMP', text: 'Brouillon', dashed: true },
    ]);
  });

  it('Given the list When it renders Then the edit links and delete actions name their article', async () => {
    const { host } = await renderPosts();

    expect({
      edit: all(host, 'admin-post-edit').map((link) => ({
        tag: link.tagName,
        name: accessibleName(link),
        href: link.getAttribute('href'),
      })),
      delete: all(host, 'admin-post-delete').map((el) => accessibleName(nativeButton(el))),
    }).toEqual({
      edit: [
        { tag: 'A', name: 'Modifier\u00a0: Chiffrement côté client', href: '/admin/blog/b-1' },
        { tag: 'A', name: 'Modifier\u00a0: De la fraiseuse à Angular', href: '/admin/blog/b-2' },
      ],
      delete: [
        'Supprimer\u00a0: Chiffrement côté client',
        'Supprimer\u00a0: De la fraiseuse à Angular',
      ],
    });
  });

  it('Given the list When the edit link of the second article is followed Then its editing page opens', async () => {
    const { fixture, host } = await renderPosts();

    all(host, 'admin-post-edit')[1]?.click();
    await settleBounded(fixture);

    expect(TestBed.inject(Router).url).toBe('/admin/blog/b-2');
  });

  it('Given the page When « Nouvel article » is followed Then the creation page opens', async () => {
    const { fixture, host } = await renderPosts();
    const link = byTestId(host, 'admin-post-new');
    const before = { tag: link?.tagName, text: normalized(link), href: link?.getAttribute('href') };

    link?.click();
    await settleBounded(fixture);

    expect({ ...before, url: TestBed.inject(Router).url }).toEqual({
      tag: 'A',
      text: 'Nouvel article',
      href: '/admin/blog/new',
      url: '/admin/blog/new',
    });
  });

  it('Given the list When it renders Then only the published article can be read online, in a new tab', async () => {
    const { host } = await renderPosts();

    expect(
      all(host, 'admin-post-view').map((link) => ({
        tag: link.tagName,
        href: link.getAttribute('href'),
        target: link.getAttribute('target'),
        noopener: link.getAttribute('rel')?.split(/\s+/).includes('noopener') ?? false,
        name: accessibleName(link),
      })),
    ).toEqual([
      {
        tag: 'A',
        href: '/blog/chiffrer-cote-client',
        target: '_blank',
        noopener: true,
        name: 'Lire en ligne\u00a0: Chiffrement côté client (nouvel onglet)',
      },
    ]);
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

describe('AdminBlog: en-tête de page', () => {
  it('Given one published article and one draft When the page renders Then its single h1 is « Articles » under the overline « 2 articles · 1 publié · 1 brouillon »', async () => {
    const { fixture } = await setup(
      withPosts([
        makeBlogPost({ id: 'b-1', status: 'published' }),
        makeBlogPost({ id: 'b-2', status: 'draft', publishedAt: null }),
      ]),
    );
    const host = fixture.nativeElement as HTMLElement;

    expect({
      overline: testIdText(host, 'admin-page-overline'),
      title: testIdText(host, 'admin-page-title'),
      headings: host.querySelectorAll('h1').length,
    }).toEqual({ overline: '2 articles · 1 publié · 1 brouillon', title: 'Articles', headings: 1 });
  });

  it('Given the list When the page renders Then its introduction says a published article shows on the site within a second, on reload', async () => {
    const { fixture } = await setup(withPosts([makeBlogPost({ id: 'b-1' })]));
    const host = fixture.nativeElement as HTMLElement;

    expect(normalized(byTestId(host, 'admin-page-title')?.nextElementSibling)).toBe(
      "Les articles du blog. Un article publié est visible sur le site au plus une seconde après l'enregistrement, au rechargement de la page.",
    );
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

const postsTable = (host: HTMLElement): HTMLTableElement | null => {
  const list = byTestId(host, 'admin-posts-list');
  return list instanceof HTMLTableElement ? list : (list?.querySelector('table') ?? null);
};

const rowTitles = (host: HTMLElement): readonly string[] =>
  all(host, 'admin-post-row').map((row) => testIdText(row, 'admin-post-title'));

describe('AdminBlog: tableau éditorial', () => {
  it('Given three articles When the table renders Then it is captioned for assistive technologies, newest first, with column headers', async () => {
    const { host } = await renderTable();
    const table = postsTable(host);
    const caption = table?.querySelector('caption');

    expect({
      caption: normalized(caption),
      captionHidden: caption?.classList.contains('sr-only') ?? false,
      scopes: [...(table?.querySelectorAll('thead th') ?? [])].map((th) =>
        th.getAttribute('scope'),
      ),
    }).toEqual({
      caption: 'Articles, du plus récent au plus ancien',
      captionHidden: true,
      scopes: ['col', 'col', 'col', 'col', 'col', 'col'],
    });
  });

  it('Given three articles When the table renders Then each row reads its title, its first three subjects, its date, reading time and likes', async () => {
    const { host } = await renderTable();

    expect(
      all(host, 'admin-post-row').map((row) => ({
        title: testIdText(row, 'admin-post-title'),
        subjects: testIdText(row, 'admin-post-subjects'),
        date: byTestId(row, 'admin-post-unpublished') ? null : testIdText(row, 'admin-post-date'),
        readingTime: testIdText(row, 'admin-post-reading-time'),
        likes: testIdText(row, 'admin-post-likes'),
      })),
    ).toEqual([
      {
        title: 'Chiffrement côté client',
        subjects: 'Chiffrement · AES-256-GCM · PBKDF2',
        date: '9 sept. 2026',
        readingTime: '13\u00a0min',
        likes: '0',
      },
      {
        title: 'De 20 ans de métallurgie à développeur Full-Stack',
        subjects: 'Reconversion · Parcours · Angular',
        date: '1 sept. 2026',
        readingTime: '8\u00a0min',
        likes: '2',
      },
      {
        title: 'Signal Forms en production',
        subjects: 'Angular · Tests',
        date: null,
        readingTime: '5\u00a0min',
        likes: '0',
      },
    ]);
  });

  it('Given a draft When its row renders Then its date cell tells assistive technologies it is not published', async () => {
    const { host } = await renderTable();
    const unpublished = all(host, 'admin-post-row')[2]?.querySelector(
      '[data-testid="admin-post-date"] [data-testid="admin-post-unpublished"]',
    );

    expect({
      text: normalized(unpublished),
      hidden: unpublished?.classList.contains('sr-only') ?? false,
    }).toEqual({ text: 'non publié', hidden: true });
  });

  it('Given three articles When the table renders Then the covers are decorative thumbnails, absent for the article without cover', async () => {
    const { host } = await renderTable();

    expect(
      all(host, 'admin-post-row').map((row) => {
        const image = byTestId(row, 'admin-post-cover')?.querySelector('img');
        return image ? { src: image.getAttribute('src'), alt: image.getAttribute('alt') } : null;
      }),
    ).toEqual([
      { src: 'https://cdn.test/blog/b-1.avif', alt: '' },
      { src: 'https://cdn.test/blog/b-2.avif', alt: '' },
      null,
    ]);
  });
});

describe('AdminBlog: tri par date de publication', () => {
  const publishedHeader = (host: HTMLElement): HTMLElement | null =>
    byTestId(host, 'sort-published')?.closest('th') ?? null;

  const sortStates = (host: HTMLElement): readonly (string | null)[] =>
    [...(byTestId(host, 'admin-posts-list')?.querySelectorAll('thead th') ?? [])].map((th) =>
      th.getAttribute('aria-sort'),
    );

  it('Given the table When it renders Then only « Publié le » is sortable, announced descending, through a button', async () => {
    const { host } = await renderTable();
    const sort = byTestId(host, 'sort-published');

    expect({
      states: sortStates(host),
      button: { tag: sort?.tagName, type: sort?.getAttribute('type'), text: normalized(sort) },
      header: normalized(publishedHeader(host)),
    }).toEqual({
      states: [null, null, 'descending', null, null, null],
      button: { tag: 'BUTTON', type: 'button', text: 'Publié le' },
      header: 'Publié le',
    });
  });

  it('Given the newest first When « Publié le » is pressed Then the oldest comes first, the draft stays last, and the order is announced', async () => {
    const { fixture, host } = await renderTable();

    await pressTestId(fixture, 'sort-published');

    expect({
      titles: rowTitles(host),
      sort: publishedHeader(host)?.getAttribute('aria-sort'),
      caption: normalized(postsTable(host)?.querySelector('caption')),
    }).toEqual({
      titles: [
        'De 20 ans de métallurgie à développeur Full-Stack',
        'Chiffrement côté client',
        'Signal Forms en production',
      ],
      sort: 'ascending',
      caption: 'Articles, du plus ancien au plus récent',
    });
  });

  it('Given the oldest first When « Publié le » is pressed again Then the newest come first again', async () => {
    const { fixture, host } = await renderTable();

    await pressTestId(fixture, 'sort-published');
    await pressTestId(fixture, 'sort-published');

    expect({
      titles: rowTitles(host),
      sort: publishedHeader(host)?.getAttribute('aria-sort'),
    }).toEqual({
      titles: [
        'Chiffrement côté client',
        'De 20 ans de métallurgie à développeur Full-Stack',
        'Signal Forms en production',
      ],
      sort: 'descending',
    });
  });
});

describe('AdminBlog: filtre par statut', () => {
  const readFilters = (
    host: HTMLElement,
  ): { label: string | null; options: readonly Record<string, string | null>[] } => ({
    label: byTestId(host, 'filter-group')?.getAttribute('aria-label') ?? null,
    options: all(host, 'filter-option').map((option) => ({
      label: testIdText(option, 'filter-option-label'),
      count: testIdText(option, 'filter-option-count'),
      pressed: option.getAttribute('aria-pressed'),
      disabled: option.getAttribute('aria-disabled'),
    })),
  });

  it('Given two published articles and one draft When the page renders Then the status filter counts them, « Tous » pressed', async () => {
    const { host } = await renderTable();

    expect(readFilters(host)).toEqual({
      label: 'Filtrer par statut',
      options: [
        { label: 'Tous', count: '3', pressed: 'true', disabled: null },
        { label: 'Publiés', count: '2', pressed: 'false', disabled: null },
        { label: 'Brouillons', count: '1', pressed: 'false', disabled: null },
      ],
    });
  });

  it('Given published articles only When the page renders Then « Brouillons » is disabled', async () => {
    const { host } = await setup(withPosts([CHIFFREMENT, METALLURGIE])).then(({ fixture }) => ({
      host: fixture.nativeElement as HTMLElement,
    }));

    expect(readFilters(host).options.map((option) => option['disabled'])).toEqual([
      null,
      null,
      'true',
    ]);
  });

  it.each([
    {
      index: 1,
      filter: 'Publiés',
      titles: ['Chiffrement côté client', 'De 20 ans de métallurgie à développeur Full-Stack'],
    },
    { index: 2, filter: 'Brouillons', titles: ['Signal Forms en production'] },
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

  it('Given the drafts filtered When « Tous » is pressed again Then every article is back', async () => {
    const { fixture, host } = await renderTable();

    await pressTestId(fixture, 'filter-option', 2);
    await pressTestId(fixture, 'filter-option', 0);

    expect(rowTitles(host)).toEqual([
      'Chiffrement côté client',
      'De 20 ans de métallurgie à développeur Full-Stack',
      'Signal Forms en production',
    ]);
  });
});

describe('AdminBlog: petit écran', () => {
  const hasAll = (element: Element | null | undefined, tokens: readonly string[]): boolean =>
    tokens.every((token) => element?.classList.contains(token) ?? false);

  it('Given the table When it renders Then the date, reading time and likes columns only show from md', async () => {
    const { host } = await renderTable();
    const row = all(host, 'admin-post-row')[0];
    const headers = [...(byTestId(host, 'admin-posts-list')?.querySelectorAll('thead th') ?? [])];

    expect({
      headers: headers.slice(2, 5).map((th) => hasAll(th, ['hidden', 'md:table-cell'])),
      cells: ['admin-post-date', 'admin-post-reading-time', 'admin-post-likes'].map((testId) =>
        hasAll(row && byTestId(row, testId)?.closest('td'), ['hidden', 'md:table-cell']),
      ),
    }).toEqual({ headers: [true, true, true], cells: [true, true, true] });
  });

  it('Given the table When it renders Then the article cell repeats date, reading time and likes below md', async () => {
    const { host } = await renderTable();
    const metas = all(host, 'admin-post-row').map((row) => byTestId(row, 'admin-post-meta'));

    expect({
      texts: metas.map((meta) => normalized(meta)),
      belowMdOnly: metas.map((meta) => meta?.classList.contains('md:hidden') ?? false),
    }).toEqual({
      texts: [
        "9 sept. 2026 · 13\u00a0min · 0\u00a0j'aime",
        "1 sept. 2026 · 8\u00a0min · 2\u00a0j'aime",
        "Non publié · 5\u00a0min · 0\u00a0j'aime",
      ],
      belowMdOnly: [true, true, true],
    });
  });

  it('Given the table When it renders Then the thumbnail only shows from sm', async () => {
    const { host } = await renderTable();

    expect(
      all(host, 'admin-post-row').map((row) =>
        hasAll(byTestId(row, 'admin-post-cover'), ['hidden', 'sm:block']),
      ),
    ).toEqual([true, true, true]);
  });

  it('Given the list When it renders Then nothing forces a horizontal scroll', async () => {
    const { host } = await renderTable();
    const list = byTestId(host, 'admin-posts-list');
    const tokens = [list, ...(list?.querySelectorAll('*') ?? [])].flatMap((element) =>
      element ? [...element.classList] : [],
    );

    expect(tokens.filter((token) => /^(min-w-max|overflow-x-auto)$/.test(token))).toEqual([]);
  });
});
