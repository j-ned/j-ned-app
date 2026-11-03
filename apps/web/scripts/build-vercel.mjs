// Sortie Vercel du service « web » (ADR-0036), au format Build Output API, après le build de production
// (`pnpm run build --configuration production`, CSP comprise) :
// - fichiers et pages prérendues en statique sur le CDN, cache immuable des fichiers empreintés ;
// - une fonction `ssr` autour du `reqHandler` d'Angular pour la liste fermée des pages rendues à la
//   requête, `sitemap.xml`, `rss.xml` et `/healthz` (cache CDN posé par le serveur) ;
// - en-têtes de sécurité partout, 410 des pages retirées, coquille cliente de l'admin, vraie 404.
import { execFileSync } from 'node:child_process';
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const BUILD = join(ROOT, 'dist', 'angular-portfolio-app');
const OUTPUT = join(ROOT, '.vercel', 'output');
const FUNCTION = join(OUTPUT, 'functions', 'ssr.func');

if (!existsSync(join(BUILD, 'server', 'csp-manifest.json'))) {
  throw new Error(
    'Build de production absent : lancer `pnpm run build --configuration production`.',
  );
}

rmSync(OUTPUT, { recursive: true, force: true });
mkdirSync(FUNCTION, { recursive: true });

// --- Statique ---------------------------------------------------------------------------------
cpSync(join(BUILD, 'browser'), join(OUTPUT, 'static'), { recursive: true });

// --- Fonction de rendu --------------------------------------------------------------------------
cpSync(join(BUILD, 'server'), join(FUNCTION, 'server'), { recursive: true });
writeFileSync(join(FUNCTION, 'package.json'), '{"type":"module"}\n');
writeFileSync(
  join(FUNCTION, 'index.mjs'),
  `// Fonction Vercel du rendu serveur : hôte forcé (Angular refuse
// tout hôte hors \`allowedHosts\`, et l'URL d'API ne dérive jamais de la requête), en-têtes de proxy envoyés
// par le client effacés ; l'IP du visiteur vient de \`x-real-ip\`, posé par Vercel.
import { reqHandler } from './server/server.mjs';

const CLIENT_PROXY_HEADERS = [
  'forwarded',
  'x-forwarded-for',
  'x-forwarded-host',
  'x-forwarded-proto',
  'x-forwarded-port',
  'x-forwarded-prefix',
];

export default function handler(req, res) {
  for (const header of CLIENT_PROXY_HEADERS) delete req.headers[header];
  req.headers.host = 'nedellec-julien.fr';
  return new Promise((resolve) => {
    res.once('close', resolve);
    reqHandler(req, res, (error) => {
      if (error) console.error(error);
      if (!res.headersSent) res.statusCode = error ? 500 : 404;
      res.end();
    });
  });
}
`,
);
writeFileSync(
  join(FUNCTION, '.vc-config.json'),
  `${JSON.stringify(
    {
      runtime: 'nodejs22.x',
      handler: 'index.mjs',
      launcherType: 'Nodejs',
      shouldAddHelpers: false,
      supportsResponseStreaming: true,
      maxDuration: 30,
    },
    null,
    2,
  )}\n`,
);

// jsdom reste externe au bundle serveur (`externalDependencies`), importé par le rendu des articles.
const jsdomVersion = JSON.parse(
  readFileSync(join(ROOT, 'node_modules', 'jsdom', 'package.json'), 'utf8'),
).version;
writeFileSync(
  join(FUNCTION, 'deps.json'),
  `${JSON.stringify({ private: true, dependencies: { jsdom: jsdomVersion } })}\n`,
);
execFileSync(
  'npm',
  [
    'install',
    '--omit=dev',
    '--no-audit',
    '--no-fund',
    '--no-package-lock',
    '--prefix',
    FUNCTION,
    `jsdom@${jsdomVersion}`,
  ],
  { stdio: 'inherit' },
);
rmSync(join(FUNCTION, 'deps.json'));
writeFileSync(join(FUNCTION, 'package.json'), '{"type":"module"}\n');

// Le chargeur de Vercel refuse un `require()` d'ESM, que font des dépendances de jsdom
// (html-encoding-sniffer → @exodus/bytes) : jsdom est regroupé en un seul module ESM, à sa place, qui
// exporte ses noms publics (`import { JSDOM } from 'jsdom'` dans le bundle serveur).
const installed = join(FUNCTION, 'node_modules');
const bundled = join(OUTPUT, 'jsdom-bundle');
mkdirSync(bundled, { recursive: true });
writeFileSync(
  join(bundled, 'entry.mjs'),
  "export { JSDOM, VirtualConsole, CookieJar, requestInterceptor, toughCookie } from 'jsdom';\n",
);
await build({
  entryPoints: [join(bundled, 'entry.mjs')],
  outfile: join(bundled, 'jsdom', 'index.mjs'),
  bundle: true,
  platform: 'node',
  format: 'esm',
  // Les modules CommonJS regroupés appellent `require` (modules Node intégrés, `require.resolve`). Le seul
  // `__dirname` de jsdom lit la feuille de style par défaut depuis `lib/jsdom/living/css/helpers` :
  // il pointe vers ce chemin, où le fichier est copié plus bas.
  banner: {
    js: [
      "import { createRequire } from 'node:module';",
      "import { dirname as __bundleDirname, join as __bundleJoin } from 'node:path';",
      "import { fileURLToPath as __bundlePath } from 'node:url';",
      'const require = createRequire(import.meta.url);',
      "const __dirname = __bundleJoin(__bundleDirname(__bundlePath(import.meta.url)), 'lib/jsdom/living/css/helpers');",
    ].join('\n'),
  },
  target: 'node22',
  external: ['canvas'],
  nodePaths: [installed],
  logLevel: 'error',
});
mkdirSync(join(bundled, 'jsdom', 'lib', 'jsdom', 'browser'), { recursive: true });
cpSync(
  join(installed, 'jsdom', 'lib', 'jsdom', 'browser', 'default-stylesheet.css'),
  join(bundled, 'jsdom', 'lib', 'jsdom', 'browser', 'default-stylesheet.css'),
);
// Chargé par `require.resolve('./xhr-sync-worker.js')` à l'import, relativement au fichier regroupé.
cpSync(
  join(installed, 'jsdom', 'lib', 'jsdom', 'living', 'xhr', 'xhr-sync-worker.js'),
  join(bundled, 'jsdom', 'xhr-sync-worker.js'),
);
writeFileSync(
  join(bundled, 'jsdom', 'package.json'),
  `${JSON.stringify({ name: 'jsdom', version: jsdomVersion, type: 'module', main: 'index.mjs' })}\n`,
);
rmSync(installed, { recursive: true, force: true });
mkdirSync(installed);
cpSync(join(bundled, 'jsdom'), join(installed, 'jsdom'), { recursive: true });
rmSync(bundled, { recursive: true, force: true });

// --- Routes -----------------------------------------------------------------------------------
const IMMUTABLE = 'public, max-age=31536000, immutable';
const REVALIDATE = 'public, max-age=0, must-revalidate';

const SECURITY_HEADERS = {
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  // La CSP complète (script-src haché par page) vit dans la <meta> ; frame-ancestors n'existe qu'en en-tête.
  'Content-Security-Policy': "frame-ancestors 'none'",
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
  'Cross-Origin-Opener-Policy': 'same-origin',
};

// Pages prérendues : leur `index.html`, sous leur chemin sans fichier.
const prerendered = readdirSync(join(OUTPUT, 'static'), { withFileTypes: true })
  .filter(
    (entry) => entry.isDirectory() && existsSync(join(OUTPUT, 'static', entry.name, 'index.html')),
  )
  .map((entry) => entry.name);

const routes = [
  { src: '^/(.*)$', headers: SECURITY_HEADERS, continue: true },

  // Chunks Angular et polices : le nom porte l'empreinte du contenu.
  {
    src: '^/(chunk|main|styles)-[A-Za-z0-9_-]{8}\\.(js|css)$',
    headers: { 'Cache-Control': IMMUTABLE },
    continue: true,
  },
  { src: '^/fonts/.*$', headers: { 'Cache-Control': IMMUTABLE }, continue: true },
  // Sprite d'icônes : immuable seulement via l'URL empreintée `?v=…`.
  {
    src: '^/icons/sprite\\.svg$',
    has: [{ type: 'query', key: 'v' }],
    headers: { 'Cache-Control': IMMUTABLE },
    continue: true,
  },

  // Offres et prise de rendez-vous retirées (spec 029) : 410, corps = coquille cliente.
  {
    src: '^/(offres|offre-site-industrie|rendez-vous)(/.*)?$',
    dest: '/index.csr.html',
    status: 410,
    headers: { 'Cache-Control': 'no-cache' },
  },

  // Routes rendues côté client (RenderMode.Client) : coquille CSR, revalidée à chaque visite.
  {
    src: '^/(login|two-factor|admin)(/.*)?$',
    dest: '/index.csr.html',
    headers: { 'Cache-Control': 'no-cache' },
  },

  // Rendu à la requête (RenderMode.Server), liste fermée : une URL inconnue ne réveille pas la fonction.
  {
    src: '^/(about|projects(/[^/]+)?|blog(/[^/]+)?|atelier(/(plaquettes|decodeur))?)?/?$',
    methods: ['GET', 'HEAD'],
    dest: '/ssr',
  },
  { src: '^/(sitemap|rss)\\.xml$', methods: ['GET', 'HEAD'], dest: '/ssr' },
  { src: '^/healthz$', dest: '/ssr' },

  // Pages prérendues (mentions légales, confidentialité).
  ...prerendered.map((name) => ({
    src: `^/${name}/?$`,
    dest: `/${name}/index.html`,
    headers: { 'Cache-Control': 'no-cache' },
  })),

  { handle: 'filesystem' },

  // Autres fichiers statiques : revalidés (ETag → 304).
  {
    src: '^/.*\\.(js|css|woff2?|ttf|otf|eot|png|jpe?g|gif|webp|avif|svg|ico|txt|xml|webmanifest)$',
    headers: { 'Cache-Control': REVALIDATE },
    continue: true,
  },

  // URL inconnue : vraie 404, corps = coquille cliente (le routeur y affiche la page « non trouvée »).
  { src: '^/.*$', dest: '/index.csr.html', status: 404, headers: { 'Cache-Control': 'no-cache' } },
];

writeFileSync(join(OUTPUT, 'config.json'), `${JSON.stringify({ version: 3, routes }, null, 2)}\n`);
console.log(
  `.vercel/output : statique + fonction ssr (jsdom@${jsdomVersion}), ${prerendered.length} page(s) prérendue(s)`,
);
