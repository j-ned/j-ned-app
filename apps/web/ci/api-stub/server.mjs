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

// Preuves locales de l'admin : `STUB_ADMIN_SESSION=1` fait répondre `/auth/me` (aucun mot de passe,
// la session ne s'ouvre qu'avec l'indice `auth:session` posé dans le navigateur).
const ADMIN_SESSION = process.env.STUB_ADMIN_SESSION === '1';
const STUB_ADMIN = { id: 'stub-admin', email: 'admin@stub.test', isTwoFactorEnabled: false };

// Un `PUT /api/profile` est gardé en mémoire : la fixture sur disque reste la ligne de base.
let savedProfile = null;
const readProfile = async () => savedProfile ?? readFixture('profile');

async function replaceProfile({ version, ...content }) {
  const current = await readProfile();
  if (version !== current.version) {
    return [409, { statusCode: 409, message: 'Le parcours a changé : version périmée' }];
  }
  savedProfile = {
    ...current,
    ...content,
    version: current.version + 1,
    updatedAt: new Date().toISOString(),
  };
  return [200, savedProfile];
}

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return Buffer.concat(chunks);
}

const readJson = async (req) => JSON.parse((await readBody(req)).toString('utf8'));

// Le dernier portrait reçu est servi tel quel sous une clé neuve, comme le ferait le stockage.
let portraitFile = null;
let portraitUploads = 0;

function filePart(body, contentType) {
  const boundary = /boundary=(.+)$/.exec(contentType ?? '')?.[1];
  const start = body.indexOf('name="file"');
  if (!boundary || start === -1) return null;
  const headersEnd = body.indexOf('\r\n\r\n', start);
  const type = /Content-Type: (.+)/i.exec(body.subarray(start, headersEnd).toString())?.[1].trim();
  const end = body.indexOf(`\r\n--${boundary}`, headersEnd);
  return { type: type ?? 'application/octet-stream', bytes: body.subarray(headersEnd + 4, end) };
}

async function replacePortrait(req) {
  const file = filePart(await readBody(req), req.headers['content-type']);
  if (!file) return [422, { statusCode: 422, message: 'File is required' }];
  portraitUploads += 1;
  portraitFile = {
    ...file,
    key: `/storage/portfolio-storage/profile/portrait-stub${portraitUploads}.avif`,
  };
  savedProfile = { ...(await readProfile()), portrait: portraitFile.key };
  return [200, savedProfile];
}

async function removePortrait() {
  portraitFile = null;
  savedProfile = { ...(await readProfile()), portrait: null };
  return [204, null];
}

async function route(req, pathname) {
  const { method } = req;
  if (method === 'POST' && pathname === '/api/analytics/track') return [204, null];
  if (method === 'PUT' && pathname === '/api/profile') return replaceProfile(await readJson(req));
  if (method === 'POST' && pathname === '/api/profile/portrait') return replacePortrait(req);
  if (method === 'DELETE' && pathname === '/api/profile/portrait') return removePortrait();
  if (ADMIN_SESSION && method === 'GET' && pathname === '/api/auth/me') return [200, STUB_ADMIN];
  if (method !== 'GET' && method !== 'HEAD') return [405, { message: 'Method Not Allowed' }];

  if (pathname === '/api/projects') return [200, await readFixture('projects')];
  if (pathname === '/api/blog/posts') {
    const posts = await readFixture('blog-posts');
    return [200, posts.filter((post) => post.status === 'published')];
  }
  if (pathname === '/api/cv') return [200, await readFixture('cv')];
  if (pathname === '/api/profile') return [200, await readProfile()];
  if (portraitFile && pathname === `/api${portraitFile.key}`) return [200, portraitFile];
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
    const [status, body] = await route(req, pathname);
    if (body === null) {
      res.writeHead(status).end();
      return;
    }
    if (Buffer.isBuffer(body.bytes)) {
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
