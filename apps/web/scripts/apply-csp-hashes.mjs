// Post-build : durcit la CSP des pages prérendues (`'unsafe-inline'` remplacé par des hachages) et
// écrit le manifeste que le serveur Node applique aux pages rendues à la requête. La source
// `src/index.html` garde `'unsafe-inline'` pour le dev server ; la CI vérifie la sortie de prod.
//
// Manifeste : scripts inline constants (pré-peinture du thème, contrat d'event replay, bascule
// `media` de beasties), feuilles `<style>` et attributs `style` de toutes les pages prérendues. En
// navigation SPA, Angular réinjecte les mêmes feuilles de composants : l'union couvre aussi les
// routes rendues côté client.
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { buildCspManifest, hardenCsp } from '../src/server/csp/harden-csp.ts';
import { nodeSha256 } from '../src/server/csp/node-sha256.ts';

const DIST = 'dist/angular-portfolio-app';
const BROWSER = join(DIST, 'browser');

function* htmlFiles(dir) {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) yield* htmlFiles(p);
    // index.csr.html : coquille sans hydratation, servie par nginx aux routes client et aux 404.
    else if (entry === 'index.html' || entry === 'index.csr.html') yield p;
  }
}

const pages = new Map([...htmlFiles(BROWSER)].map((file) => [file, readFileSync(file, 'utf8')]));
const manifest = buildCspManifest(pages.values(), nodeSha256);

for (const [file, html] of pages) {
  const hardened = hardenCsp(html, manifest, nodeSha256, (script) => {
    throw new Error(`Inline script outside the CSP allowlist in ${file}: ${script.slice(0, 120)}`);
  });
  if (/(script|style)-src [^;]*'unsafe-inline'/.test(hardened)) {
    throw new Error(`unsafe-inline still in ${file}`);
  }
  writeFileSync(file, hardened);
}
writeFileSync(join(DIST, 'server', 'csp-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(
  `CSP hardened on ${pages.size} page(s); manifest: ${manifest.scriptHashes.length} script, ${manifest.styleElementHashes.length} style element, ${manifest.styleAttrHashes.length} style attribute hash(es).`,
);
