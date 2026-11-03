import { NotFoundException } from '../common/http-errors';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  type GetObjectCommandOutput,
  DeleteObjectCommand,
  NoSuchKey,
} from '@aws-sdk/client-s3';
import type { Readable } from 'node:stream';
import { derivedKeysOf, isDerivedKey } from './s3-utils';

export type S3ObjectStream = {
  stream: Readable;
  contentType: string;
  contentLength: number;
};

export class StorageService {
  constructor(private readonly s3: S3Client) {}

  /** Écrit l'objet et jette ses dérivées (carte de partage, variantes de largeur), devenues obsolètes. */
  async upload(
    bucket: string,
    key: string,
    body: Buffer,
    contentType: string,
  ): Promise<void> {
    await this.s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
      }),
    );
    await this.deleteDerivedOf(bucket, key);
  }

  async get(bucket: string, key: string): Promise<S3ObjectStream> {
    let res: GetObjectCommandOutput;
    try {
      res = await this.s3.send(
        new GetObjectCommand({ Bucket: bucket, Key: key }),
      );
    } catch (err: unknown) {
      if (err instanceof NoSuchKey) {
        throw new NotFoundException(`S3 object ${bucket}/${key} not found`);
      }
      throw err;
    }
    if (!res.Body) {
      throw new NotFoundException(`S3 object ${bucket}/${key} has empty body`);
    }
    return {
      stream: res.Body as Readable,
      contentType: res.ContentType ?? 'application/octet-stream',
      contentLength: res.ContentLength ?? 0,
    };
  }

  /** Efface l'objet et ses dérivées. */
  async delete(bucket: string, key: string): Promise<void> {
    // S3 DeleteObject est idempotent : pas d'erreur si la clé n'existe pas.
    await this.s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
    await this.deleteDerivedOf(bucket, key);
  }

  private async deleteDerivedOf(bucket: string, key: string): Promise<void> {
    if (isDerivedKey(key)) return;
    for (const derived of derivedKeysOf(key)) {
      await this.s3.send(
        new DeleteObjectCommand({ Bucket: bucket, Key: derived }),
      );
    }
  }

  /**
   * Retourne une URL publique servie par l'API (proxy S3, `storage.routes.ts`).
   * Format: `/storage/{bucket}/{key}` - chemin relatif au préfixe `/api` global.
   * Le frontend résout vers `${apiUrl}${path}` côté Angular.
   *
   * Pourquoi un proxy plutôt qu'une URL S3 directe ? R2 supporte l'accès anonyme
   * via Public Buckets ou Custom Domain, mais le Custom Domain exige que le DNS
   * soit géré par Cloudflare - ce n'est pas (encore) notre cas. En attendant,
   * le proxy de l'API détient les credentials et stream l'objet.
   */
  getPublicUrl(bucket: string, key: string): string {
    return `/storage/${bucket}/${key}`;
  }
}
