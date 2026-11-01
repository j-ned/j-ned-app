import { cpSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';

/**
 * Copie les gabarits d'e-mail (`**\/mail-templates/*.html`) de `src` vers `dist`, à côté du JS
 * compilé qui les lit (`resolve(__dirname, 'mail-templates')`). Lancé après `tsc` par `pnpm build`.
 */
const SRC = join(__dirname, '..', 'src');
const DIST = __dirname;

cpSync(SRC, DIST, {
  recursive: true,
  filter: (source) => {
    const path = relative(SRC, source);
    return (
      !path.endsWith('.ts') &&
      (!/\.\w+$/.test(path) || /(^|\/)mail-templates\/[^/]+\.html$/.test(path))
    );
  },
});
console.log(`mail templates copied to ${relative(dirname(DIST), DIST)}`);
