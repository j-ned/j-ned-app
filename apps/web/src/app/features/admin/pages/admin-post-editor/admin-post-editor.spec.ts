import { Component } from '@angular/core';
import { Location } from '@angular/common';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Router, provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { of, throwError, type Observable } from 'rxjs';
import type { Mock } from 'vitest';
import { BlogGateway } from '@features/blog/domain/gateways/blog.gateway';
import type { BlogPost, BlogPostInput } from '@features/blog/domain/models/blog-post.model';
import type { ContentImage } from '@features/blog/domain/models/content-image.model';
import { makeBlogPost, makeContentImage } from '@features/blog/testing/blog-post-builders';
import { stubBlogGateway } from '@features/blog/testing/stub-blog-gateway';
import { apiRejection } from '@shared/testing/api-rejection';
import { byTestId, testIdText } from '@shared/testing/by-test-id';
import { captureCrash } from '@shared/testing/capture-crash';
import { pressTestId } from '@shared/testing/press-test-id';
import { settle, settleBounded } from '@shared/testing/settle';
import { FileDropzone } from '@shared/ui/file-dropzone';
import { ToastStore } from '@core/notifications/toast-store';
import type { ToastMessage } from '@shared/ui/toast.types';
import { answerConfirmDialog, readConfirmDialog } from '@shared/ui/testing/confirm-dialog-page';
import { AdminPostEditor } from './admin-post-editor';
import {
  BODY_IMAGE_FILE,
  insertBodyImage,
} from '../../application/testing/content-image-panel-page';
import { unsavedChangesGuard } from '../../application/unsaved-changes-guard';

@Component({ template: '' })
class BlankPage {}

const CHIFFREMENT = makeBlogPost({
  id: 'b-1',
  slug: 'chiffrement-cote-client',
  title: 'Chiffrement côté client',
  excerpt: 'Le cas DashFlow.',
  contentMarkdown: '## AES-256-GCM\n\nUn IV unique.',
  tags: ['Chiffrement'],
  status: 'published',
  publishedAt: '2026-09-09T10:00:00Z',
});

const FRAISEUSE = makeBlogPost({
  id: 'b-2',
  slug: 'de-la-fraiseuse-a-angular',
  title: 'De la fraiseuse à Angular',
  status: 'draft',
  publishedAt: null,
});

type Spies = {
  readonly getAllPostsForAdmin: Mock<BlogGateway['getAllPostsForAdmin']>;
  readonly createPost: Mock<BlogGateway['createPost']>;
  readonly updatePost: Mock<BlogGateway['updatePost']>;
  readonly uploadCoverImage: Mock<BlogGateway['uploadCoverImage']>;
  readonly uploadContentImage: Mock<BlogGateway['uploadContentImage']>;
  readonly invalidateAdminPosts: Mock<BlogGateway['invalidateAdminPosts']>;
  readonly toast: Mock<ToastStore['add']>;
};

type Editor = Spies & {
  readonly harness: RouterTestingHarness;
  readonly fixture: ComponentFixture<unknown>;
  readonly host: HTMLElement;
  readonly crash: unknown;
};

type Overrides = Partial<Omit<Spies, 'toast'>>;

async function openEditor(url: string, overrides: Overrides = {}): Promise<Editor> {
  const spies: Spies = {
    getAllPostsForAdmin: vi.fn((): Observable<readonly BlogPost[]> => of([CHIFFREMENT, FRAISEUSE])),
    createPost: vi.fn((): Observable<BlogPost> => of(makeBlogPost({ id: 'b-9', title: 'X' }))),
    updatePost: vi.fn((): Observable<BlogPost> => of(CHIFFREMENT)),
    uploadCoverImage: vi.fn((): Observable<string> => of('blog/b-9.avif')),
    uploadContentImage: vi.fn((): Observable<ContentImage> => of(makeContentImage())),
    invalidateAdminPosts: vi.fn(),
    toast: vi.fn(),
    ...overrides,
  };
  TestBed.configureTestingModule({
    providers: [
      provideRouter(
        [
          {
            path: 'admin/blog/new',
            component: AdminPostEditor,
            canDeactivate: [unsavedChangesGuard],
          },
          {
            path: 'admin/blog/:id',
            component: AdminPostEditor,
            canDeactivate: [unsavedChangesGuard],
          },
          { path: 'admin/blog', component: BlankPage },
          { path: 'blog/:slug', component: BlankPage },
        ],
        withComponentInputBinding(),
      ),
      {
        provide: BlogGateway,
        useValue: stubBlogGateway({
          getAllPostsForAdmin: spies.getAllPostsForAdmin,
          createPost: spies.createPost,
          updatePost: spies.updatePost,
          uploadCoverImage: spies.uploadCoverImage,
          uploadContentImage: spies.uploadContentImage,
          invalidateAdminPosts: spies.invalidateAdminPosts,
        }),
      },
      { provide: ToastStore, useValue: { add: spies.toast } },
    ],
  });
  const harness = await RouterTestingHarness.create();
  const crash = await captureCrash(async () => {
    await harness.navigateByUrl(url);
    await settleBounded(harness.fixture);
  });
  return {
    ...spies,
    harness,
    fixture: harness.fixture,
    host: harness.fixture.nativeElement as HTMLElement,
    crash,
  };
}

const normalized = (element: Element | null | undefined): string =>
  (element?.textContent ?? '').replace(/[ \t\n\r]+/g, ' ').replace(/^ | $/g, '');

const nativeButton = (element: Element | null): HTMLButtonElement | null =>
  element instanceof HTMLButtonElement ? element : (element?.querySelector('button') ?? null);

const fieldValue = (host: HTMLElement, testId: string): string | undefined =>
  (byTestId(host, testId) as HTMLInputElement | HTMLTextAreaElement | null)?.value;

async function typeIn(editor: Editor, testId: string, text: string): Promise<void> {
  const control = byTestId(editor.host, testId) as HTMLInputElement | HTMLTextAreaElement | null;
  if (!control) return;
  control.value = text;
  control.dispatchEvent(new Event('input'));
  control.dispatchEvent(new Event('change'));
  await settle(editor.fixture);
}

async function fillNewPost(editor: Editor): Promise<void> {
  await typeIn(editor, 'admin-post-title', 'Nouveau');
  await typeIn(editor, 'admin-post-excerpt', 'Résumé');
  await typeIn(editor, 'admin-post-content', '# Contenu');
}

async function chooseCover(editor: Editor, file: File): Promise<void> {
  editor.fixture.debugElement
    .query(By.directive(FileDropzone))
    ?.triggerEventHandler('fileSelected', file);
  await settle(editor.fixture);
}

async function choosePublished(editor: Editor): Promise<void> {
  byTestId(editor.host, 'admin-post-status-published')?.click();
  await settle(editor.fixture);
}

async function typeTag(editor: Editor, text: string): Promise<void> {
  const input = byTestId(editor.host, 'tags-input') as HTMLInputElement;
  input.focus();
  input.value = text;
  input.dispatchEvent(new Event('input', { bubbles: true }));
  await settle(editor.fixture);
}

async function addSubject(editor: Editor, name: string): Promise<void> {
  await typeTag(editor, name);
  byTestId(editor.host, 'tags-input')?.dispatchEvent(
    new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }),
  );
  await settle(editor.fixture);
}

const tagOptions = (editor: Editor): readonly string[] =>
  [...editor.host.querySelectorAll('[data-testid="tag-option"]')].map(normalized);

async function save(editor: Editor): Promise<void> {
  await pressTestId(editor.fixture, 'savebar-submit');
  await settleBounded(editor.fixture);
}

async function followBreadcrumb(editor: Editor): Promise<void> {
  byTestId(editor.host, 'admin-breadcrumb-parent')?.click();
  await settleBounded(editor.fixture);
}

const COVER = new File(['x'], 'cover.png', { type: 'image/png' });

const toasts = (toast: Spies['toast']): readonly ToastMessage[] =>
  toast.mock.calls.map(([message]) => message);

const saveBarState = (editor: Editor): string => normalized(byTestId(editor.host, 'savebar-state'));

const tocStates = (editor: Editor): readonly string[] =>
  [...editor.host.querySelectorAll('[data-testid="form-toc-link"]')].map((link) =>
    normalized(byTestId(link, 'form-toc-state')),
  );

describe('AdminPostEditor: ouverture', () => {
  it.each([{ url: '/admin/blog/b-1', title: 'Chiffrement côté client' }])(
    'Given the admin list of articles When $url is opened Then that article is found in the list and its form filled',
    async ({ url, title }) => {
      const editor = await openEditor(url);

      expect({
        crash: editor.crash,
        requested: editor.getAllPostsForAdmin.mock.calls.length,
        field: fieldValue(editor.host, 'admin-post-title'),
      }).toEqual({
        crash: null,
        requested: 1,
        field: title,
      });
    },
  );

  it('Given /admin/blog/new When it is opened Then only the list is read for its tags, the form is an empty draft', async () => {
    const editor = await openEditor('/admin/blog/new');

    expect({
      crash: editor.crash,
      requested: editor.getAllPostsForAdmin.mock.calls.length,
      field: fieldValue(editor.host, 'admin-post-title'),
      draft: (byTestId(editor.host, 'admin-post-status-draft') as HTMLInputElement | null)?.checked,
    }).toEqual({
      crash: null,
      requested: 1,
      field: '',
      draft: true,
    });
  });
});

describe('AdminPostEditor: chargement, erreur et introuvable', () => {
  it('Given the list failed to load When Réessayer is pressed Then it is requested again and the form shows', async () => {
    const getAllPostsForAdmin = vi
      .fn<BlogGateway['getAllPostsForAdmin']>()
      .mockReturnValueOnce(throwError(() => new Error('down')))
      .mockReturnValue(of([CHIFFREMENT]));
    const editor = await openEditor('/admin/blog/b-1', { getAllPostsForAdmin });

    const crash = await captureCrash(() => pressTestId(editor.fixture, 'load-error-retry'));

    expect({
      crash,
      calls: getAllPostsForAdmin.mock.calls.length,
      field: fieldValue(editor.host, 'admin-post-title'),
    }).toEqual({ crash: null, calls: 2, field: 'Chiffrement côté client' });
  });
});

describe('AdminPostEditor: enregistrer', () => {
  it('Given an empty new article When « Enregistrer » is pressed Then nothing is created', async () => {
    const editor = await openEditor('/admin/blog/new');

    await save(editor);

    expect(editor.createPost.mock.calls.length).toBe(0);
  });
});

describe('AdminPostEditor: tags suggérés', () => {
  const TAGGED = [
    makeBlogPost({ id: 'b-1', tags: ['Chiffrement'] }),
    makeBlogPost({ id: 'b-3', tags: ['Playwright', 'Freelance'] }),
  ];

  it.each(['/admin/blog/new'])(
    'Given articles tagged outside the catalogue When %s is opened and "pl" typed Then their tags are suggested next to the catalogue',
    async (url) => {
      const editor = await openEditor(url, {
        getAllPostsForAdmin: vi.fn((): Observable<readonly BlogPost[]> => of(TAGGED)),
      });

      await typeTag(editor, 'pl');

      expect(tagOptions(editor)).toEqual(['Playwright']);
    },
  );

  it('Given the list fails to load When a new article is written Then the catalogue is still suggested', async () => {
    const editor = await openEditor('/admin/blog/new', {
      getAllPostsForAdmin: vi.fn((): Observable<readonly BlogPost[]> =>
        throwError(() => new Error('réseau')),
      ),
    });

    await typeTag(editor, 'angu');

    expect({ crash: editor.crash, options: tagOptions(editor) }).toEqual({
      crash: null,
      options: ['Angular'],
    });
  });
});

describe('AdminPostEditor: création', () => {
  it('Given a filled new article When it is saved Then the article is created with the typed payload', async () => {
    const editor = await openEditor('/admin/blog/new');

    await fillNewPost(editor);
    await addSubject(editor, 'Angular');
    await save(editor);

    expect(editor.createPost.mock.calls).toEqual([
      [
        {
          title: 'Nouveau',
          excerpt: 'Résumé',
          contentMarkdown: '# Contenu',
          tags: ['Angular'],
          status: 'draft',
        } satisfies BlogPostInput,
      ],
    ]);
  });

  it('Given a created article When the save ends Then the shared list is invalidated, success is told and the page moves to its address in place of /new', async () => {
    const editor = await openEditor('/admin/blog/new');
    const replaceState = vi.spyOn(TestBed.inject(Location), 'replaceState');

    await fillNewPost(editor);
    await save(editor);

    expect({
      invalidations: editor.invalidateAdminPosts.mock.calls.length,
      toasts: toasts(editor.toast),
      url: TestBed.inject(Router).url,
      replaced: replaceState.mock.calls.map(([path]) => path),
    }).toEqual({
      invalidations: 1,
      toasts: [{ severity: 'success', detail: 'Article enregistré' }],
      url: '/admin/blog/b-9',
      replaced: ['/admin/blog/b-9'],
    });
  });

  it('Given a cover chosen for a new article When it is saved Then the cover is uploaded for the created id, after the creation', async () => {
    const editor = await openEditor('/admin/blog/new');

    await fillNewPost(editor);
    await chooseCover(editor, COVER);
    await save(editor);

    expect({
      uploads: editor.uploadCoverImage.mock.calls,
      afterCreation:
        (editor.uploadCoverImage.mock.invocationCallOrder[0] ?? 0) >
        (editor.createPost.mock.invocationCallOrder[0] ?? Infinity),
    }).toEqual({ uploads: [[COVER, 'b-9']], afterCreation: true });
  });

  it('Given the creation fails When the article is saved Then an error is told, nothing is invalidated and the page stays on /new', async () => {
    const editor = await openEditor('/admin/blog/new', {
      createPost: vi.fn((): Observable<BlogPost> => throwError(() => new Error('boom'))),
    });

    await fillNewPost(editor);
    await chooseCover(editor, COVER);
    await save(editor);

    expect({
      toasts: toasts(editor.toast),
      url: TestBed.inject(Router).url,
      invalidations: editor.invalidateAdminPosts.mock.calls.length,
      uploads: editor.uploadCoverImage.mock.calls.length,
    }).toEqual({
      toasts: [{ severity: 'error', detail: "Erreur lors de l'enregistrement de l'article" }],
      url: '/admin/blog/new',
      invalidations: 0,
      uploads: 0,
    });
  });

  it('Given the cover upload fails after the creation When the article is saved Then a warning then the save are told and the page still moves to the created article', async () => {
    const editor = await openEditor('/admin/blog/new', {
      uploadCoverImage: vi.fn((): Observable<string> => throwError(() => new Error('upload'))),
    });

    await fillNewPost(editor);
    await chooseCover(editor, COVER);
    await save(editor);

    expect({
      severities: toasts(editor.toast).map((toast) => toast.severity),
      url: TestBed.inject(Router).url,
    }).toEqual({ severities: ['warn', 'success'], url: '/admin/blog/b-9' });
  });
});

describe('AdminPostEditor: mise à jour', () => {
  it('Given an edited title When the article is saved Then it is updated, success is told, the list invalidated without being requested again, and the title follows', async () => {
    const editor = await openEditor('/admin/blog/b-1', {
      updatePost: vi.fn((): Observable<BlogPost> =>
        of(makeBlogPost({ ...CHIFFREMENT, title: 'Après' })),
      ),
    });

    await typeIn(editor, 'admin-post-title', 'Après');
    await save(editor);

    expect({
      updated: editor.updatePost.mock.calls.map(([id, payload]) => [id, payload.title]),
      uploads: editor.uploadCoverImage.mock.calls.length,
      toasts: toasts(editor.toast),
      invalidations: editor.invalidateAdminPosts.mock.calls.length,
      requested: editor.getAllPostsForAdmin.mock.calls.length,
      title: testIdText(editor.host, 'admin-page-title'),
      url: TestBed.inject(Router).url,
    }).toEqual({
      updated: [['b-1', 'Après']],
      uploads: 0,
      toasts: [{ severity: 'success', detail: 'Article enregistré' }],
      invalidations: 1,
      requested: 1,
      title: 'Après',
      url: '/admin/blog/b-1',
    });
  });

  it('Given a new cover for an existing article When it is saved Then the article is updated first, then the cover uploaded for its id', async () => {
    const editor = await openEditor('/admin/blog/b-1');

    await chooseCover(editor, COVER);
    await save(editor);

    expect({
      uploads: editor.uploadCoverImage.mock.calls,
      updates: editor.updatePost.mock.calls.length,
      updateFirst:
        (editor.updatePost.mock.invocationCallOrder[0] ?? Infinity) <
        (editor.uploadCoverImage.mock.invocationCallOrder[0] ?? 0),
    }).toEqual({ uploads: [[COVER, 'b-1']], updates: 1, updateFirst: true });
  });

  it('Given the cover upload fails after the update When the save ends Then the list is not requested again', async () => {
    const editor = await openEditor('/admin/blog/b-1', {
      uploadCoverImage: vi.fn((): Observable<string> => throwError(() => new Error('upload'))),
    });

    await chooseCover(editor, COVER);
    await save(editor);

    expect(editor.getAllPostsForAdmin.mock.calls.length).toBe(1);
  });

  it('Given the update fails When the article is saved Then an error is told, no cover is sent and the title is unchanged', async () => {
    const editor = await openEditor('/admin/blog/b-1', {
      updatePost: vi.fn((): Observable<BlogPost> => throwError(() => new Error('boom'))),
    });

    await typeIn(editor, 'admin-post-title', 'Après');
    await chooseCover(editor, COVER);
    await save(editor);

    expect({
      toasts: toasts(editor.toast),
      uploads: editor.uploadCoverImage.mock.calls.length,
      invalidations: editor.invalidateAdminPosts.mock.calls.length,
      title: testIdText(editor.host, 'admin-page-title'),
    }).toEqual({
      toasts: [{ severity: 'error', detail: "Erreur lors de l'enregistrement de l'article" }],
      uploads: 0,
      invalidations: 0,
      title: 'Chiffrement côté client',
    });
  });
});

describe('AdminPostEditor: détail du refus de l’API', () => {
  const VALIDATION = [
    'excerpt should not be empty',
    'title should not be empty',
    'title should not be empty',
  ];
  const LABEL = "Erreur lors de l'enregistrement de l'article";

  it.each([
    {
      given: 'the creation refused with a 400',
      url: '/admin/blog/new',
      overrides: {
        createPost: vi.fn((): Observable<BlogPost> =>
          throwError(() => apiRejection(400, VALIDATION)),
        ),
      },
      expected: `${LABEL}\u00a0: excerpt should not be empty; title should not be empty`,
    },
    {
      given: 'the creation failing with a 500',
      url: '/admin/blog/new',
      overrides: {
        createPost: vi.fn((): Observable<BlogPost> =>
          throwError(() => apiRejection(500, 'Internal server error')),
        ),
      },
      expected: LABEL,
    },
  ])(
    'Given $given When the article is saved Then the toast reads the label and only a validation detail',
    async ({ url, overrides, expected }) => {
      const editor = await openEditor(url, overrides);

      if (url.endsWith('/new')) await fillNewPost(editor);
      else await typeIn(editor, 'admin-post-title', 'Après');
      await save(editor);

      expect(toasts(editor.toast)).toEqual([{ severity: 'error', detail: expected }]);
    },
  );

  it('Given the cover refused with a 400 When the article is saved Then the warning names the refusal', async () => {
    const editor = await openEditor('/admin/blog/new', {
      uploadCoverImage: vi.fn((): Observable<string> =>
        throwError(() => apiRejection(400, 'file must be an image')),
      ),
    });

    await fillNewPost(editor);
    await chooseCover(editor, COVER);
    await save(editor);

    expect(toasts(editor.toast)[0]).toEqual({
      severity: 'warn',
      detail:
        "Article enregistré, mais l'image de couverture n'a pas été envoyée. file must be an image.",
    });
  });
});

describe('AdminPostEditor: couverture retirée ou refusée', () => {
  async function pickInZone(editor: Editor, file: File): Promise<void> {
    const input = editor.host.querySelector<HTMLInputElement>(
      '[data-testid="admin-post-cover"] input[type="file"]',
    );
    if (input) {
      Object.defineProperty(input, 'files', { value: [file], configurable: true });
      input.dispatchEvent(new Event('change'));
    }
    await settle(editor.fixture);
  }

  const inZone = (editor: Editor, testId: string): HTMLElement | null =>
    editor.host.querySelector(`[data-testid="admin-post-cover"] [data-testid="${testId}"]`);

  it('Given a cover chosen then removed from the dropzone When the article is saved Then no cover is sent', async () => {
    const editor = await openEditor('/admin/blog/b-1');
    await pickInZone(editor, COVER);
    const chosen = inZone(editor, 'file-dropzone-replace') !== null;

    inZone(editor, 'file-dropzone-clear')?.click();
    await settle(editor.fixture);
    await save(editor);

    expect({ chosen, uploads: editor.uploadCoverImage.mock.calls.length }).toEqual({
      chosen: true,
      uploads: 0,
    });
  });

  it('Given a file that is not an image When it is dropped in the cover zone Then the page says so and the zone empties', async () => {
    const editor = await openEditor('/admin/blog/b-1');

    await pickInZone(editor, new File(['%PDF'], 'notes.pdf', { type: 'application/pdf' }));

    expect({
      toasts: toasts(editor.toast),
      replace: inZone(editor, 'file-dropzone-replace'),
      trigger: inZone(editor, 'file-dropzone-trigger') !== null,
      name: normalized(editor.host).includes('notes.pdf'),
    }).toEqual({
      toasts: [{ severity: 'error', detail: 'Seules les images sont acceptées.' }],
      replace: null,
      trigger: true,
      name: false,
    });
  });

  it('Given a cover chosen then a refused file When the article is saved Then the earlier cover is not sent', async () => {
    const editor = await openEditor('/admin/blog/b-1');
    await pickInZone(editor, COVER);

    await pickInZone(editor, new File(['%PDF'], 'notes.pdf', { type: 'application/pdf' }));
    await save(editor);

    expect(editor.uploadCoverImage.mock.calls.length).toBe(0);
  });
});

describe('AdminPostEditor: modifications non enregistrées', () => {
  it('Given an article When it is opened untouched Then nothing is reported as changed', async () => {
    const editor = await openEditor('/admin/blog/b-1');

    expect({ state: saveBarState(editor), toc: tocStates(editor) }).toEqual({
      state: 'Aucune modification',
      toc: ['', '', '', ''],
    });
  });

  it.each([
    {
      edit: 'the title',
      act: (editor: Editor): Promise<void> => typeIn(editor, 'admin-post-title', 'Après'),
      toc: ['modifié', '', '', ''],
    },
    {
      edit: 'the content',
      act: (editor: Editor): Promise<void> => typeIn(editor, 'admin-post-content', '## Autre'),
      toc: ['', 'modifié', '', ''],
    },
    {
      edit: 'the status',
      act: async (editor: Editor): Promise<void> => {
        byTestId(editor.host, 'admin-post-status-draft')?.click();
        await settle(editor.fixture);
      },
      toc: ['', '', '', 'modifié'],
    },
  ])(
    'Given an opened article When $edit is changed Then one change is reported and its section is marked',
    async ({ act, toc }) => {
      const editor = await openEditor('/admin/blog/b-1');

      await act(editor);

      expect({ state: saveBarState(editor), toc: tocStates(editor) }).toEqual({
        state: '1 modification non enregistrée',
        toc,
      });
    },
  );

  it('Given a draft published then set back to draft When the bar renders Then nothing is reported as changed', async () => {
    const editor = await openEditor('/admin/blog/b-2');

    await choosePublished(editor);
    byTestId(editor.host, 'admin-post-status-draft')?.click();
    await settle(editor.fixture);

    expect({ state: saveBarState(editor), toc: tocStates(editor) }).toEqual({
      state: 'Aucune modification',
      toc: ['', '', '', ''],
    });
  });

  it('Given a failed save When the error is told Then « Enregistrer » is enabled again and the change still counted', async () => {
    const editor = await openEditor('/admin/blog/b-1', {
      updatePost: vi.fn((): Observable<BlogPost> => throwError(() => new Error('boom'))),
    });

    await typeIn(editor, 'admin-post-title', 'Après');
    await save(editor);

    expect({
      disabled: nativeButton(byTestId(editor.host, 'savebar-submit'))?.disabled,
      state: saveBarState(editor),
    }).toEqual({ disabled: false, state: '1 modification non enregistrée' });
  });

  it('Given an edited article saved When the answer comes back Then nothing is reported as changed and leaving asks nothing', async () => {
    const editor = await openEditor('/admin/blog/b-1', {
      updatePost: vi.fn((): Observable<BlogPost> =>
        of(makeBlogPost({ ...CHIFFREMENT, title: 'Après' })),
      ),
    });

    await typeIn(editor, 'admin-post-title', 'Après');
    await chooseCover(editor, COVER);
    await save(editor);
    const state = saveBarState(editor);
    await followBreadcrumb(editor);

    expect({
      state,
      dialog: readConfirmDialog(editor.host).open,
      url: TestBed.inject(Router).url,
    }).toEqual({ state: 'Aucune modification', dialog: false, url: '/admin/blog' });
  });
});

describe('AdminPostEditor: barre de mise en forme', () => {
  async function boldInContent(editor: Editor, start: number, end: number): Promise<void> {
    const zone = byTestId(editor.host, 'admin-post-content') as HTMLTextAreaElement;
    zone.focus();
    zone.setSelectionRange(start, end);
    await settle(editor.fixture);
    byTestId(editor.host, 'markdown-tool-bold')?.click();
    await settle(editor.fixture);
  }

  it('Given an opened article When a word of the content is set in bold from the toolbar Then one change is reported in the content section', async () => {
    const editor = await openEditor('/admin/blog/b-1');

    await boldInContent(editor, 19, 21);

    expect({
      content: fieldValue(editor.host, 'admin-post-content'),
      state: saveBarState(editor),
      toc: tocStates(editor),
    }).toEqual({
      content: '## AES-256-GCM\n\nUn **IV** unique.',
      state: '1 modification non enregistrée',
      toc: ['', 'modifié', '', ''],
    });
  });

  it('Given a word set in bold from the toolbar When the admin leaves Then the leave dialog is asked and the page stays', async () => {
    const editor = await openEditor('/admin/blog/b-1');

    await boldInContent(editor, 19, 21);
    await followBreadcrumb(editor);

    expect({
      dialog: readConfirmDialog(editor.host).open,
      url: TestBed.inject(Router).url,
    }).toEqual({ dialog: true, url: '/admin/blog/b-1' });
  });
});

describe('AdminPostEditor: image du corps', () => {
  it('Given a new article never saved When an image is inserted in its content Then the file alone is sent, nothing is saved and the content holds the image', async () => {
    const editor = await openEditor('/admin/blog/new');
    await fillNewPost(editor);
    const zone = byTestId(editor.host, 'admin-post-content') as HTMLTextAreaElement;
    zone.focus();
    zone.setSelectionRange(9, 9);
    await settle(editor.fixture);

    await insertBodyImage(editor.fixture, 'Schéma');

    expect({
      crash: editor.crash,
      calls: editor.uploadContentImage.mock.calls,
      created: editor.createPost.mock.calls.length,
      updated: editor.updatePost.mock.calls.length,
      content: fieldValue(editor.host, 'admin-post-content'),
    }).toEqual({
      crash: null,
      calls: [[BODY_IMAGE_FILE]],
      created: 0,
      updated: 0,
      content: `# Contenu\n\n![Schéma](${makeContentImage().url})`,
    });
  });
});

describe('AdminPostEditor: quitter la page', () => {
  it('Given no change When the admin leaves Then the list opens without question', async () => {
    const editor = await openEditor('/admin/blog/b-1');

    await followBreadcrumb(editor);

    expect({
      dialog: readConfirmDialog(editor.host).open,
      url: TestBed.inject(Router).url,
    }).toEqual({ dialog: false, url: '/admin/blog' });
  });

  it('Given an unsaved change When the admin leaves Then a dialog asks to confirm and the page stays meanwhile', async () => {
    const editor = await openEditor('/admin/blog/b-1');

    await typeIn(editor, 'admin-post-title', 'Après');
    await followBreadcrumb(editor);
    const dialog = readConfirmDialog(editor.host);

    expect({
      open: dialog.open,
      heading: dialog.heading,
      confirm: dialog.confirm,
      cancel: dialog.cancel,
      url: TestBed.inject(Router).url,
    }).toEqual({
      open: true,
      heading: 'Quitter sans enregistrer\u202f?',
      confirm: 'Quitter sans enregistrer',
      cancel: "Continuer l'édition",
      url: '/admin/blog/b-1',
    });
  });

  it.each([
    { answer: 'confirm', url: '/admin/blog' },
    { answer: 'cancel', url: '/admin/blog/b-1' },
    { answer: 'escape', url: '/admin/blog/b-1' },
  ] as const)(
    'Given the leave dialog When the admin answers $answer Then the address is $url',
    async ({ answer, url }) => {
      const editor = await openEditor('/admin/blog/b-1');

      await typeIn(editor, 'admin-post-title', 'Après');
      await followBreadcrumb(editor);
      await answerConfirmDialog(editor.fixture, answer);
      await settleBounded(editor.fixture);

      expect({
        url: TestBed.inject(Router).url,
        open: readConfirmDialog(editor.host).open,
      }).toEqual({ url, open: false });
    },
  );

  it('Given the leave dialog dismissed When the admin goes on Then the typed title is still there', async () => {
    const editor = await openEditor('/admin/blog/b-1');

    await typeIn(editor, 'admin-post-title', 'Après');
    await followBreadcrumb(editor);
    await answerConfirmDialog(editor.fixture, 'cancel');

    expect({
      field: fieldValue(editor.host, 'admin-post-title'),
      state: saveBarState(editor),
    }).toEqual({ field: 'Après', state: '1 modification non enregistrée' });
  });

  it('Given a new article created When the page moves to its address Then no leave dialog is asked', async () => {
    const editor = await openEditor('/admin/blog/new');

    await fillNewPost(editor);
    await chooseCover(editor, COVER);
    await save(editor);

    expect({
      dialog: readConfirmDialog(editor.host).open,
      url: TestBed.inject(Router).url,
    }).toEqual({ dialog: false, url: '/admin/blog/b-9' });
  });

  it.each([
    { edited: true, prevented: true },
    { edited: false, prevented: false },
  ])(
    'Given unsaved changes $edited When the tab is about to close Then the browser warning is requested: $prevented',
    async ({ edited, prevented }) => {
      const editor = await openEditor('/admin/blog/b-1');
      if (edited) await typeIn(editor, 'admin-post-title', 'Après');
      const event = new Event('beforeunload', { cancelable: true });

      window.dispatchEvent(event);

      expect(event.defaultPrevented).toBe(prevented);
    },
  );
});
