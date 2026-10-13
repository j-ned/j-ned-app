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

// Lectures de l'admin, testées avant l'expression du slug d'article (`/blog/posts/admin` n'en est pas un).
async function readAdmin(pathname, searchParams) {
  if (pathname === '/api/blog/posts/admin') return [200, await readFixture('blog-posts')];
  if (pathname === '/api/contact/messages') {
    return [200, { data: await readFixture('contact-messages') }];
  }
  if (pathname === '/api/contact/messages/unread-count') {
    const messages = await readFixture('contact-messages');
    return [200, { count: messages.filter((message) => !message.read).length }];
  }
  const stats = pathname.match(/^\/api\/analytics\/stats\/([a-z-]+)$/);
  if (!stats) return null;
  const segment = (await readFixture('analytics-stats'))[stats[1]];
  // `metrics` et `events` sont indexés par le paramètre `type` de la requête.
  const type = searchParams.get('type');
  const body = type === null ? segment : segment?.[type];
  return body === undefined ? [404, { message: 'Not Found' }] : [200, body];
}

// Prise de rendez-vous : créneaux et rendez-vous datés depuis l'heure courante, jamais périmés.
const DAY_MS = 24 * 60 * 60 * 1000;
const SLOT_MS = 30 * 60 * 1000;
const SLOT_UTC_MINUTES = [480, 510, 540, 780, 810, 840];
const CANCEL_TOKEN = /^[A-Za-z0-9_-]{43}$/;
const BOOKING_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const STUB_VIDEO_URL = 'https://meet.jit.si/nedellec-stub0000000000';

const utcDayStart = (offsetDays) => {
  const today = new Date();
  return (
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()) + offsetDays * DAY_MS
  );
};
const isoAt = (offsetDays, minute) =>
  new Date(utcDayStart(offsetDays) + minute * 60_000).toISOString();
const plusSlot = (iso) => new Date(Date.parse(iso) + SLOT_MS).toISOString();
const isoDate = (offsetDays) => new Date(utcDayStart(offsetDays)).toISOString().slice(0, 10);

// Du surlendemain au 19e jour : toujours entre le préavis de 24 h et l'horizon de 21 jours.
function freeSlots() {
  const slots = [];
  for (let day = 2; day <= 19; day += 1) {
    const weekday = new Date(utcDayStart(day)).getUTCDay();
    if (weekday === 0 || weekday === 6) continue;
    for (const minute of SLOT_UTC_MINUTES) {
      const startsAt = isoAt(day, minute);
      slots.push({ startsAt, endsAt: plusSlot(startsAt) });
    }
  }
  return slots;
}

function adminBooking(id, offsetDays, minute, fields) {
  const startsAt = isoAt(offsetDays, minute);
  return {
    id,
    startsAt,
    endsAt: plusSlot(startsAt),
    phone: null,
    company: null,
    videoUrl: null,
    status: 'confirmed',
    cancelledAt: null,
    cancelledBy: null,
    cancelReason: null,
    reminderSentAt: null,
    createdAt: isoAt(-3, 600),
    ...fields,
  };
}

function adminBookings(scope) {
  if (scope === 'past') {
    return [
      adminBooking('7c1f4d2e-0000-4000-8000-000000000004', -9, 540, {
        name: 'Hugo Lefèvre',
        email: 'hugo.lefevre@exemple.test',
        message: 'Refonte de la vitrine de notre cabinet.',
        format: 'video',
        videoUrl: STUB_VIDEO_URL,
      }),
    ];
  }
  return [
    adminBooking('7c1f4d2e-0000-4000-8000-000000000001', 2, 540, {
      name: 'Claire Martin',
      email: 'claire.martin@atelier-exemple.test',
      company: 'Atelier Martin',
      message: 'Site vitrine pour présenter nos réalisations de menuiserie.',
      format: 'video',
      videoUrl: STUB_VIDEO_URL,
    }),
    adminBooking('7c1f4d2e-0000-4000-8000-000000000002', 3, 780, {
      name: 'Karim Benali',
      email: 'karim.benali@exemple.test',
      phone: '+33 6 12 34 56 78',
      message: 'Maintenance d’une application Angular interne.',
      format: 'phone',
    }),
    adminBooking('7c1f4d2e-0000-4000-8000-000000000003', 5, 810, {
      name: 'Sophie Durand',
      email: 'sophie.durand@exemple.test',
      message: 'Audit de performance de notre boutique.',
      format: 'video',
      status: 'cancelled',
      cancelledAt: isoAt(-1, 600),
      cancelledBy: 'owner',
      cancelReason: 'Déplacement imprévu ce jour-là, je vous propose un autre créneau par e-mail.',
    }),
  ];
}

const closures = () => [
  {
    id: '5a0d1c3b-0000-4000-8000-000000000001',
    startsOn: isoDate(7),
    endsOn: isoDate(9),
    reason: 'Congés',
  },
  {
    id: '5a0d1c3b-0000-4000-8000-000000000002',
    startsOn: isoDate(14),
    endsOn: isoDate(14),
    reason: null,
  },
];

async function routeBookingPublic(req, method, pathname) {
  if (method === 'GET' && pathname === '/api/booking/slots') {
    return [200, { timeZone: 'Europe/Paris', slots: freeSlots() }];
  }
  if (method === 'POST' && pathname === '/api/booking/bookings') {
    const { startsAt, format } = await readJson(req);
    return [
      201,
      {
        id: '7c1f4d2e-0000-4000-8000-0000000000ff',
        startsAt,
        endsAt: plusSlot(startsAt),
        format,
        videoUrl: format === 'video' ? STUB_VIDEO_URL : null,
      },
    ];
  }
  const cancel = pathname.match(/^\/api\/booking\/bookings\/cancel(\/preview)?$/);
  if (method === 'POST' && cancel) {
    const { token } = await readJson(req);
    if (typeof token !== 'string' || !CANCEL_TOKEN.test(token)) {
      return [400, { statusCode: 400, error: 'Bad Request', message: 'token must match' }];
    }
    if (!cancel[1]) return [200, { status: 'cancelled' }];
    const startsAt = isoAt(3, 780);
    return [
      200,
      {
        startsAt,
        endsAt: plusSlot(startsAt),
        format: 'video',
        status: 'confirmed',
        cancellable: true,
      },
    ];
  }
  return null;
}

async function routeBookingAdmin(req, method, pathname, searchParams) {
  if (!pathname.startsWith('/api/booking/')) return null;
  if (method === 'GET' && pathname === '/api/booking/availability/rules') {
    return [200, { data: await readFixture('booking-availability-rules') }];
  }
  if (method === 'PUT' && pathname === '/api/booking/availability/rules') {
    return [200, { data: (await readJson(req)).rules }];
  }
  if (method === 'GET' && pathname === '/api/booking/availability/closures') {
    return [200, { data: closures() }];
  }
  if (method === 'POST' && pathname === '/api/booking/availability/closures') {
    const { startsOn, endsOn, reason } = await readJson(req);
    return [
      201,
      { id: '5a0d1c3b-0000-4000-8000-0000000000ff', startsOn, endsOn, reason: reason ?? null },
    ];
  }
  const closure = pathname.match(/^\/api\/booking\/availability\/closures\/([^/]+)$/);
  if (method === 'DELETE' && closure) {
    return closures().some((row) => row.id === closure[1])
      ? [204, null]
      : [404, { message: 'Not Found' }];
  }
  if (method === 'GET' && pathname === '/api/booking/bookings/upcoming-count') {
    const count = adminBookings('upcoming').filter((row) => row.status === 'confirmed').length;
    return [200, { count }];
  }
  if (method === 'GET' && pathname === '/api/booking/bookings') {
    const scope = searchParams.get('scope');
    if (scope !== 'upcoming' && scope !== 'past')
      return [400, { statusCode: 400, message: 'scope' }];
    return [200, { data: adminBookings(scope) }];
  }
  const ownerCancel = pathname.match(/^\/api\/booking\/bookings\/([^/]+)\/cancel$/);
  if (method === 'PATCH' && ownerCancel && BOOKING_ID.test(ownerCancel[1])) {
    const found = adminBookings('upcoming').find((row) => row.id === ownerCancel[1]);
    if (!found) return [404, { message: 'Not Found' }];
    const { reason } = await readJson(req);
    return [
      200,
      {
        ...found,
        status: 'cancelled',
        cancelledAt: new Date().toISOString(),
        cancelledBy: 'owner',
        cancelReason: reason ?? null,
      },
    ];
  }
  return null;
}

async function route(req, pathname, searchParams) {
  const { method } = req;
  if (method === 'POST' && pathname === '/api/analytics/track') return [204, null];
  if (method === 'PUT' && pathname === '/api/profile') return replaceProfile(await readJson(req));
  if (method === 'POST' && pathname === '/api/profile/portrait') return replacePortrait(req);
  if (method === 'DELETE' && pathname === '/api/profile/portrait') return removePortrait();
  if (ADMIN_SESSION && method === 'GET' && pathname === '/api/auth/me') return [200, STUB_ADMIN];
  const bookingPublic = await routeBookingPublic(req, method, pathname);
  if (bookingPublic) return bookingPublic;
  if (ADMIN_SESSION) {
    const bookingAdmin = await routeBookingAdmin(req, method, pathname, searchParams);
    if (bookingAdmin) return bookingAdmin;
  }
  if (method !== 'GET' && method !== 'HEAD') return [405, { message: 'Method Not Allowed' }];

  if (ADMIN_SESSION) {
    const adminRead = await readAdmin(pathname, searchParams);
    if (adminRead) return adminRead;
  }

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
  const { pathname, searchParams } = new URL(req.url ?? '/', 'http://stub');
  console.log(`${req.method} ${req.url} xff=${req.headers['x-forwarded-for'] ?? '-'}`);
  try {
    const [status, body] = await route(req, pathname, searchParams);
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
