import { inputBinding, signal, twoWayBinding, type WritableSignal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import type { BlogPost, BlogPostInput } from '@features/blog/domain/models/blog-post.model';
import { BlogGateway } from '@features/blog/domain/gateways/blog.gateway';
import { makeBlogPost, makeContentImage } from '@features/blog/testing/blog-post-builders';
import { stubBlogGateway } from '@features/blog/testing/stub-blog-gateway';
import { byTestId, testIdText } from '@shared/testing/by-test-id';
import { settle, settleBounded } from '@shared/testing/settle';
import { toPostDraft, type PostDraft } from '../post-draft';
import { insertBodyImage } from '../testing/content-image-panel-page';
import { AdminPostForm } from './admin-post-form';

type FormOptions = {
  readonly post?: BlogPost;
  readonly persistedCover?: string;
  readonly tagSuggestions?: readonly string[];
};

type RenderedForm = {
  readonly fixture: ComponentFixture<AdminPostForm>;
  readonly host: HTMLElement;
  readonly value: WritableSignal<PostDraft>;
  readonly submitted: BlogPostInput[];
  readonly covers: File[];
};

const EDITABLE = makeBlogPost({
  id: 'b-1',
  title: 'Chiffrement côté client',
  excerpt: 'Le cas DashFlow.',
  contentMarkdown: '## AES-256-GCM\n\nUn IV unique.',
  tags: ['Chiffrement'],
  status: 'draft',
  publishedAt: null,
});

async function renderForm(options: FormOptions = {}): Promise<RenderedForm> {
  TestBed.configureTestingModule({
    providers: [{ provide: BlogGateway, useValue: stubBlogGateway() }],
  });
  const post = options.post ?? null;
  const value = signal(toPostDraft(post));
  const fixture = TestBed.createComponent(AdminPostForm, {
    bindings: [
      twoWayBinding('value', value),
      inputBinding('persistedCover', () => options.persistedCover ?? ''),
      ...(options.tagSuggestions
        ? [inputBinding('tagSuggestions', () => options.tagSuggestions)]
        : []),
    ],
  });
  const submitted: BlogPostInput[] = [];
  const covers: File[] = [];
  fixture.componentInstance.submitted.subscribe((payload) => submitted.push(payload));
  fixture.componentInstance.coverSelected.subscribe((file) => covers.push(file));
  await settle(fixture);
  return { fixture, host: fixture.nativeElement as HTMLElement, value, submitted, covers };
}

const normalized = (element: Element | null | undefined): string =>
  (element?.textContent ?? '').replace(/[ \t\n\r]+/g, ' ').replace(/^ | $/g, '');

const all = (host: ParentNode, testId: string): readonly HTMLElement[] => [
  ...host.querySelectorAll<HTMLElement>(`[data-testid="${testId}"]`),
];

const fieldValue = (host: HTMLElement, testId: string): string | undefined =>
  (byTestId(host, testId) as HTMLInputElement | HTMLTextAreaElement | null)?.value;

const radio = (host: HTMLElement, status: string): HTMLInputElement | null => {
  const element = byTestId(host, `admin-post-status-${status}`);
  return element instanceof HTMLInputElement ? element : null;
};

async function submitForm(rendered: RenderedForm): Promise<void> {
  byTestId(rendered.host, 'admin-post-form')?.dispatchEvent(
    new Event('submit', { bubbles: true, cancelable: true }),
  );
  await settleBounded(rendered.fixture);
}

async function typeIn(rendered: RenderedForm, testId: string, text: string): Promise<void> {
  const control = byTestId(rendered.host, testId) as HTMLInputElement | HTMLTextAreaElement | null;
  expect(control).toBeInstanceOf(HTMLElement);
  if (!control) return;
  control.value = text;
  control.dispatchEvent(new Event('input'));
  control.dispatchEvent(new Event('change'));
  await settle(rendered.fixture);
}

const preview = (host: HTMLElement): HTMLElement | null =>
  byTestId(host, 'admin-post-content-preview');

describe('AdminPostForm: brouillon possédé par la page', () => {
  it('Given a draft from the page When the form renders Then it shows the draft values', async () => {
    const { host } = await renderForm({ post: EDITABLE });

    expect({
      title: fieldValue(host, 'admin-post-title'),
      excerpt: fieldValue(host, 'admin-post-excerpt'),
      content: fieldValue(host, 'admin-post-content'),
      draft: radio(host, 'draft')?.checked,
      published: radio(host, 'published')?.checked,
    }).toEqual({
      title: 'Chiffrement côté client',
      excerpt: 'Le cas DashFlow.',
      content: '## AES-256-GCM\n\nUn IV unique.',
      draft: true,
      published: false,
    });
  });

  it.each([{ testId: 'admin-post-title', field: 'title' }] as const)(
    'Given the form When the admin types in $testId Then the page draft holds the typed $field',
    async ({ testId, field }) => {
      const rendered = await renderForm({ post: EDITABLE });

      await typeIn(rendered, testId, 'Saisie en cours');

      expect(rendered.value()[field]).toBe('Saisie en cours');
    },
  );

  it('Given the form When the page replaces its draft Then the fields show the new values', async () => {
    const rendered = await renderForm({ post: EDITABLE });

    rendered.value.set(
      toPostDraft(makeBlogPost({ title: 'Remplacé', status: 'published', contentMarkdown: 'X' })),
    );
    await settle(rendered.fixture);

    expect({
      title: fieldValue(rendered.host, 'admin-post-title'),
      published: radio(rendered.host, 'published')?.checked,
    }).toEqual({ title: 'Remplacé', published: true });
  });

  it('Given an edited post When the form renders Then only its tags are shown', async () => {
    const rendered = await renderForm({
      post: makeBlogPost({ id: 'b-2', tags: ['Chiffrement', 'Playwright'] }),
    });

    expect(
      all(byTestId(rendered.host, 'admin-post-tags') ?? rendered.host, 'tag-chip').map(normalized),
    ).toEqual(['Chiffrement', 'Playwright']);
  });

  it('Given the tags field When the admin types a free tag and Enter Then the draft and the payload hold it', async () => {
    const rendered = await renderForm({ post: EDITABLE });

    await typeIn(rendered, 'tags-input', 'Freelance');
    byTestId(rendered.host, 'tags-input')?.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }),
    );
    await settle(rendered.fixture);
    await submitForm(rendered);

    expect({
      tags: rendered.value().tags,
      sent: rendered.submitted.map((payload) => payload.tags),
    }).toEqual({ tags: ['Chiffrement', 'Freelance'], sent: [['Chiffrement', 'Freelance']] });
  });

  it('Given suggestions passed by the page When "pla" is typed Then they are offered, and the hint states the 15 tags of the API', async () => {
    const rendered = await renderForm({
      post: EDITABLE,
      tagSuggestions: ['Angular', 'Playwright'],
    });

    await typeIn(rendered, 'tags-input', 'pla');

    expect({
      options: all(rendered.host, 'tag-option').map(normalized),
      hint: normalized(byTestId(rendered.host, 'tags-hint')),
    }).toEqual({
      options: ['Playwright'],
      hint: 'Entrée ou virgule pour ajouter un tag. 15 tags au plus, 50 caractères chacun.',
    });
  });

  it('Given no suggestions passed When "rx" is typed Then the blog catalogue is offered', async () => {
    const rendered = await renderForm({ post: EDITABLE });

    await typeIn(rendered, 'tags-input', 'rx');

    expect(all(rendered.host, 'tag-option').map(normalized)).toEqual(['RxJS']);
  });
});

describe("AdminPostForm: tags suggérés d'après l'article", () => {
  const hints = (host: HTMLElement): readonly string[] =>
    all(host, 'tag-hint').map((button) => normalized(button).replace('Ajouter le tag ', ''));

  it('Given an article naming catalogue tags When the form renders Then the unselected ones are suggested, title first', async () => {
    const rendered = await renderForm({
      post: makeBlogPost({
        title: 'Tester un store RxJS',
        excerpt: 'Avec Angular.',
        contentMarkdown: 'Du Chiffrement et de la sécurité web.',
        tags: ['Chiffrement'],
      }),
    });

    expect(hints(rendered.host)).toEqual(['RxJS', 'Angular', 'Sécurité', 'Sécurité web']);
  });

  it('Given the body When the admin writes a new tag name Then it joins the suggestions, and leaves them once added', async () => {
    const rendered = await renderForm({
      post: EDITABLE,
      tagSuggestions: ['Angular', 'Playwright'],
    });

    await typeIn(rendered, 'admin-post-content', 'Des tests Playwright.');
    const before = hints(rendered.host);
    all(rendered.host, 'tag-hint')[0]?.click();
    await settle(rendered.fixture);

    expect({ before, after: hints(rendered.host), tags: rendered.value().tags }).toEqual({
      before: ['Playwright'],
      after: [],
      tags: ['Chiffrement', 'Playwright'],
    });
  });
});

describe('AdminPostForm: champs obligatoires', () => {
  it('Given a new article left empty When it is submitted Then nothing is emitted and the title, excerpt and content each show a required error', async () => {
    const rendered = await renderForm();

    await submitForm(rendered);

    expect({
      submitted: rendered.submitted.length,
      errors: [
        'admin-post-title-error',
        'admin-post-excerpt-error',
        'admin-post-content-error',
      ].map((testId) => ({
        role: byTestId(rendered.host, testId)?.getAttribute('role') ?? null,
        text: testIdText(rendered.host, testId),
      })),
    }).toEqual({
      submitted: 0,
      errors: [0, 1, 2].map(() => ({ role: 'alert', text: 'Ce champ est obligatoire' })),
    });
  });

  it('Given a new article filled in When it is submitted Then the payload is sent as a draft with no subject', async () => {
    const rendered = await renderForm();

    await typeIn(rendered, 'admin-post-title', 'Nouveau');
    await typeIn(rendered, 'admin-post-excerpt', 'Résumé');
    await typeIn(rendered, 'admin-post-content', '# Contenu');
    await submitForm(rendered);

    expect(rendered.submitted).toEqual([
      {
        title: 'Nouveau',
        excerpt: 'Résumé',
        contentMarkdown: '# Contenu',
        tags: [],
        status: 'draft',
      } satisfies BlogPostInput,
    ]);
  });
});

describe('AdminPostForm: erreur de champ annoncée et reliée', () => {
  const REQUIRED_FIELDS = [
    { testId: 'admin-post-title', errorId: 'post-title-error', hint: [] },
    { testId: 'admin-post-excerpt', errorId: 'post-excerpt-error', hint: [] },
    { testId: 'admin-post-content', errorId: 'post-content-error', hint: ['post-content-hint'] },
  ] as const;

  async function emptyAndLeave(rendered: RenderedForm, testId: string): Promise<void> {
    await typeIn(rendered, testId, '');
    byTestId(rendered.host, testId)?.dispatchEvent(new Event('blur'));
    await settle(rendered.fixture);
  }

  const describedBy = (host: HTMLElement, testId: string): readonly string[] =>
    byTestId(host, testId)?.getAttribute('aria-describedby')?.split(/\s+/) ?? [];

  const elementWithId = (host: HTMLElement, id: string): HTMLElement | null =>
    host.querySelector<HTMLElement>(`[id="${id}"]`);

  it.each(REQUIRED_FIELDS)(
    'Given an edited article When $testId is emptied then left Then it is invalid and described by its error « Ce champ est obligatoire »',
    async ({ testId, errorId, hint }) => {
      const rendered = await renderForm({ post: EDITABLE });

      await emptyAndLeave(rendered, testId);
      const error = elementWithId(rendered.host, errorId);

      expect({
        invalid: byTestId(rendered.host, testId)?.getAttribute('aria-invalid'),
        describedBy: describedBy(rendered.host, testId),
        error: {
          testId: error?.getAttribute('data-testid'),
          role: error?.getAttribute('role'),
          text: normalized(error),
        },
      }).toEqual({
        invalid: 'true',
        describedBy: [...hint, errorId],
        error: { testId: `${testId}-error`, role: 'alert', text: 'Ce champ est obligatoire' },
      });
    },
  );

  it.each(REQUIRED_FIELDS)(
    'Given an edited article When the form renders Then $testId is valid and described by its hint only',
    async ({ testId, hint }) => {
      const { host } = await renderForm({ post: EDITABLE });

      expect({
        invalid: byTestId(host, testId)?.getAttribute('aria-invalid'),
        describedBy: describedBy(host, testId),
      }).toEqual({ invalid: 'false', describedBy: hint });
    },
  );

  it('Given the content showing its error When it is filled again Then it is valid and described by its hint only', async () => {
    const rendered = await renderForm({ post: EDITABLE });
    await emptyAndLeave(rendered, 'admin-post-content');

    await typeIn(rendered, 'admin-post-content', '# Repris');

    expect({
      invalid: byTestId(rendered.host, 'admin-post-content')?.getAttribute('aria-invalid'),
      describedBy: describedBy(rendered.host, 'admin-post-content'),
      error: elementWithId(rendered.host, 'post-content-error'),
    }).toEqual({ invalid: 'false', describedBy: ['post-content-hint'], error: null });
  });
});

describe('AdminPostForm: soumission invalide', () => {
  it.each([
    { given: 'everything empty', filled: [], focused: 'admin-post-title' },
    { given: 'only the title', filled: ['admin-post-title'], focused: 'admin-post-excerpt' },
    {
      given: 'the title and the excerpt',
      filled: ['admin-post-title', 'admin-post-excerpt'],
      focused: 'admin-post-content',
    },
  ])(
    'Given a new article with $given filled in When the form is submitted Then the focus lands on $focused and nothing is emitted',
    async ({ filled, focused }) => {
      const rendered = await renderForm();
      for (const testId of filled) await typeIn(rendered, testId, 'Rempli');

      await submitForm(rendered);

      expect({
        focused: document.activeElement?.getAttribute('data-testid') ?? null,
        submitted: rendered.submitted.length,
      }).toEqual({ focused, submitted: 0 });
    },
  );
});

describe('AdminPostForm: contenu et aperçu Markdown', () => {
  it('Given an article in Markdown When the form renders Then the preview shows it as HTML', async () => {
    const { host } = await renderForm({
      post: makeBlogPost({ contentMarkdown: '## Intro\n\nUn *mot* choisi.' }),
    });

    expect({
      heading: normalized(preview(host)?.querySelector('h2')),
      emphasis: normalized(preview(host)?.querySelector('em')),
    }).toEqual({ heading: 'Intro', emphasis: 'mot' });
  });

  it('Given Markdown holding a level-1 title When the preview renders Then every title goes one level down, leaving the page h1 alone', async () => {
    const { host } = await renderForm({
      post: makeBlogPost({ contentMarkdown: '# Titre\n\n## Partie\n\n###### Note' }),
    });

    expect(
      [...(preview(host)?.querySelectorAll('h1, h2, h3, h4, h5, h6') ?? [])].map(
        (heading) => `${heading.tagName} ${normalized(heading)}`,
      ),
    ).toEqual(['H2 Titre', 'H3 Partie', 'H6 Note']);
  });

  it('Given a code block in the preview When its « Copier » is clicked Then the code is copied and the article is not submitted', async () => {
    await navigator.clipboard.writeText('avant');
    const rendered = await renderForm({
      post: makeBlogPost({ contentMarkdown: '```ts\ntype Id = string;\n```' }),
    });

    preview(rendered.host)?.querySelector<HTMLButtonElement>('button[data-code-copy]')?.click();
    await settleBounded(rendered.fixture);

    expect({
      clipboard: await navigator.clipboard.readText(),
      submitted: rendered.submitted.length,
    }).toEqual({
      clipboard: 'type Id = string;',
      submitted: 0,
    });
  });

  it('Given the preview When the admin types Markdown Then the preview follows the typing', async () => {
    const rendered = await renderForm({ post: EDITABLE });

    await typeIn(rendered, 'admin-post-content', '## Nouvelle partie');

    expect(normalized(preview(rendered.host)?.querySelector('h2'))).toBe('Nouvelle partie');
  });

  it('Given Markdown carrying a script and an inline handler When the preview renders Then neither reaches the page', async () => {
    const { host } = await renderForm({
      post: makeBlogPost({
        contentMarkdown: 'Texte <img src="x.png" onerror="alert(1)"><script>alert(2)</script>',
      }),
    });
    const image = preview(host)?.querySelector('img');

    expect({
      image: image?.getAttribute('src'),
      handler: image?.hasAttribute('onerror'),
      scripts: preview(host)?.querySelectorAll('script').length,
    }).toEqual({ image: 'x.png', handler: false, scripts: 0 });
  });
});

describe('AdminPostForm: barre de mise en forme', () => {
  const contentZone = (host: HTMLElement): HTMLTextAreaElement =>
    byTestId(host, 'admin-post-content') as HTMLTextAreaElement;

  async function selectInContent(
    rendered: RenderedForm,
    start: number,
    end: number,
  ): Promise<void> {
    const zone = contentZone(rendered.host);
    zone.focus();
    zone.setSelectionRange(start, end);
    zone.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowRight', bubbles: true }));
    await settle(rendered.fixture);
  }

  it('Given « IV » selected in the content When « Gras » is clicked Then the page draft and the preview hold it in bold, the focus is back in the zone and nothing is submitted', async () => {
    const rendered = await renderForm({ post: EDITABLE });
    await selectInContent(rendered, 19, 21);

    byTestId(rendered.host, 'markdown-tool-bold')?.click();
    await settle(rendered.fixture);

    expect({
      draft: rendered.value().contentMarkdown,
      strong: normalized(preview(rendered.host)?.querySelector('strong')),
      focused: document.activeElement === contentZone(rendered.host),
      selection: [
        contentZone(rendered.host).selectionStart,
        contentZone(rendered.host).selectionEnd,
      ],
      submitted: rendered.submitted.length,
    }).toEqual({
      draft: '## AES-256-GCM\n\nUn **IV** unique.',
      strong: 'IV',
      focused: true,
      selection: [21, 23],
      submitted: 0,
    });
  });

  it('Given the toolbar When each of its buttons is clicked Then the article is never submitted', async () => {
    const rendered = await renderForm({ post: EDITABLE });
    const buttons = [
      ...(byTestId(rendered.host, 'markdown-toolbar')?.querySelectorAll('button') ?? []),
    ];

    for (const button of buttons) {
      button.click();
      await settleBounded(rendered.fixture);
    }

    expect({ clicked: buttons.length >= 5, submitted: rendered.submitted.length }).toEqual({
      clicked: true,
      submitted: 0,
    });
  });

  it('Given the caret in the paragraph When « Titre 2 » is chosen Then the page draft holds the line as a level-2 title', async () => {
    const rendered = await renderForm({ post: EDITABLE });
    await selectInContent(rendered, 19, 19);
    const select = byTestId(rendered.host, 'markdown-block-level');

    if (select instanceof HTMLSelectElement) select.value = 'h2';
    select?.dispatchEvent(new Event('change', { bubbles: true }));
    await settle(rendered.fixture);

    expect({
      draft: rendered.value().contentMarkdown,
      headings: [...(preview(rendered.host)?.querySelectorAll('h2') ?? [])].map(normalized),
    }).toEqual({
      draft: '## AES-256-GCM\n\n## Un IV unique.',
      headings: ['AES-256-GCM', 'Un IV unique.'],
    });
  });

  describe('listes, citation, lien, bloc de code, séparateur', () => {
    it.each([
      {
        testId: 'markdown-tool-bullet-list',
        from: [19, 19],
        draft: '## AES-256-GCM\n\n- Un IV unique.',
        rendered: (root: HTMLElement): readonly string[] =>
          [...root.querySelectorAll('ul > li')].map(normalized),
        expected: ['Un IV unique.'],
      },
    ])(
      'Given the content When $testId is clicked Then the page draft reads $draft and the preview renders it, without submitting',
      async ({ testId, from, draft, rendered: read, expected }) => {
        const rendered = await renderForm({ post: EDITABLE });
        await selectInContent(rendered, from[0], from[1]);

        byTestId(rendered.host, testId)?.click();
        await settle(rendered.fixture);

        expect({
          draft: rendered.value().contentMarkdown,
          preview: read(preview(rendered.host) ?? rendered.host),
          submitted: rendered.submitted.length,
        }).toEqual({ draft, preview: expected, submitted: 0 });
      },
    );
  });

  describe('image du corps', () => {
    const IMAGE = makeContentImage();
    const IMAGE_MARKDOWN = `![Schéma du chiffrement](${IMAGE.url})`;

    it('Given the caret at the end of the content When an image is sent with its alt text Then the page draft holds it in its own paragraph, the preview shows it with its size, and the article is not submitted', async () => {
      const rendered = await renderForm({ post: EDITABLE });
      await selectInContent(rendered, 29, 29);

      await insertBodyImage(rendered.fixture, 'Schéma du chiffrement');
      const image = preview(rendered.host)?.querySelector('img');

      expect({
        draft: rendered.value().contentMarkdown,
        image: {
          src: image?.getAttribute('src'),
          alt: image?.getAttribute('alt'),
          width: image?.getAttribute('width'),
          height: image?.getAttribute('height'),
        },
        focused: document.activeElement === contentZone(rendered.host),
        submitted: rendered.submitted.length,
      }).toEqual({
        draft: `## AES-256-GCM\n\nUn IV unique.\n\n${IMAGE_MARKDOWN}`,
        image: { src: IMAGE.url, alt: 'Schéma du chiffrement', width: '1600', height: '900' },
        focused: true,
        submitted: 0,
      });
    });

    it('Given an alt text with Markdown marks When the image is inserted Then the preview reads the alt text as typed', async () => {
      const rendered = await renderForm({ post: EDITABLE });
      await selectInContent(rendered, 29, 29);

      await insertBodyImage(rendered.fixture, '*Clé* de _session_ et `iv`');

      expect(preview(rendered.host)?.querySelector('img')?.getAttribute('alt')).toBe(
        '*Clé* de _session_ et `iv`',
      );
    });
  });
});

describe('AdminPostForm: publication', () => {
  it.each([
    { status: 'draft', checked: [true, false] },
    { status: 'published', checked: [false, true] },
  ] as const)(
    'Given an article with status $status When the form renders Then the radios read $checked',
    async ({ status, checked }) => {
      const { host } = await renderForm({ post: makeBlogPost({ status }) });

      expect([radio(host, 'draft')?.checked, radio(host, 'published')?.checked]).toEqual(checked);
    },
  );

  it('Given a draft When « Publié » is chosen Then the page draft and the payload are published', async () => {
    const rendered = await renderForm({ post: EDITABLE });

    radio(rendered.host, 'published')?.click();
    await settle(rendered.fixture);
    await submitForm(rendered);

    expect({
      draft: rendered.value().status,
      sent: rendered.submitted.map((payload) => payload.status),
    }).toEqual({ draft: 'published', sent: ['published'] });
  });
});
