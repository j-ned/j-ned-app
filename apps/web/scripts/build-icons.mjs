#!/usr/bin/env node
// Génère public/icons/sprite.svg à partir des icônes déclarées dans
// src/app/shared/icons/icon-map.ts, en utilisant les SVGs sources de
// @fortawesome/fontawesome-free et en optimisant via SVGO.
//
// Usage :
//   pnpm icons:build           # génère + écrit le sprite
//   pnpm icons:check           # exit 1 si le sprite est désynchronisé
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import SVGSpriter from 'svg-sprite';
import { optimize } from 'svgo';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..');
const FA_BASE = join(REPO_ROOT, 'node_modules', '@fortawesome', 'fontawesome-free', 'svgs');
const SPRITE_PATH = join(REPO_ROOT, 'public', 'icons', 'sprite.svg');
const CHECK_MODE = process.argv.includes('--check');

const { uniqueIcons } = await import(resolve(REPO_ROOT, 'src/app/shared/icons/icon-map.ts'));
const icons = uniqueIcons();

const spriter = new SVGSpriter({
  mode: {
    symbol: {
      inline: true,
      sprite: 'sprite.svg',
      dest: '.',
    },
  },
});

let missingIcons = [];
for (const ref of icons) {
  const sourcePath = join(FA_BASE, ref.style, `${ref.id}.svg`);
  if (!existsSync(sourcePath)) {
    missingIcons.push(`${ref.style}/${ref.id}.svg`);
    continue;
  }
  const raw = readFileSync(sourcePath, 'utf-8');
  const optimized = optimize(raw, {
    plugins: [
      { name: 'preset-default', params: { overrides: { removeViewBox: false } } },
    ],
  }).data;
  spriter.add(`${ref.style}-${ref.id}.svg`, null, optimized);
}

if (missingIcons.length > 0) {
  console.error(`ERROR: missing source SVGs in @fortawesome/fontawesome-free:`);
  missingIcons.forEach((p) => console.error(`  - ${p}`));
  console.error(`Check the icon-map.ts entries; the ids may be wrong.`);
  process.exit(1);
}

const { result } = await spriter.compileAsync();
const spriteContents = result.symbol.sprite.contents.toString('utf-8');

if (CHECK_MODE) {
  if (!existsSync(SPRITE_PATH)) {
    console.error(`ERROR: ${SPRITE_PATH} does not exist. Run \`pnpm icons:build\`.`);
    process.exit(1);
  }
  const existing = readFileSync(SPRITE_PATH, 'utf-8');
  if (existing.trim() !== spriteContents.trim()) {
    console.error(`ERROR: ${SPRITE_PATH} is out of sync with icon-map.ts. Run \`pnpm icons:build\`.`);
    process.exit(1);
  }
  console.log(`OK: sprite is in sync (${icons.length} icons).`);
  process.exit(0);
}

mkdirSync(dirname(SPRITE_PATH), { recursive: true });
writeFileSync(SPRITE_PATH, spriteContents);
console.log(`Built ${SPRITE_PATH} with ${icons.length} icons.`);
