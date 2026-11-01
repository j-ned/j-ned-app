import { inputBinding, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { describe, it, expect, afterEach } from 'vitest';
import { byTestId } from '@shared/testing/by-test-id';
import { settle } from '@shared/testing/settle';
import { BlogArticleBody } from './blog-article-body';

type RenderedBody = {
  readonly fixture: ComponentFixture<BlogArticleBody>;
  readonly content: () => HTMLElement | null;
};

async function renderBody(
  markdown: () => string,
  topHeadingLevel?: () => number,
): Promise<RenderedBody> {
  const fixture = TestBed.createComponent(BlogArticleBody, {
    bindings: [
      inputBinding('markdown', markdown),
      ...(topHeadingLevel ? [inputBinding('topHeadingLevel', topHeadingLevel)] : []),
    ],
  });
  await settle(fixture);
  return {
    fixture,
    content: () => byTestId(fixture.nativeElement as HTMLElement, 'blog-content'),
  };
}

const headings = (root: HTMLElement | null): readonly string[] =>
  [...(root?.querySelectorAll('h1, h2, h3, h4, h5, h6') ?? [])].map(
    (heading) => `${heading.tagName} ${heading.textContent?.trim() ?? ''}`,
  );

describe('BlogArticleBody', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('Given Markdown When the body renders Then its titles keep their level and their anchor', async () => {
    const { content } = await renderBody(() => '# Bonjour\n\n## Partie\n\nUn *mot*.');

    expect({
      headings: headings(content()),
      anchor: content()?.querySelector('h1')?.id,
      emphasis: content()?.querySelector('em')?.textContent,
    }).toEqual({ headings: ['H1 Bonjour', 'H2 Partie'], anchor: 'bonjour', emphasis: 'mot' });
  });

  it('Given a highest title level of 2 When the body renders Then every title goes one level down', async () => {
    const { content } = await renderBody(
      () => '# Titre\n\n## Partie\n\n###### Note',
      () => 2,
    );

    expect(headings(content())).toEqual(['H2 Titre', 'H3 Partie', 'H6 Note']);
  });

  it('Given a code block When the body renders Then the label, the colouring and the scrollable pre reach the page', async () => {
    const { content } = await renderBody(() => '```ts\ntype Id = string;\n```');
    const block = content()?.querySelector('[data-code-block]');

    expect({
      label: block?.querySelector('[data-code-label]')?.textContent?.trim(),
      tabindex: block?.querySelector('pre')?.getAttribute('tabindex'),
      keyword: [...(block?.querySelectorAll('pre code span') ?? [])].some(
        (span) => span.classList.contains('hljs-keyword') && span.textContent === 'type',
      ),
    }).toEqual({ label: 'TypeScript', tabindex: '0', keyword: true });
  });

  it('Given Markdown carrying a script and an inline handler When the body renders Then neither reaches the page', async () => {
    const { content } = await renderBody(
      () => 'Texte <img src="x.png" onerror="alert(1)"><script>alert(2)</script>',
    );
    const image = content()?.querySelector('img');

    expect({
      image: image?.getAttribute('src'),
      handler: image?.hasAttribute('onerror'),
      scripts: content()?.querySelectorAll('script').length,
    }).toEqual({ image: 'x.png', handler: false, scripts: 0 });
  });

  it('Given two code blocks When the body renders Then each block carries its copy button', async () => {
    const { content } = await renderBody(
      () => '```ts\nconst a = 1;\n```\n\n```sql\nSELECT 1;\n```',
    );

    expect(
      [...(content()?.querySelectorAll('[data-code-block]') ?? [])].map(
        (block) => block.querySelectorAll('button[data-code-copy][type="button"]').length,
      ),
    ).toEqual([1, 1]);
  });

  it('Given a body image stored with its size When the body renders Then its size and lazy loading reach the page', async () => {
    const src =
      'https://api.nedellec-julien.fr/api/storage/portfolio-storage/blog-content/3f2c1a9e-8b7d-4c6e-9f10-2a3b4c5d6e7f-a1b2c3d4-1600x900.avif';
    const { content } = await renderBody(() => `![Capture de l’éditeur](${src})`);
    const image = content()?.querySelector('img');

    expect({
      alt: image?.getAttribute('alt'),
      width: image?.getAttribute('width'),
      height: image?.getAttribute('height'),
      loading: image?.getAttribute('loading'),
      decoding: image?.getAttribute('decoding'),
    }).toEqual({
      alt: 'Capture de l’éditeur',
      width: '1600',
      height: '900',
      loading: 'lazy',
      decoding: 'async',
    });
  });

  it('Given the body When it renders Then inline code sits on a tinted ground and underlined text keeps the text colour with a thick offset line, unlike a link', async () => {
    const { content } = await renderBody(() => 'Un `code` et un <u>mot</u>.');
    const classes = [...(content()?.classList ?? [])];
    const underline = classes.filter((name) => name.startsWith('[&_u]:'));

    expect({
      inlineCode: ['prose-code:text-primary', 'prose-code:bg-foreground/6'].filter(
        (name) => !classes.includes(name),
      ),
      underlineColour: underline.includes('[&_u]:decoration-foreground/40'),
      underlineOffset: underline.includes('[&_u]:underline-offset-[0.3em]'),
      underlineThickness: underline.some((name) => /^\[&_u\]:decoration-\d+$/.test(name)),
      underlineInPrimary: underline.some((name) => name.includes('primary')),
      rendered: {
        code: content()?.querySelector('p code')?.textContent,
        underline: content()?.querySelector('u')?.textContent,
      },
    }).toEqual({
      inlineCode: [],
      underlineColour: true,
      underlineOffset: true,
      underlineThickness: true,
      underlineInPrimary: false,
      rendered: { code: 'code', underline: 'mot' },
    });
  });

  it('Given a rendered body When the Markdown changes Then the body follows it', async () => {
    const markdown = signal('## Avant');
    const { fixture, content } = await renderBody(markdown);

    markdown.set('## Après');
    await settle(fixture);

    expect(headings(content())).toEqual(['H2 Après']);
  });
});
