// Fonction Vercel du service « api » (ADR-0036), construite après `pnpm build` (tsc) :
// - un seul fichier, `dist/index.js` (celui que Vercel exécute), bundlé par esbuild depuis la sortie de tsc : les métadonnées de
//   décorateurs (class-validator) sont déjà émises par tsc, et les dépendances ESM (otplib → @scure/base,
//   file-type…) sont intégrées, là où le chargeur de Vercel refuse un `require()` d'ESM ;
// - à côté, un `node_modules` réduit aux seuls modules natifs (argon2, sharp), aux versions du lockfile :
//   Vercel ne déploie que `dist/`, sans les liens symboliques de pnpm.
import { execFileSync } from 'node:child_process';
import {
  cpSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');
const NATIVE = ['argon2', 'sharp'];

await build({
  entryPoints: [join(DIST, 'index.js')],
  outfile: join(DIST, 'index.js'),
  allowOverwrite: true,
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node22',
  external: [...NATIVE, 'pino-pretty'],
  logLevel: 'warning',
});

// Versions exactes installées dans le workspace (lockfile), pas les plages du package.json.
const versions = Object.fromEntries(
  NATIVE.map((name) => [
    name,
    JSON.parse(
      readFileSync(join(ROOT, 'node_modules', name, 'package.json'), 'utf8'),
    ).version,
  ]),
);
const runtime = join(DIST, 'runtime');
rmSync(runtime, { recursive: true, force: true });
mkdirSync(runtime, { recursive: true });
writeFileSync(
  join(runtime, 'package.json'),
  `${JSON.stringify({ private: true, dependencies: versions }, null, 2)}\n`,
);
execFileSync(
  'npm',
  [
    'install',
    '--omit=dev',
    '--no-audit',
    '--no-fund',
    '--no-package-lock',
    '--install-links',
  ],
  { cwd: runtime, stdio: 'inherit' },
);
rmSync(join(DIST, 'node_modules'), { recursive: true, force: true });
cpSync(join(runtime, 'node_modules'), join(DIST, 'node_modules'), {
  recursive: true,
});
rmSync(runtime, { recursive: true, force: true });

// Les fonctions Vercel tournent en linux-x64 : les binaires argon2 des autres plateformes (~750 Ko) partent.
const prebuilds = join(DIST, 'node_modules', 'argon2', 'prebuilds');
for (const platform of readdirSync(prebuilds)) {
  if (platform !== 'linux-x64') {
    rmSync(join(prebuilds, platform), { recursive: true, force: true });
  }
}

console.log(
  `dist/index.js (bundle) + node_modules (${Object.entries(versions)
    .map(([n, v]) => `${n}@${v}`)
    .join(', ')})`,
);
