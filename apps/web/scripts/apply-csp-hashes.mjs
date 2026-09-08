// Post-build : remplace `'unsafe-inline'` de `script-src` et `style-src` par des hachages SHA-256.
// La source `src/index.html` garde `'unsafe-inline'` pour le dev server ; la CI vérifie que la
// sortie de prod n'en contient plus.
//
// Scripts : le prérendu émet deux scripts inline par page (contrat d'event replay, bootstrap
// jsaction dont la liste d'événements varie par page) et un gestionnaire inline (`onload` du CSS
// non bloquant) → hachés page par page.
//
// Styles : les feuilles de composants (`<style ng-app-id>`) et le CSS critique varient par page,
// mais en navigation SPA Angular réinjecte à la volée les mêmes feuilles que celles d'une page
// prérendue ; l'union des hachages de toutes les pages couvre donc aussi les routes rendues côté
// client. Les attributs `style="…"` viennent des bindings SSR (`NgOptimizedImage fill`,
// animation-delay) : hachés eux aussi (`'unsafe-hashes'`), le client les réapplique ensuite via le
// CSSOM, hors CSP.
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const DIST = 'dist/angular-portfolio-app/browser';
const INLINE_SCRIPT = /<script(?![^>]*\bsrc=)([^>]*)>([\s\S]*?)<\/script>/g;
const INLINE_HANDLER = /\son[a-z]+="([^"]*)"/g;
const INLINE_STYLE_ELEMENT = /<style[^>]*>([\s\S]*?)<\/style>/g;
const INLINE_STYLE_ATTR = /\sstyle="([^"]*)"/g;
const CSP_META = /(<meta\s+http-equiv="Content-Security-Policy"\s+content=")([^"]*)(")/;

const sha256 = (s) => `'sha256-${createHash('sha256').update(s).digest('base64')}'`;
const hashesOf = (html, regex, pick) =>
  new Set([...html.matchAll(regex)].map((m) => sha256(pick(m))));

function* htmlFiles(dir) {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) yield* htmlFiles(p);
    else if (entry === 'index.html') yield p;
  }
}

function collectStyleHashes(pages) {
  const elements = new Set();
  const attrs = new Set();
  for (const html of pages) {
    for (const h of hashesOf(html, INLINE_STYLE_ELEMENT, (m) => m[1])) elements.add(h);
    for (const h of hashesOf(html, INLINE_STYLE_ATTR, (m) => m[1])) attrs.add(h);
  }
  return { elements, attrs };
}

function withoutUnsafeInline(directive, name, hashes) {
  const sources = directive
    .split(/\s+/)
    .slice(1)
    .filter((s) => s !== "'unsafe-inline'");
  return [name, ...sources, ...hashes].join(' ');
}

function harden(html, styleHashes) {
  const scriptHashes = new Set();
  for (const [, attrs, body] of html.matchAll(INLINE_SCRIPT)) {
    if (/type="application\/(ld\+)?json"/.test(attrs)) continue; // données, jamais exécutées
    scriptHashes.add(sha256(body));
  }
  const handlerHashes = hashesOf(html, INLINE_HANDLER, (m) => m[1]);

  return html.replace(CSP_META, (_, open, csp, close) => {
    const directives = csp
      .split(';')
      .map((d) => d.trim())
      .filter(Boolean)
      .map((d) => {
        if (d.startsWith('script-src ')) return withoutUnsafeInline(d, 'script-src', scriptHashes);
        if (d.startsWith('style-src '))
          return withoutUnsafeInline(d, 'style-src', styleHashes.elements);
        return d;
      });
    if (handlerHashes.size > 0) {
      directives.push(`script-src-attr 'unsafe-hashes' ${[...handlerHashes].join(' ')}`);
    }
    if (styleHashes.attrs.size > 0) {
      directives.push(`style-src-attr 'unsafe-hashes' ${[...styleHashes.attrs].join(' ')}`);
    }
    return `${open}${directives.join('; ')};${close}`;
  });
}

const sources = new Map([...htmlFiles(DIST)].map((file) => [file, readFileSync(file, 'utf8')]));
const styleHashes = collectStyleHashes(sources.values());
for (const [file, html] of sources) {
  const hardened = harden(html, styleHashes);
  if (hardened === html) throw new Error(`No CSP meta found in ${file}`);
  if (/(script|style)-src [^;]*'unsafe-inline'/.test(hardened)) {
    throw new Error(`unsafe-inline still in ${file}`);
  }
  writeFileSync(file, hardened);
}
console.log(
  `CSP hardened on ${sources.size} page(s): ${styleHashes.elements.size} style element hash(es), ${styleHashes.attrs.size} style attribute hash(es).`,
);
