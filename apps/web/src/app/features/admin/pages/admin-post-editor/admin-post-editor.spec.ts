import { Location } from '@angular/common';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Router, provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { BehaviorSubject, of, Subject, throwError, type Observable } from 'rxjs';
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
import { answerConfirmDialog, readConfirmDialog } from '@shared/ui/testing/confirm-dialog-page';
import { AdminPostEditor } from './admin-post-editor';
import {
  BODY_IMAGE_FILE,
  insertBodyImage,
} from '../../application/testing/content-image-panel-page';
import { unsavedChangesGuard } from '../../application/unsaved-changes-guard';
import { BlankPage } from '@shared/testing/blank-page';
import {
  fieldValue,
  followBreadcrumb,
  inZone,
  openEditorRoute,
  pickInZone,
  overwriteDialog,
  readNewerVersion,
  reloadDialog,
  reloadLatest,
  save,
  saveBarState,
  settleUntil,
  tocStates,
  toasts,
  typeIn,
} from '../../application/testing/editor-page';
import { normalized } from '@shared/testing/normalized-text';
import { asButton } from '@shared/testing/as-button';
import { forgetTabVisibility, returnToTab } from '@shared/testing/tab-visibility';

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
  readonly invalidateAdminPosts: Mock<BlogGateway['invalidateAdminPosts']>;
  readonly getLatestAdminPost: Mock<BlogGateway['getLatestAdminPost']>;
  readonly createPost: Mock<BlogGateway['createPost']>;
  readonly updatePost: Mock<BlogGateway['updatePost']>;
  readonly uploadCoverImage: Mock<BlogGateway['uploadCoverImage']>;
  readonly uploadContentImage: Mock<BlogGateway['uploadContentImage']>;
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
    invalidateAdminPosts: vi.fn(),
    getLatestAdminPost: vi.fn((): Observable<BlogPost | null> => of(CHIFFREMENT)),
    createPost: vi.fn((): Observable<BlogPost> => of(makeBlogPost({ id: 'b-9', title: 'X' }))),
    updatePost: vi.fn((): Observable<BlogPost> => of(CHIFFREMENT)),
    uploadCoverImage: vi.fn((): Observable<string> => of('blog/b-9.avif')),
    uploadContentImage: vi.fn((): Observable<ContentImage> => of(makeContentImage())),
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
          invalidateAdminPosts: spies.invalidateAdminPosts,
          getLatestAdminPost: spies.getLatestAdminPost,
          createPost: spies.createPost,
          updatePost: spies.updatePost,
          uploadCoverImage: spies.uploadCoverImage,
          uploadContentImage: spies.uploadContentImage,
        }),
      },
      { provide: ToastStore, useValue: { add: spies.toast } },
    ],
  });
  return { ...spies, ...(await openEditorRoute(url)) };
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

const COVER = new File(['x'], 'cover.png', { type: 'image/png' });

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

  it('Given a created article When the save ends Then success is told and the page moves to its address in place of /new', async () => {
    const editor = await openEditor('/admin/blog/new');
    const replaceState = vi.spyOn(TestBed.inject(Location), 'replaceState');

    await fillNewPost(editor);
    await save(editor);

    expect({
      toasts: toasts(editor.toast),
      url: TestBed.inject(Router).url,
      replaced: replaceState.mock.calls.map(([path]) => path),
    }).toEqual({
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
    }).toEqual({ uploads: [[COVER, 'b-9', 1]], afterCreation: true });
  });

  it('Given the creation fails When the article is saved Then an error is told and the page stays on /new', async () => {
    const editor = await openEditor('/admin/blog/new', {
      createPost: vi.fn((): Observable<BlogPost> => throwError(() => new Error('boom'))),
    });

    await fillNewPost(editor);
    await chooseCover(editor, COVER);
    await save(editor);

    expect({
      toasts: toasts(editor.toast),
      url: TestBed.inject(Router).url,
      uploads: editor.uploadCoverImage.mock.calls.length,
    }).toEqual({
      toasts: [{ severity: 'error', detail: "Erreur lors de l'enregistrement de l'article" }],
      url: '/admin/blog/new',
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
  it('Given an edited title When the article is saved Then it is updated, success is told, the list is not requested again by the page, and the title follows', async () => {
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
      requested: editor.getAllPostsForAdmin.mock.calls.length,
      title: testIdText(editor.host, 'admin-page-title'),
      url: TestBed.inject(Router).url,
    }).toEqual({
      updated: [['b-1', 'Après']],
      uploads: 0,
      toasts: [{ severity: 'success', detail: 'Article enregistré' }],
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
    }).toEqual({ uploads: [[COVER, 'b-1', 1]], updates: 1, updateFirst: true });
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
      title: testIdText(editor.host, 'admin-page-title'),
    }).toEqual({
      toasts: [{ severity: 'error', detail: "Erreur lors de l'enregistrement de l'article" }],
      uploads: 0,
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
  const COVER_ZONE = 'admin-post-cover';

  it('Given a cover chosen then removed from the dropzone When the article is saved Then no cover is sent', async () => {
    const editor = await openEditor('/admin/blog/b-1');
    await pickInZone(editor, COVER_ZONE, COVER);
    const chosen = inZone(editor, COVER_ZONE, 'file-dropzone-replace') !== null;

    inZone(editor, COVER_ZONE, 'file-dropzone-clear')?.click();
    await settle(editor.fixture);
    await save(editor);

    expect({ chosen, uploads: editor.uploadCoverImage.mock.calls.length }).toEqual({
      chosen: true,
      uploads: 0,
    });
  });

  it('Given a file that is not an image When it is dropped in the cover zone Then the page says so and the zone empties', async () => {
    const editor = await openEditor('/admin/blog/b-1');

    await pickInZone(
      editor,
      COVER_ZONE,
      new File(['%PDF'], 'notes.pdf', { type: 'application/pdf' }),
    );

    expect({
      toasts: toasts(editor.toast),
      replace: inZone(editor, COVER_ZONE, 'file-dropzone-replace'),
      trigger: inZone(editor, COVER_ZONE, 'file-dropzone-trigger') !== null,
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
    await pickInZone(editor, COVER_ZONE, COVER);

    await pickInZone(
      editor,
      COVER_ZONE,
      new File(['%PDF'], 'notes.pdf', { type: 'application/pdf' }),
    );
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
      disabled: asButton(byTestId(editor.host, 'savebar-submit')).disabled,
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

describe('AdminPostEditor: version plus récente enregistrée ailleurs', () => {
  const PREFIX = 'admin-post';
  const NEWER = makeBlogPost({
    ...CHIFFREMENT,
    title: 'Chiffrement, relu ailleurs',
    updatedAt: '2026-11-22T10:00:00Z',
    version: 2,
  });
  const MESSAGE =
    'Une version plus récente de cet article a été enregistrée ailleurs. Recharger la dernière version';

  afterEach(() => forgetTabVisibility());

  async function backToTab(editor: Editor): Promise<void> {
    returnToTab();
    await settleBounded(editor.fixture);
  }

  function editorWithList(): Promise<Editor> {
    const list = new BehaviorSubject<readonly BlogPost[]>([CHIFFREMENT, FRAISEUSE]);
    return openEditor('/admin/blog/b-1', {
      getAllPostsForAdmin: vi.fn(() => list),
      invalidateAdminPosts: vi.fn(() => list.next([NEWER, FRAISEUSE])),
      getLatestAdminPost: vi.fn(() => of(NEWER)),
    });
  }

  it('Given an article saved elsewhere since it was opened When the admin returns to the tab Then a status says so, the draft and the focus stay', async () => {
    const editor = await openEditor('/admin/blog/b-1', {
      getLatestAdminPost: vi.fn(() => of(NEWER)),
    });
    await typeIn(editor, 'admin-post-title', 'Mon brouillon');
    const title = byTestId(editor.host, 'admin-post-title');
    title?.focus();

    await backToTab(editor);

    expect({
      read: editor.getLatestAdminPost.mock.calls,
      notice: readNewerVersion(editor, PREFIX),
      field: fieldValue(editor.host, 'admin-post-title'),
      focus: document.activeElement === title,
      toasts: toasts(editor.toast),
    }).toEqual({
      read: [['b-1']],
      notice: { role: 'status', text: MESSAGE, focused: false },
      field: 'Mon brouillon',
      focus: true,
      toasts: [],
    });
  });

  it.each([
    { case: 'the same version', latest: (): Observable<BlogPost | null> => of(CHIFFREMENT) },
    { case: 'an article gone', latest: (): Observable<BlogPost | null> => of(null) },
    {
      case: 'a failed read',
      latest: (): Observable<BlogPost | null> => throwError(() => new Error('offline')),
    },
  ])(
    'Given $case on the API When the admin returns to the tab Then nothing is said',
    async ({ latest }) => {
      const editor = await openEditor('/admin/blog/b-1', { getLatestAdminPost: vi.fn(latest) });

      await backToTab(editor);

      expect({
        read: editor.getLatestAdminPost.mock.calls.length,
        notice: readNewerVersion(editor, PREFIX),
        toasts: toasts(editor.toast),
      }).toEqual({
        read: 1,
        notice: { role: 'status', text: '', focused: false },
        toasts: [],
      });
    },
  );

  it('Given a new article never saved When the admin returns to the tab Then nothing is read', async () => {
    const editor = await openEditor('/admin/blog/new');

    await backToTab(editor);

    expect(editor.getLatestAdminPost).not.toHaveBeenCalled();
  });

  it('Given a save in progress When the admin returns to the tab Then nothing is read', async () => {
    const pending = new Subject<BlogPost>();
    const editor = await openEditor('/admin/blog/b-1', { updatePost: vi.fn(() => pending) });
    await typeIn(editor, 'admin-post-title', 'Après');
    await save(editor);

    await backToTab(editor);

    expect(editor.getLatestAdminPost).not.toHaveBeenCalled();
    pending.complete();
  });

  it('Given the article saved from this tab When the admin returns to the tab Then its own save is not taken for a newer version', async () => {
    const saved = makeBlogPost({ ...CHIFFREMENT, title: 'Après', updatedAt: NEWER.updatedAt });
    const editor = await openEditor('/admin/blog/b-1', {
      updatePost: vi.fn(() => of(saved)),
      getLatestAdminPost: vi.fn(() => of(saved)),
    });
    await typeIn(editor, 'admin-post-title', 'Après');
    await save(editor);

    await backToTab(editor);

    expect({
      read: editor.getLatestAdminPost.mock.calls.length,
      notice: readNewerVersion(editor, PREFIX).text,
    }).toEqual({ read: 1, notice: '' });
  });

  it('Given a read started before a save from this tab When it answers after the save Then its older version is ignored', async () => {
    const answer = new Subject<BlogPost | null>();
    const editor = await openEditor('/admin/blog/b-1', {
      updatePost: vi.fn(() => of(NEWER)),
      getLatestAdminPost: vi.fn(() => answer),
    });
    await backToTab(editor);
    await typeIn(editor, 'admin-post-title', 'Après');
    await save(editor);

    answer.next(CHIFFREMENT);
    answer.complete();
    await settleBounded(editor.fixture);

    expect({
      read: editor.getLatestAdminPost.mock.calls.length,
      notice: readNewerVersion(editor, PREFIX).text,
    }).toEqual({ read: 1, notice: '' });
  });

  it('Given a newer version and no unsaved change When the admin reloads it Then it replaces the form without question and the status says it is loaded', async () => {
    const editor = await editorWithList();
    await backToTab(editor);

    await reloadLatest(editor, PREFIX);

    expect({
      dialog: readConfirmDialog(reloadDialog(editor, PREFIX)).open,
      reloaded: editor.invalidateAdminPosts.mock.calls.length,
      field: fieldValue(editor.host, 'admin-post-title'),
      state: saveBarState(editor),
      notice: readNewerVersion(editor, PREFIX),
    }).toEqual({
      dialog: false,
      reloaded: 1,
      field: 'Chiffrement, relu ailleurs',
      state: 'Aucune modification',
      notice: { role: 'status', text: 'Dernière version chargée.', focused: true },
    });
  });

  it('Given a newer version and unsaved changes When the admin reloads it Then a dialog names what will be lost before anything is reloaded', async () => {
    const editor = await editorWithList();
    await typeIn(editor, 'admin-post-title', 'Mon brouillon');
    await typeIn(editor, 'admin-post-excerpt', 'Mon résumé');
    await backToTab(editor);

    await reloadLatest(editor, PREFIX);

    expect({
      dialog: readConfirmDialog(reloadDialog(editor, PREFIX)),
      reloaded: editor.invalidateAdminPosts.mock.calls.length,
    }).toEqual({
      dialog: {
        open: true,
        heading: 'Recharger la dernière version\u202f?',
        description:
          'Ton brouillon sera remplacé par la dernière version enregistrée\u00a0: 2 modifications non enregistrées de cet article seront perdues.',
        confirm: 'Recharger la dernière version',
        cancel: "Continuer l'édition",
      },
      reloaded: 0,
    });
  });

  it.each([
    {
      answer: 'cancel',
      expected: {
        reloaded: 0,
        field: 'Mon brouillon',
        state: '1 modification non enregistrée',
        notice: MESSAGE,
      },
    },
    {
      answer: 'escape',
      expected: {
        reloaded: 0,
        field: 'Mon brouillon',
        state: '1 modification non enregistrée',
        notice: MESSAGE,
      },
    },
    {
      answer: 'confirm',
      expected: {
        reloaded: 1,
        field: 'Chiffrement, relu ailleurs',
        state: 'Aucune modification',
        notice: 'Dernière version chargée.',
      },
    },
  ] as const)(
    'Given the reload dialog When the admin answers $answer Then the draft is kept or replaced accordingly',
    async ({ answer, expected }) => {
      const editor = await editorWithList();
      await typeIn(editor, 'admin-post-title', 'Mon brouillon');
      await backToTab(editor);
      await reloadLatest(editor, PREFIX);

      await answerConfirmDialog(editor.fixture, answer, reloadDialog(editor, PREFIX));

      expect({
        reloaded: editor.invalidateAdminPosts.mock.calls.length,
        field: fieldValue(editor.host, 'admin-post-title'),
        state: saveBarState(editor),
        notice: readNewerVersion(editor, PREFIX).text,
      }).toEqual(expected);
    },
  );

  it('Given a cover chosen and not saved When the latest version is reloaded Then the cover is dropped with the rest of the draft', async () => {
    const editor = await editorWithList();
    await chooseCover(editor, COVER);
    await backToTab(editor);
    await reloadLatest(editor, PREFIX);

    await answerConfirmDialog(editor.fixture, 'confirm', reloadDialog(editor, PREFIX));

    expect(saveBarState(editor)).toBe('Aucune modification');
  });
  it('Given a newer version detected When the admin saves Then a dialog says the save will replace it, and nothing is written meanwhile', async () => {
    const editor = await editorWithList();
    await typeIn(editor, 'admin-post-title', 'Mon brouillon');
    await backToTab(editor);

    await save(editor);

    expect({
      dialog: readConfirmDialog(overwriteDialog(editor, PREFIX)),
      written: editor.updatePost.mock.calls.length,
    }).toEqual({
      dialog: {
        open: true,
        heading: 'Enregistrer par-dessus la version la plus récente\u202f?',
        description:
          'Une version plus récente de cet article a été enregistrée ailleurs\u00a0: enregistrer ton brouillon la remplacera.',
        confirm: 'Enregistrer quand même',
        cancel: "Continuer l'édition",
      },
      written: 0,
    });
  });

  it.each([
    { answer: 'cancel', expected: { written: [], field: 'Mon brouillon', notice: MESSAGE } },
    { answer: 'escape', expected: { written: [], field: 'Mon brouillon', notice: MESSAGE } },
    {
      answer: 'confirm',
      expected: { written: ['Mon brouillon'], field: 'Mon brouillon', notice: '' },
    },
  ] as const)(
    'Given the overwrite dialog When the admin answers $answer Then the draft is written only on confirmation',
    async ({ answer, expected }) => {
      const editor = await openEditor('/admin/blog/b-1', {
        getLatestAdminPost: vi.fn(() => of(NEWER)),
        updatePost: vi.fn((_id: string, payload: Partial<BlogPostInput>) =>
          of(
            makeBlogPost({
              ...CHIFFREMENT,
              title: payload.title ?? '',
              updatedAt: '2026-11-22T11:00:00Z',
              version: 3,
            }),
          ),
        ),
      });
      await typeIn(editor, 'admin-post-title', 'Mon brouillon');
      await backToTab(editor);
      await save(editor);

      await answerConfirmDialog(editor.fixture, answer, overwriteDialog(editor, PREFIX));
      // Seule la confirmation écrit : l'enregistrement se clôt par un toast.
      await settleUntil(editor, () => answer !== 'confirm' || editor.toast.mock.calls.length > 0);

      expect({
        written: editor.updatePost.mock.calls.map(([, payload]) => payload.title),
        field: fieldValue(editor.host, 'admin-post-title'),
        notice: readNewerVersion(editor, PREFIX).text,
      }).toEqual(expected);
    },
  );

  it('Given a read started on an article When another article with the same version is opened before it answers Then the answer is ignored', async () => {
    const answer = new Subject<BlogPost | null>();
    const editor = await openEditor('/admin/blog/b-1', {
      getLatestAdminPost: vi.fn(() => answer),
    });
    await backToTab(editor);
    await editor.harness.navigateByUrl('/admin/blog/b-2');
    await settleBounded(editor.fixture);

    answer.next(NEWER);
    answer.complete();
    await settleBounded(editor.fixture);

    expect({
      same: FRAISEUSE.version === CHIFFREMENT.version,
      field: fieldValue(editor.host, 'admin-post-title'),
      notice: readNewerVersion(editor, PREFIX).text,
    }).toEqual({ same: true, field: 'De la fraiseuse à Angular', notice: '' });
  });

  it.each([
    {
      then: 'a typed change',
      act: (editor: Editor): Promise<void> => typeIn(editor, 'admin-post-excerpt', 'Repris'),
    },
    { then: 'a save', act: (editor: Editor): Promise<void> => save(editor) },
  ])(
    'Given the latest version loaded When $then follows Then « Dernière version chargée. » is no longer said',
    async ({ act }) => {
      const editor = await editorWithList();
      await backToTab(editor);
      await reloadLatest(editor, PREFIX);
      const loaded = readNewerVersion(editor, PREFIX).text;

      await act(editor);

      expect({ loaded, after: readNewerVersion(editor, PREFIX).text }).toEqual({
        loaded: 'Dernière version chargée.',
        after: '',
      });
    },
  );

  it('Given a reload that brings nothing When the admin then saves over the newer version Then the editor never says it loaded the latest one', async () => {
    const editor = await openEditor('/admin/blog/b-1', {
      getLatestAdminPost: vi.fn(() => of(NEWER)),
      updatePost: vi.fn(() =>
        of(makeBlogPost({ ...CHIFFREMENT, updatedAt: '2026-11-22T11:00:00Z', version: 3 })),
      ),
    });
    await backToTab(editor);
    await reloadLatest(editor, PREFIX);
    const afterReload = readNewerVersion(editor, PREFIX).text;
    await typeIn(editor, 'admin-post-title', 'Mon brouillon');
    await save(editor);

    await answerConfirmDialog(editor.fixture, 'confirm', overwriteDialog(editor, PREFIX));
    await settleUntil(editor, () => editor.toast.mock.calls.length > 0);

    expect({ afterReload, afterSave: readNewerVersion(editor, PREFIX).text }).toEqual({
      afterReload: MESSAGE,
      afterSave: '',
    });
  });

  describe('horloge figée', () => {
    const START = Date.parse('2026-11-22T12:00:00.000Z');

    beforeEach(() => {
      vi.useFakeTimers({ toFake: ['Date'] });
      vi.setSystemTime(START);
    });

    afterEach(() => vi.useRealTimers());

    it('Given a newer version already detected When the admin returns 15 s later Then the article is not read again', async () => {
      const editor = await openEditor('/admin/blog/b-1', {
        getLatestAdminPost: vi.fn(() => of(NEWER)),
      });
      await backToTab(editor);

      vi.setSystemTime(START + 15_000);
      await backToTab(editor);

      expect({
        reads: editor.getLatestAdminPost.mock.calls.length,
        notice: readNewerVersion(editor, PREFIX).text,
      }).toEqual({ reads: 1, notice: MESSAGE });
    });
  });
});

describe('AdminPostEditor: enregistrement sous condition de version', () => {
  const PREFIX = 'admin-post';
  const OPENED = makeBlogPost({ ...CHIFFREMENT, version: 3 });
  const LATEST = makeBlogPost({ ...CHIFFREMENT, title: 'Relu ailleurs', version: 5 });
  const MESSAGE =
    'Une version plus récente de cet article a été enregistrée ailleurs. Recharger la dernière version';
  const CONFLICT =
    "L'article n'a pas été enregistré : une version plus récente a été enregistrée ailleurs.";
  const TITLE_TAKEN = 'Un autre article porte déjà ce titre\u00a0: choisis-en un autre.';

  afterEach(() => forgetTabVisibility());

  function openAtVersion3(overrides: Overrides = {}): Promise<Editor> {
    return openEditor('/admin/blog/b-1', {
      getAllPostsForAdmin: vi.fn(() => of([OPENED, FRAISEUSE])),
      getLatestAdminPost: vi.fn(() => of(LATEST)),
      updatePost: vi.fn(() => of(makeBlogPost({ ...OPENED, version: 4 }))),
      ...overrides,
    });
  }

  it('Given an article opened at version 3 When it is saved Then the update expects version 3', async () => {
    const editor = await openAtVersion3();
    await typeIn(editor, 'admin-post-title', 'Après');

    await save(editor);

    expect(editor.updatePost.mock.calls.map(([id, , version]) => [id, version])).toEqual([
      ['b-1', 3],
    ]);
  });

  it('Given a new cover When the article is saved Then the cover expects the version the update answered', async () => {
    const editor = await openAtVersion3();
    await chooseCover(editor, COVER);

    await save(editor);

    expect(editor.uploadCoverImage.mock.calls).toEqual([[COVER, 'b-1', 4]]);
  });

  it('Given a version saved elsewhere When the save is refused with a 412 Then the newer version is told, the draft and its cover are kept and nothing else is sent', async () => {
    const editor = await openAtVersion3({
      updatePost: vi.fn(() => throwError(() => apiRejection(412, 'Version périmée'))),
    });
    await typeIn(editor, 'admin-post-title', 'Mon brouillon');
    await chooseCover(editor, COVER);

    await save(editor);

    expect({
      notice: readNewerVersion(editor, PREFIX).text,
      toasts: toasts(editor.toast),
      field: fieldValue(editor.host, 'admin-post-title'),
      state: saveBarState(editor),
      uploads: editor.uploadCoverImage.mock.calls.length,
    }).toEqual({
      notice: MESSAGE,
      toasts: [{ severity: 'error', detail: CONFLICT }],
      field: 'Mon brouillon',
      state: '2 modifications non enregistrées',
      uploads: 0,
    });
  });

  it('Given a save refused with a 412 When the admin saves again and confirms the overwrite Then the latest version is read and the draft is sent with it', async () => {
    const editor = await openAtVersion3({
      updatePost: vi
        .fn<BlogGateway['updatePost']>()
        .mockReturnValueOnce(throwError(() => apiRejection(412, 'Version périmée')))
        .mockReturnValueOnce(of(makeBlogPost({ ...LATEST, title: 'Mon brouillon', version: 6 }))),
    });
    await typeIn(editor, 'admin-post-title', 'Mon brouillon');
    await save(editor);
    await save(editor);

    await answerConfirmDialog(editor.fixture, 'confirm', overwriteDialog(editor, PREFIX));
    await settleUntil(editor, () => editor.toast.mock.calls.length > 1);

    expect({
      sent: editor.updatePost.mock.calls.map(([, payload, version]) => [payload.title, version]),
      notice: readNewerVersion(editor, PREFIX).text,
    }).toEqual({
      sent: [
        ['Mon brouillon', 3],
        ['Mon brouillon', 5],
      ],
      notice: '',
    });
  });

  it('Given the latest version cannot be read When the overwrite is confirmed Then the draft is sent with its own version, never without one', async () => {
    const editor = await openAtVersion3({
      getLatestAdminPost: vi
        .fn<BlogGateway['getLatestAdminPost']>()
        .mockReturnValueOnce(of(LATEST))
        .mockReturnValueOnce(throwError(() => new Error('offline'))),
    });
    await typeIn(editor, 'admin-post-title', 'Mon brouillon');
    returnToTab();
    await settleBounded(editor.fixture);
    await save(editor);

    await answerConfirmDialog(editor.fixture, 'confirm', overwriteDialog(editor, PREFIX));
    await settleUntil(editor, () => editor.toast.mock.calls.length > 0);

    expect(editor.updatePost.mock.calls.map(([, , version]) => version)).toEqual([3]);
  });

  it.each([
    {
      case: 'a higher version with the same updatedAt',
      latest: makeBlogPost({ ...OPENED, version: 4 }),
      notice: MESSAGE,
    },
    {
      case: 'the same version with another updatedAt',
      latest: makeBlogPost({ ...OPENED, updatedAt: '2026-11-22T10:00:00Z' }),
      notice: '',
    },
  ])(
    'Given $case on the API When the admin returns to the tab Then the versions are compared, not the dates',
    async ({ latest, notice }) => {
      const editor = await openAtVersion3({ getLatestAdminPost: vi.fn(() => of(latest)) });

      returnToTab();
      await settleBounded(editor.fixture);

      expect(readNewerVersion(editor, PREFIX).text).toBe(notice);
    },
  );

  it('Given a title already taken by another article When the save is refused with a 409 Then the title is named, the draft is kept and no newer version is told', async () => {
    const editor = await openAtVersion3({
      updatePost: vi.fn(() =>
        throwError(() => apiRejection(409, 'Blog post with slug "pris" already exists')),
      ),
    });
    await typeIn(editor, 'admin-post-title', 'Pris');
    await chooseCover(editor, COVER);

    await save(editor);
    await save(editor);

    expect({
      notice: readNewerVersion(editor, PREFIX).text,
      toasts: toasts(editor.toast),
      field: fieldValue(editor.host, 'admin-post-title'),
      state: saveBarState(editor),
      dialog: readConfirmDialog(overwriteDialog(editor, PREFIX)).open,
      sent: editor.updatePost.mock.calls.map(([, , version]) => version),
      uploads: editor.uploadCoverImage.mock.calls.length,
    }).toEqual({
      notice: '',
      toasts: [
        { severity: 'error', detail: TITLE_TAKEN },
        { severity: 'error', detail: TITLE_TAKEN },
      ],
      field: 'Pris',
      state: '2 modifications non enregistrées',
      dialog: false,
      sent: [3, 3],
      uploads: 0,
    });
  });

  it('Given the cover refused with a 412 after When the save ends Then the newer version is told', async () => {
    const editor = await openAtVersion3({
      uploadCoverImage: vi.fn(() => throwError(() => apiRejection(412, 'Version périmée'))),
    });
    await chooseCover(editor, COVER);

    await save(editor);

    expect(readNewerVersion(editor, PREFIX).text).toBe(MESSAGE);
  });
});
