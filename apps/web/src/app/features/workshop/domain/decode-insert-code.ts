import {
  ISO_1832_CLEARANCES,
  ISO_1832_FIXINGS,
  ISO_1832_NOSE_RADII,
  ISO_1832_SHAPES,
  ISO_1832_SIZES,
  ISO_1832_THICKNESSES,
  ISO_1832_TOLERANCES,
} from './iso-1832.static-data';
import type {
  DecodedInsertPosition,
  InsertCodeDecoding,
  InsertCodeError,
  InsertCodePosition,
  Iso1832LetterTable,
  Iso1832Sources,
} from './models/insert-code.model';

type PositionReader = {
  readonly position: InsertCodePosition;
  readonly label: string;
  readonly sources: Iso1832Sources;
  readonly offset: number;
  readonly width: number;
  readonly meaningOf: (code: string, shape: string) => string | undefined;
};

const MAKER_SUFFIX_OFFSET = 10;

const fromTable = <Code extends string>(
  table: Iso1832LetterTable<Code>,
  offset: number,
  width: number,
): PositionReader => ({
  ...table,
  offset,
  width,
  meaningOf: (code) => Object.entries<string>(table.entries).find(([key]) => key === code)?.[1],
});

// Code de taille = longueur d'arête en mm, tronquée ; le cercle inscrit n'est connu que des formes tabulées.
const sizeMeaning = (code: string, shape: string): string | undefined => {
  if (!/^\d{2}$/.test(code) || shape === 'R') return undefined;
  const edge = `Arête de ${Number(code)}\u00a0mm`;
  const circles = Object.entries(ISO_1832_SIZES.inscribedCircles).find(
    ([sized]) => sized === shape,
  )?.[1];
  if (circles === undefined) return code === '00' ? undefined : edge;
  const circle = circles[code];
  return circle === undefined ? undefined : `${edge} (cercle inscrit ${circle}\u00a0mm)`;
};

const READERS: readonly PositionReader[] = [
  fromTable(ISO_1832_SHAPES, 0, 1),
  fromTable(ISO_1832_CLEARANCES, 1, 1),
  fromTable(ISO_1832_TOLERANCES, 2, 1),
  fromTable(ISO_1832_FIXINGS, 3, 1),
  { ...ISO_1832_SIZES, offset: 4, width: 2, meaningOf: sizeMeaning },
  fromTable(ISO_1832_THICKNESSES, 6, 2),
  fromTable(ISO_1832_NOSE_RADII, 8, 2),
];

// En pouces (ANSI), la taille est un seul chiffre (cercle inscrit en 1/8″), parfois en demi-valeur : CNMG 432, CCGT 32.51.
const ansiError = (code: string): InsertCodeError | undefined => {
  const letters = /^[A-Z]*/.exec(code)?.[0] ?? '';
  const size = /^[\d.]+/.exec(code.slice(letters.length))?.[0] ?? '';
  const inches = size.includes('.') || /^\d{3}$/.test(size);
  if (!inches || (letters.length !== 3 && letters.length !== 4)) return undefined;
  return { position: letters.length === 3 ? 4 : 5, reason: 'ansi', found: size };
};

export function normalizeInsertCode(raw: string): string {
  return raw.toUpperCase().replace(/[\s-]+/g, '');
}

export function textAfterInsertCode(raw: string): string | undefined {
  const decoding = decodeInsertCode(raw);
  if (!decoding.ok) return undefined;
  let remaining = normalizeInsertCode(raw).length - decoding.suffix.length;
  let index = 0;
  while (remaining > 0 && index < raw.length) {
    if (!/[\s-]/.test(raw[index])) remaining -= 1;
    index += 1;
  }
  return raw.slice(index);
}

export function decodeInsertCode(raw: string): InsertCodeDecoding {
  const code = normalizeInsertCode(raw);
  const ansi = ansiError(code);
  if (ansi !== undefined) return { ok: false, error: ansi };

  const positions: DecodedInsertPosition[] = [];
  for (const { position, label, sources, offset, width, meaningOf } of READERS) {
    const found = code.slice(offset, offset + width);
    if (found.length < width) return { ok: false, error: { position, reason: 'missing', found } };
    const meaning = meaningOf(found, code.charAt(0));
    if (meaning === undefined) return { ok: false, error: { position, reason: 'unknown', found } };
    positions.push({ position, label, code: found, meaning, sources });
  }
  return { ok: true, positions, suffix: code.slice(MAKER_SUFFIX_OFFSET) };
}
