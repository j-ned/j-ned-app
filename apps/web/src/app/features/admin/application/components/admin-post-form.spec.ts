import { inputBinding, signal, twoWayBinding, type WritableSignal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import type { BlogPost, BlogPostInput } from '@features/blog/domain/models/blog-post.model';
import { makeBlogPost } from '@features/blog/testing/blog-post-builders';
import { byTestId, testIdText } from '@shared/testing/by-test-id';
import { settle, settleBounded } from '@shared/testing/settle';
import { toPostDraft, toPostInput, type PostDraft } from '../post-draft';
import { AdminPostForm } from './admin-post-form';

type FormOptions = {
  readonly post?: BlogPost;
  readonly persistedCover?: string;
};

type RenderedForm = {
  readonly fixture: ComponentFixture<AdminPostForm>;
  readonly host: HTMLElement;
  readonly value: WritableSignal<PostDraft>;
  readonly tags: WritableSignal<ReadonlySet<string>>;
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
  const post = options.post ?? null;
  const value = signal(toPostDraft(post));
  const tags = signal<ReadonlySet<string>>(new Set(post?.tags ?? []));
  const fixture = TestBed.createComponent(AdminPostForm, {
    bindings: [
      twoWayBinding('value', value),
      twoWayBinding('tags', tags),
      inputBinding('persistedCover', () => options.persistedCover ?? ''),
    ],
  });
  const submitted: BlogPostInput[] = [];
  const covers: File[] = [];
  fixture.componentInstance.submitted.subscribe((payload) => submitted.push(payload));
  fixture.componentInstance.coverSelected.subscribe((file) => covers.push(file));
  await settle(fixture);
  return { fixture, host: fixture.nativeElement as HTMLElement, value, tags, submitted, covers };
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

const labelOf = (host: HTMLElement, control: HTMLElement | null | undefined): string | null => {
  if (!control?.id) return null;
  const labels = [...host.querySelectorAll('label')].filter(
    (label) => label.getAttribute('for') === control.id,
  );
  return labels.length === 1 ? normalized(labels[0]) : null;
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

describe('AdminPostForm: sections numérotées', () => {
  const SECTION_CONTROLS = [
    {
      title: '01 · Article',
      controls: ['admin-post-title', 'admin-post-excerpt', 'admin-post-tags'],
    },
    { title: '02 · Contenu', controls: ['admin-post-content', 'admin-post-content-preview'] },
    { title: '03 · Couverture', controls: ['admin-post-cover'] },
    {
      title: '04 · Publication',
      controls: ['admin-post-status-draft', 'admin-post-status-published'],
    },
  ] as const;

  it('Given the form When it renders Then four numbered fieldsets follow one another', async () => {
    const { host } = await renderForm();

    expect(
      all(host, 'form-section').map((section) => ({
        tag: section.tagName,
        title: testIdText(section, 'form-section-title'),
      })),
    ).toEqual(SECTION_CONTROLS.map(({ title }) => ({ tag: 'FIELDSET', title })));
  });

  it.each(SECTION_CONTROLS)(
    'Given a new article When the form renders Then the section $title holds its fields',
    async ({ title, controls }) => {
      const { host } = await renderForm();
      const section = all(host, 'form-section').find(
        (candidate) => testIdText(candidate, 'form-section-title') === title,
      );

      expect(controls.filter((testId) => !section || byTestId(section, testId) === null)).toEqual(
        [],
      );
    },
  );

  it('Given the form When it renders Then the four sections live in the form « post-form », which holds no button of its own to submit or cancel', async () => {
    const { host } = await renderForm({ post: EDITABLE });
    const form = byTestId(host, 'admin-post-form');

    expect({
      tag: form?.tagName,
      id: form?.id,
      inForm: all(host, 'form-section').map((section) => form?.contains(section) ?? false),
      submitButtons: form?.querySelectorAll('button[type="submit"]').length,
      cancel: [...(form?.querySelectorAll('button, a') ?? [])].some(
        (control) => normalized(control) === 'Annuler',
      ),
    }).toEqual({
      tag: 'FORM',
      id: 'post-form',
      inForm: [true, true, true, true],
      submitButtons: 0,
      cancel: false,
    });
  });

  it.each([
    { testId: 'admin-post-title', label: 'Titre obligatoire' },
    { testId: 'admin-post-excerpt', label: 'Extrait obligatoire' },
    { testId: 'admin-post-content', label: 'Contenu (Markdown) obligatoire' },
  ])(
    'Given the form When it renders Then $testId is labelled « $label », the mention « obligatoire » included',
    async ({ testId, label }) => {
      const { host } = await renderForm();

      expect(labelOf(host, byTestId(host, testId))).toBe(label);
    },
  );
});

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

  it.each([
    { testId: 'admin-post-title', field: 'title' },
    { testId: 'admin-post-excerpt', field: 'excerpt' },
    { testId: 'admin-post-content', field: 'contentMarkdown' },
  ] as const)(
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

  it('Given the subject chips When the admin selects RxJS Then the page subjects and the payload hold it', async () => {
    const rendered = await renderForm({ post: EDITABLE });
    const chip = all(rendered.host, 'tag-chip').find((element) => normalized(element) === 'RxJS');

    chip?.click();
    await settle(rendered.fixture);
    await submitForm(rendered);

    expect({
      tags: [...rendered.tags()],
      sent: rendered.submitted.map((payload) => payload.tags),
      chipInSubjects: byTestId(rendered.host, 'admin-post-tags')?.contains(chip ?? null) ?? false,
    }).toEqual({
      tags: ['Chiffrement', 'RxJS'],
      sent: [['Chiffrement', 'RxJS']],
      chipInSubjects: true,
    });
  });

  it('Given an edited article When it is submitted unchanged Then the payload is the draft converted with the page subjects', async () => {
    const rendered = await renderForm({ post: EDITABLE });

    await submitForm(rendered);

    expect(rendered.submitted).toEqual([
      toPostInput(toPostDraft(EDITABLE), new Set(EDITABLE.tags)),
    ]);
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

  it('Given a code block When the preview renders Then the block, which may scroll, is reachable with the keyboard', async () => {
    const { host } = await renderForm({
      post: makeBlogPost({ contentMarkdown: 'Texte\n\n```ts\nconst x = 1;\n```' }),
    });

    expect(
      [...(preview(host)?.querySelectorAll('pre') ?? [])].map((pre) =>
        pre.getAttribute('tabindex'),
      ),
    ).toEqual(['0']);
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

describe('AdminPostForm: publication', () => {
  it('Given the form When it renders Then the publication offers two radios, « Brouillon » and « Publié », in one group', async () => {
    const { host } = await renderForm();
    const radios = [radio(host, 'draft'), radio(host, 'published')];

    expect({
      types: radios.map((input) => input?.type),
      labels: radios.map((input) => normalized(input?.closest('label'))),
      sameGroup: Boolean(radios[0]?.name) && radios[0]?.name === radios[1]?.name,
    }).toEqual({ types: ['radio', 'radio'], labels: ['Brouillon', 'Publié'], sameGroup: true });
  });

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

  it.each([
    { status: 'draft', note: null },
    {
      status: 'published',
      note: "Publier l'article redéploie le site\u00a0: il est en ligne quelques minutes plus tard.",
    },
  ] as const)(
    'Given an article with status $status When the publication section renders Then the redeploy note is $note',
    async ({ status, note }) => {
      const { host } = await renderForm({ post: makeBlogPost({ status }) });
      const element = byTestId(host, 'admin-post-redeploy-note');

      expect(element ? normalized(element) : null).toBe(note);
    },
  );
});

describe('AdminPostForm: couverture', () => {
  it('Given a persisted cover When the form renders Then the current cover stands before the drop zone', async () => {
    const { host } = await renderForm({
      post: EDITABLE,
      persistedCover: 'https://cdn.test/blog/b-1.avif',
    });
    const current = byTestId(host, 'admin-post-cover-current');
    const zone = byTestId(host, 'admin-post-cover');
    const image = current?.querySelector('img');

    expect({
      currentFirst:
        current && zone
          ? current.compareDocumentPosition(zone) & Node.DOCUMENT_POSITION_FOLLOWING
          : 0,
      image: { src: image?.getAttribute('src'), alt: image?.getAttribute('alt') },
    }).toEqual({
      currentFirst: Node.DOCUMENT_POSITION_FOLLOWING,
      image: {
        src: 'https://cdn.test/blog/b-1.avif',
        alt: 'Couverture actuelle de Chiffrement côté client',
      },
    });
  });

  it('Given no persisted cover When the form renders Then the drop zone stands alone', async () => {
    const { host } = await renderForm();

    expect({
      current: byTestId(host, 'admin-post-cover-current'),
      zone: byTestId(host, 'admin-post-cover')?.tagName,
    }).toEqual({ current: null, zone: 'APP-FILE-DROPZONE' });
  });

  it.each([
    { file: new File(['x'], 'cover.png', { type: 'image/png' }), emitted: 1 },
    { file: new File(['x'], 'notes.pdf', { type: 'application/pdf' }), emitted: 0 },
  ])(
    'Given the cover field When $file.name is chosen Then $emitted cover is handed to the page',
    async ({ file, emitted }) => {
      const rendered = await renderForm({ post: EDITABLE });

      rendered.fixture.debugElement
        .query(By.css('[data-testid="admin-post-cover"]'))
        ?.triggerEventHandler('fileSelected', file);
      await settle(rendered.fixture);

      expect(rendered.covers).toEqual(emitted === 1 ? [file] : []);
    },
  );
});
