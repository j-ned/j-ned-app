// Rejoue en local la sortie de `scripts/build-vercel.mjs` (`.vercel/output`), pour le smoke test et
// l'audit axe : table de routes de `config.json`, fichiers statiques, fonction `ssr`, et `/api/*` relayé
// vers `API_UPSTREAM` comme la réécriture de `vercel.json`. Sémantique reprise du comportement mesuré en
// production : une route `continue` ajoute ses en-têtes et poursuit ; une route à `dest` termine ; après
// `handle: filesystem`, un fichier trouvé reçoit encore les en-têtes des routes `continue` qui suivent,
// sans écraser ceux déjà posés (une police garde `immutable`, le favicon reçoit `must-revalidate`).
//   API_UPSTREAM=http://127.0.0.1:3001 PORT=3000 node ci/vercel-local.mjs
import { existsSync, readFileSync, statSync } from 'node:fs';
import { createServer, request as httpRequest } from 'node:http';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUTPUT = fileURLToPath(new URL('../.vercel/output/', import.meta.url));
const PORT = Number(process.env.PORT ?? 3000);
const API_UPSTREAM = process.env.API_UPSTREAM;
if (!API_UPSTREAM) throw new Error('API_UPSTREAM manquant (URL de la doublure de l’API)');

const { routes } = JSON.parse(readFileSync(join(OUTPUT, 'config.json'), 'utf8'));
const { default: ssr } = await import(join(OUTPUT, 'functions', 'ssr.func', 'index.mjs'));

const CONTENT_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml',
  '.webmanifest': 'application/manifest+json',
  '.pdf': 'application/pdf',
};

const matches = (route, method, pathname, query) =>
  new RegExp(route.src).test(pathname) &&
  (!route.methods || route.methods.includes(method)) &&
  (route.has ?? []).every((condition) => condition.type !== 'query' || query.has(condition.key));

/** Fichier statique servi pour un chemin, s'il existe : `/a/` et `/a` désignent `a/index.html`. */
function staticFile(pathname) {
  const relative = normalize(decodeURIComponent(pathname)).replace(/^(\.\.[/\\])+/, '');
  for (const candidate of [relative, join(relative, 'index.html')]) {
    const file = join(OUTPUT, 'static', candidate);
    if (existsSync(file) && statSync(file).isFile()) return file;
  }
  return null;
}

function serveFile(res, file, status, headers) {
  res.writeHead(status, {
    'Content-Type': CONTENT_TYPES[extname(file)] ?? 'application/octet-stream',
    ...headers,
  });
  res.end(readFileSync(file));
}

function proxyApi(req, res) {
  const upstream = new URL(req.url, API_UPSTREAM);
  const proxied = httpRequest(upstream, { method: req.method, headers: req.headers }, (answer) => {
    res.writeHead(answer.statusCode ?? 502, answer.headers);
    answer.pipe(res);
  });
  proxied.on('error', () => {
    res.writeHead(502);
    res.end();
  });
  req.pipe(proxied);
}

createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname.startsWith('/api/')) return proxyApi(req, res);

  const method = req.method ?? 'GET';
  const headers = {};
  let afterFilesystem = false;
  for (const [index, route] of routes.entries()) {
    if (route.handle === 'filesystem') {
      afterFilesystem = true;
      const file = staticFile(url.pathname);
      if (!file) continue;
      for (const next of routes.slice(index + 1)) {
        if (next.continue && matches(next, method, url.pathname, url.searchParams)) {
          for (const [name, value] of Object.entries(next.headers ?? {})) headers[name] ??= value;
        }
      }
      return serveFile(res, file, 200, headers);
    }
    if (!matches(route, method, url.pathname, url.searchParams)) continue;
    Object.assign(headers, route.headers);
    if (route.continue) continue;
    if (route.dest === '/ssr') {
      for (const [name, value] of Object.entries(headers)) res.setHeader(name, value);
      return ssr(req, res);
    }
    const file = staticFile(route.dest);
    if (!file) throw new Error(`dest sans fichier : ${route.dest}`);
    return serveFile(res, file, route.status ?? 200, headers);
  }
  res.writeHead(afterFilesystem ? 404 : 500);
  res.end();
}).listen(PORT, '127.0.0.1', () => console.log(`vercel-local : http://127.0.0.1:${PORT}`));
