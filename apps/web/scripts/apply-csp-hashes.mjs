// Post-build : remplace `'unsafe-inline'` de `script-src` par les hachages SHA-256 des scripts
// inline que le prérendu Angular émet (contrat d'event replay, bootstrap jsaction) et du seul
// gestionnaire inline (`onload` du CSS non bloquant). Chaque page a ses propres scripts, donc chaque
// `index.html` reçoit sa propre CSP. La source `src/index.html` garde `'unsafe-inline'` pour le dev
// server ; la CI vérifie que la sortie de prod ne le contient plus.
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const DIST = 'dist/angular-portfolio-app/browser';
const INLINE_SCRIPT = /<script(?![^>]*\bsrc=)([^>]*)>([\s\S]*?)<\/script>/g;
const INLINE_HANDLER = /\son[a-z]+="([^"]*)"/g;
const CSP_META = /(<meta\s+http-equiv="Content-Security-Policy"\s+content=")([^"]*)(")/;

const sha256 = (s) => `'sha256-${createHash('sha256').update(s).digest('base64')}'`;

function* htmlFiles(dir) {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) yield* htmlFiles(p);
    else if (entry === 'index.html') yield p;
  }
}

function harden(html) {
  const scriptHashes = new Set();
  for (const [, attrs, body] of html.matchAll(INLINE_SCRIPT)) {
    if (/type="application\/(ld\+)?json"/.test(attrs)) continue; // données, jamais exécutées
    scriptHashes.add(sha256(body));
  }
  const handlerHashes = new Set([...html.matchAll(INLINE_HANDLER)].map(([, code]) => sha256(code)));

  return html.replace(CSP_META, (_, open, csp, close) => {
    const directives = csp
      .split(';')
      .map((d) => d.trim())
      .filter(Boolean)
      .map((d) => {
        if (!d.startsWith('script-src ')) return d;
        const sources = d
          .split(/\s+/)
          .slice(1)
          .filter((s) => s !== "'unsafe-inline'");
        return ['script-src', ...sources, ...scriptHashes].join(' ');
      });
    if (handlerHashes.size > 0) {
      directives.push(`script-src-attr 'unsafe-hashes' ${[...handlerHashes].join(' ')}`);
    }
    return `${open}${directives.join('; ')};${close}`;
  });
}

let pages = 0;
for (const file of htmlFiles(DIST)) {
  const html = readFileSync(file, 'utf8');
  const hardened = harden(html);
  if (hardened === html) throw new Error(`No CSP meta found in ${file}`);
  if (/script-src[^;]*'unsafe-inline'/.test(hardened))
    throw new Error(`unsafe-inline still in ${file}`);
  writeFileSync(file, hardened);
  pages++;
}
console.log(`CSP hardened on ${pages} prerendered page(s).`);
