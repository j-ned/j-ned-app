// Doublure HTTP de l'API pour la smoke CI et les preuves locales (zéro dépendance). Les fixtures
// sont relues à chaque requête : modifier un fichier équivaut à une écriture admin.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

const PORT = Number(process.env.PORT ?? 3000);
const FIXTURES_DIR = process.env.FIXTURES_DIR ?? join(import.meta.dirname, 'fixtures');

const readFixture = async (name) =>
  JSON.parse(await readFile(join(FIXTURES_DIR, `${name}.json`), 'utf8'));

// Fichier de stockage factice : seuls son type et sa taille comptent (enclosure RSS, HEAD).
const STORAGE_FILE = { type: 'image/jpeg', bytes: Buffer.from('stub-image') };

const bySlugOrId = (key) => (row) => row.slug === key || row.id === key;

async function route(method, pathname) {
  if (method === 'POST' && pathname === '/api/analytics/track') return [204, null];
  if (method !== 'GET' && method !== 'HEAD') return [405, { message: 'Method Not Allowed' }];

  if (pathname === '/api/projects') return [200, await readFixture('projects')];
  if (pathname === '/api/blog/posts') {
    const posts = await readFixture('blog-posts');
    return [200, posts.filter((post) => post.status === 'published')];
  }
  if (pathname === '/api/cv') return [200, await readFixture('cv')];
  if (pathname.startsWith('/api/storage/')) return [200, STORAGE_FILE];

  const project = pathname.match(/^\/api\/projects\/([^/]+)$/);
  if (project) {
    const found = (await readFixture('projects')).find(bySlugOrId(project[1]));
    return found ? [200, found] : [404, { message: 'Not Found' }];
  }
  const post = pathname.match(/^\/api\/blog\/posts\/([^/]+)$/);
  if (post) {
    const found = (await readFixture('blog-posts')).find(bySlugOrId(post[1]));
    return found ? [200, found] : [404, { message: 'Not Found' }];
  }
  return [404, { message: 'Not Found' }];
}

createServer(async (req, res) => {
  const { pathname } = new URL(req.url ?? '/', 'http://stub');
  console.log(`${req.method} ${req.url} xff=${req.headers['x-forwarded-for'] ?? '-'}`);
  try {
    const [status, body] = await route(req.method, pathname);
    if (body === null) {
      res.writeHead(status).end();
      return;
    }
    if (body === STORAGE_FILE) {
      res.writeHead(status, { 'Content-Type': body.type, 'Content-Length': body.bytes.length });
      res.end(req.method === 'HEAD' ? undefined : body.bytes);
      return;
    }
    res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(body));
  } catch (error) {
    console.error(error);
    res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ message: 'Stub fixture error' }));
  }
}).listen(PORT, () => console.log(`api-stub listening on :${PORT}, fixtures ${FIXTURES_DIR}`));
