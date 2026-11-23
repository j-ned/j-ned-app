import { NotFoundException } from '../common/http-errors';
import { readAll } from './s3-utils';
import type { StorageService } from './storage.service';

// Seules la lecture et l'écriture d'objets servent à dériver une image.
export type DerivedImageStorage = Pick<StorageService, 'get' | 'upload'>;

export type DerivedImage<TContentType extends string> = {
  readonly buffer: Buffer;
  readonly contentType: TContentType;
};

// Calculée à la première demande puis conservée dans S3 ; `StorageService` la jette quand l'original
// change. Ni backfill ni colonne en base : les images déjà en ligne en profitent.
export async function getOrDerive<TContentType extends string>(
  storage: DerivedImageStorage,
  bucket: string,
  key: string,
  derived: { readonly key: string; readonly contentType: TContentType },
  derive: (original: Buffer) => Promise<Buffer>,
): Promise<DerivedImage<TContentType>> {
  try {
    const cached = await storage.get(bucket, derived.key);
    return {
      buffer: await readAll(cached.stream),
      contentType: derived.contentType,
    };
  } catch (err: unknown) {
    if (!(err instanceof NotFoundException)) throw err;
  }

  const original = await storage.get(bucket, key);
  const buffer = await derive(await readAll(original.stream));
  await storage.upload(bucket, derived.key, buffer, derived.contentType);
  return { buffer, contentType: derived.contentType };
}
