import { describe, expect, it } from 'vitest';
import { hardenCsp, type CspBuildManifest } from './harden-csp';

const BASE_CSP =
  "default-src 'self'; script-src 'self' 'unsafe-inline' https://giscus.app; style-src 'self' 'unsafe-inline' https://giscus.app; img-src 'self' data:; object-src 'none'; base-uri 'self';";

const THEME_SCRIPT =
  "(function(){var t=localStorage.getItem('theme');document.documentElement.dataset.theme=t||'dark'})()";
const BOOTSTRAP_SCRIPT = 'window.__jsaction_bootstrap(document.body,"ng",["click"],[]);';
const UNKNOWN_SCRIPT = "fetch('/collect?c='+document.cookie)";
const SPA_SHEET = '.toast{animation:slide-in .2s}';
const CRITICAL_CSS = 'body{margin:0}';
const BODY_CSS = '.injected{color:red}';
const MANIFEST_STYLE_ATTR = 'animation-delay: 80ms';
const FILL_STYLE_ATTR = 'position:absolute;width:100%;height:100%';
const DELAY_STYLE_ATTR = 'animation-delay: 120ms';

const fakeSha256 = (text: string): string =>
  `'sha256-${btoa(String.fromCharCode(...new TextEncoder().encode(text)))}'`;

function aManifest(overrides: Partial<CspBuildManifest> = {}): CspBuildManifest {
  return { scriptHashes: [], styleElementHashes: [], styleAttrHashes: [], ...overrides };
}

function aPage({
  head = '',
  body = '',
}: {
  readonly head?: string;
  readonly body?: string;
}): string {
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="${BASE_CSP}"/>${head}</head><body>${body}</body></html>`;
}

function directivesOf(html: string): ReadonlyMap<string, readonly string[]> {
  const content = /<meta\s+http-equiv="Content-Security-Policy"\s+content="([^"]*)"/.exec(
    html,
  )?.[1];
  if (content === undefined) throw new Error('no CSP meta in the hardened page');
  return new Map(
    content
      .split(';')
      .map((directive) => directive.trim())
      .filter(Boolean)
      .map((directive): [string, readonly string[]] => {
        const [name, ...sources] = directive.split(/\s+/);
        return [name, sources];
      }),
  );
}

const sourcesOf = (html: string, directive: string): readonly string[] =>
  [...(directivesOf(html).get(directive) ?? [])].sort();

const sorted = (sources: readonly string[]): readonly string[] => [...sources].sort();

const harden = (html: string, manifest: CspBuildManifest = aManifest()): string =>
  hardenCsp(html, manifest, fakeSha256);

describe('hardenCsp', () => {
  it('Given a page without inline code When it is hardened Then unsafe-inline leaves script-src and style-src and the other sources stay', () => {
    const hardened = harden(aPage({}));

    expect({
      script: sourcesOf(hardened, 'script-src'),
      style: sourcesOf(hardened, 'style-src'),
    }).toEqual({
      script: sorted(["'self'", 'https://giscus.app']),
      style: sorted(["'self'", 'https://giscus.app']),
    });
  });

  it('Given a page When it is hardened Then the directives unrelated to inline code are kept as they are', () => {
    const directives = directivesOf(harden(aPage({})));

    expect([directives.get('img-src'), directives.get('object-src')]).toEqual([
      ["'self'", 'data:'],
      ["'none'"],
    ]);
  });

  it('Given an inline script listed in the build manifest When the page is hardened Then its hash is allowed', () => {
    const hardened = harden(
      aPage({ head: `<script>${THEME_SCRIPT}</script>` }),
      aManifest({ scriptHashes: [fakeSha256(THEME_SCRIPT)] }),
    );

    expect(sourcesOf(hardened, 'script-src')).toEqual(
      sorted(["'self'", 'https://giscus.app', fakeSha256(THEME_SCRIPT)]),
    );
  });

  it.each([
    ['a single event', 'window.__jsaction_bootstrap(document.body,"ng",["click"],[]);'],
    [
      'several events',
      'window.__jsaction_bootstrap(document.body,"ng",["click","keydown","input"],["focusin","focusout"]);',
    ],
    ['no event at all', 'window.__jsaction_bootstrap(document.body,"ng",[],[]);'],
  ])(
    'Given the event replay bootstrap with %s When the page is hardened Then its hash is allowed without being in the manifest',
    (_label, bootstrap) => {
      const hardened = harden(aPage({ body: `<script>${bootstrap}</script>` }));

      expect(sourcesOf(hardened, 'script-src')).toEqual(
        sorted(["'self'", 'https://giscus.app', fakeSha256(bootstrap)]),
      );
    },
  );

  it('Given an inline script that is neither in the manifest nor the bootstrap When the page is hardened Then its hash is not allowed', () => {
    const hardened = harden(
      aPage({
        head: `<script>${THEME_SCRIPT}</script>`,
        body: `<p>Article</p><script>${UNKNOWN_SCRIPT}</script>`,
      }),
      aManifest({ scriptHashes: [fakeSha256(THEME_SCRIPT)] }),
    );

    expect(sourcesOf(hardened, 'script-src')).toEqual(
      sorted(["'self'", 'https://giscus.app', fakeSha256(THEME_SCRIPT)]),
    );
  });

  it.each([
    ['code appended after it', `${BOOTSTRAP_SCRIPT};alert(1)`],
    ['code prepended before it', `alert(1);${BOOTSTRAP_SCRIPT}`],
    [
      'a call closed early',
      'window.__jsaction_bootstrap(document.body,"ng",["click"]);alert(1);//"],[]);',
    ],
  ])(
    'Given a bootstrap altered with %s When the page is hardened Then its hash is not allowed',
    (_label, altered) => {
      const hardened = harden(
        aPage({ head: `<script>${THEME_SCRIPT}</script>`, body: `<script>${altered}</script>` }),
        aManifest({ scriptHashes: [fakeSha256(THEME_SCRIPT)] }),
      );

      expect(sourcesOf(hardened, 'script-src')).toEqual(
        sorted(["'self'", 'https://giscus.app', fakeSha256(THEME_SCRIPT)]),
      );
    },
  );

  it('Given JSON data scripts When the page is hardened Then they never enter script-src', () => {
    const hardened = harden(
      aPage({
        head: `<script>${THEME_SCRIPT}</script><script type="application/ld+json">{"@context":"https://schema.org","@type":"Article"}</script>`,
        body: '<script id="ng-state" type="application/json">{"__nghData__":[{}]}</script>',
      }),
      aManifest({ scriptHashes: [fakeSha256(THEME_SCRIPT)] }),
    );

    expect(sourcesOf(hardened, 'script-src')).toEqual(
      sorted(["'self'", 'https://giscus.app', fakeSha256(THEME_SCRIPT)]),
    );
  });

  it('Given style elements in the head and in the body When the page is hardened Then style-src allows the manifest and the head styles only', () => {
    const hardened = harden(
      aPage({
        head: `<style ng-app-id="ng">${CRITICAL_CSS}</style>`,
        body: `<main><style>${BODY_CSS}</style></main>`,
      }),
      aManifest({ styleElementHashes: [fakeSha256(SPA_SHEET)] }),
    );

    expect(sourcesOf(hardened, 'style-src')).toEqual(
      sorted(["'self'", 'https://giscus.app', fakeSha256(SPA_SHEET), fakeSha256(CRITICAL_CSS)]),
    );
  });

  it('Given a style tag written as text inside a JSON script of the head When the page is hardened Then it is not allowed in style-src', () => {
    const editorialCss = 'body{background:red}';
    const hardened = harden(
      aPage({
        head: `<style>${CRITICAL_CSS}</style><script type="application/ld+json">{"description":"Résumé <style>${editorialCss}</style>"}</script>`,
        body: `<article><style>${editorialCss}</style></article>`,
      }),
    );

    expect(sourcesOf(hardened, 'style-src')).toEqual(
      sorted(["'self'", 'https://giscus.app', fakeSha256(CRITICAL_CSS)]),
    );
  });

  it('Given a JSON script of the head whose text closes the head early When the page is hardened Then the style written before it in that text is not allowed', () => {
    const editorialCss = 'body{background:red}';
    const hardened = harden(
      aPage({
        head: `<style>${CRITICAL_CSS}</style><script type="application/ld+json">{"description":"<style>${editorialCss}</style></head><body>"}</script>`,
      }),
    );

    expect(sourcesOf(hardened, 'style-src')).toEqual(
      sorted(["'self'", 'https://giscus.app', fakeSha256(CRITICAL_CSS)]),
    );
  });

  it('Given style attributes in the page When it is hardened Then style-src-attr allows them along with the manifest ones', () => {
    const hardened = harden(
      aPage({
        body: `<img alt="" style="${FILL_STYLE_ATTR}"><span style="${DELAY_STYLE_ATTR}">Projet</span>`,
      }),
      aManifest({ styleAttrHashes: [fakeSha256(MANIFEST_STYLE_ATTR)] }),
    );

    expect(sourcesOf(hardened, 'style-src-attr')).toEqual(
      sorted([
        "'unsafe-hashes'",
        fakeSha256(MANIFEST_STYLE_ATTR),
        fakeSha256(FILL_STYLE_ATTR),
        fakeSha256(DELAY_STYLE_ATTR),
      ]),
    );
  });

  it('Given an already hardened page When it is hardened again Then it comes out identical', () => {
    const manifest = aManifest({
      scriptHashes: [fakeSha256(THEME_SCRIPT)],
      styleElementHashes: [fakeSha256(SPA_SHEET)],
      styleAttrHashes: [fakeSha256(MANIFEST_STYLE_ATTR)],
    });
    const page = aPage({
      head: `<script>${THEME_SCRIPT}</script><style>${CRITICAL_CSS}</style>`,
      body: `<span style="${DELAY_STYLE_ATTR}">Projet</span><script>${BOOTSTRAP_SCRIPT}</script>`,
    });

    const once = harden(page, manifest);
    const twice = harden(once, manifest);

    expect(twice).toBe(once);
    expect({
      script: sourcesOf(twice, 'script-src'),
      style: sourcesOf(twice, 'style-src'),
      styleAttr: sourcesOf(twice, 'style-src-attr'),
    }).toEqual({
      script: sorted([
        "'self'",
        'https://giscus.app',
        fakeSha256(THEME_SCRIPT),
        fakeSha256(BOOTSTRAP_SCRIPT),
      ]),
      style: sorted([
        "'self'",
        'https://giscus.app',
        fakeSha256(SPA_SHEET),
        fakeSha256(CRITICAL_CSS),
      ]),
      styleAttr: sorted([
        "'unsafe-hashes'",
        fakeSha256(MANIFEST_STYLE_ATTR),
        fakeSha256(DELAY_STYLE_ATTR),
      ]),
    });
  });

  it('Given a page without a CSP meta When it is hardened Then it fails instead of serving an unprotected page', () => {
    const unprotected = '<!doctype html><html lang="fr"><head></head><body></body></html>';

    expect(() => harden(unprotected)).toThrow();
  });
});
