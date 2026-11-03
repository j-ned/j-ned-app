import { createHash } from 'node:crypto';
import type { Readable } from 'node:stream';
import {
  RESPONSIVE_IMAGE_WIDTHS,
  type ResponsiveImageWidth,
} from './image-optimizer.service';
import type { StorageService } from './storage.service';

/**
 * Deletes an S3 object only if `key` is a non-empty string.
 *
 * Centralises the "media slot may be empty" check shared by projects and
 * profile uploads. DeleteObject is already idempotent server-side, but the
 * guard saves a network round-trip and keeps callers terse.
 */
export async function deleteS3IfExists(
  storage: StorageService,
  bucket: string,
  key: string | null | undefined,
): Promise<void> {
  if (!key) return;
  await storage.delete(bucket, key);
}

/** 8 hexa du SHA-256 : suffisant pour distinguer deux versions d'une même image. */
export function contentHash(buffer: Buffer): string {
  return createHash('sha256').update(buffer).digest('hex').slice(0, 8);
}

/** Suffixe de la carte de partage (JPEG 1200×630) dérivée d'un objet image : `blog/<id>-<sha8>.avif.share.jpg`. */
const SHARE_CARD_SUFFIX = '.share.jpg';

export function shareCardKey(key: string): string {
  return `${key}${SHARE_CARD_SUFFIX}`;
}

/** Variante de largeur dérivée d'un objet image : `projects/<id>-<sha8>.avif.w800.avif`. */
export function resizedImageKey(
  key: string,
  width: ResponsiveImageWidth,
): string {
  return `${key}.w${width}.avif`;
}

const DERIVED_KEY_PATTERN = /\.(share\.jpg|w\d+\.avif)$/;

/** Clé d'une dérivée (carte de partage ou variante de largeur), jamais d'un original. */
export function isDerivedKey(key: string): boolean {
  return DERIVED_KEY_PATTERN.test(key);
}

/** Toutes les dérivées possibles d'un original, à jeter quand il change. */
export function derivedKeysOf(key: string): readonly string[] {
  return [
    shareCardKey(key),
    ...RESPONSIVE_IMAGE_WIDTHS.map((width) => resizedImageKey(key, width)),
  ];
}

export async function readAll(stream: Readable): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(
      Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as Uint8Array),
    );
  }
  return Buffer.concat(chunks);
}
