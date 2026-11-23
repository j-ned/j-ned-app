import { createHash } from 'node:crypto';
import type { Readable } from 'node:stream';
import {
  RESPONSIVE_IMAGE_WIDTHS,
  type ResponsiveImageWidth,
} from './image-optimizer.service';
import type { ImageOptimizer } from './image-optimizer.service';
import type { StorageService } from './storage.service';

// DeleteObject est déjà idempotent, mais la garde d'un emplacement vide évite un aller-retour réseau.
export async function deleteS3IfExists(
  storage: Pick<StorageService, 'delete'>,
  bucket: string,
  key: string | null | undefined,
): Promise<void> {
  if (!key) return;
  await storage.delete(bucket, key);
}

// 8 hexa du SHA-256 : suffisant pour distinguer deux versions d'une même image.
export function contentHash(buffer: Buffer): string {
  return createHash('sha256').update(buffer).digest('hex').slice(0, 8);
}

// AVIF ≤ 1600 px quel que soit le format reçu ; clé dérivée du contenu, donc une nouvelle URL par
// image, servie avec un cache immuable d'un an.
export async function storeOptimizedImage(
  storage: Pick<StorageService, 'upload'>,
  bucket: string,
  images: Pick<ImageOptimizer, 'optimize'>,
  keyPrefix: string,
  source: Buffer,
): Promise<string> {
  const image = await images.optimize(source);
  const key = `${keyPrefix}-${contentHash(image.buffer)}.${image.ext}`;
  await storage.upload(bucket, key, image.buffer, image.mimetype);
  return key;
}

// Carte de partage dérivée d'un objet image : `blog/<id>-<sha8>.avif.share.jpg`.
const SHARE_CARD_SUFFIX = '.share.jpg';

export function shareCardKey(key: string): string {
  return `${key}${SHARE_CARD_SUFFIX}`;
}

// `projects/<id>-<sha8>.avif.w800.avif`.
export function resizedImageKey(
  key: string,
  width: ResponsiveImageWidth,
): string {
  return `${key}.w${width}.avif`;
}

const DERIVED_KEY_PATTERN = /\.(share\.jpg|w\d+\.avif)$/;

// Carte de partage ou variante de largeur, jamais un original.
export function isDerivedKey(key: string): boolean {
  return DERIVED_KEY_PATTERN.test(key);
}

// À jeter quand l'original change.
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
