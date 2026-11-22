import {
  NotFoundException,
  ServiceUnavailableException,
} from '../common/http-errors';
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

// Images, CV, portrait.
export const STORAGE_BUCKET = 'portfolio-storage';

// Sans client (configuration incomplète, hors production seulement), chaque accès répond 503 : l'API
// démarre, une image publique est simplement absente.
export class StorageService {
  constructor(private readonly s3: S3Client | null) {}

  private client(): S3Client {
    if (!this.s3) {
      throw new ServiceUnavailableException(
        'File storage is disabled on this environment',
      );
    }
    return this.s3;
  }

  // Jette aussi ses dérivées (carte de partage, variantes de largeur), devenues obsolètes.
  async upload(
    bucket: string,
    key: string,
    body: Buffer,
    contentType: string,
  ): Promise<void> {
    await this.client().send(
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
      res = await this.client().send(
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

  // Avec ses dérivées.
  async delete(bucket: string, key: string): Promise<void> {
    // S3 DeleteObject est idempotent : pas d'erreur si la clé n'existe pas.
    await this.client().send(
      new DeleteObjectCommand({ Bucket: bucket, Key: key }),
    );
    await this.deleteDerivedOf(bucket, key);
  }

  private async deleteDerivedOf(bucket: string, key: string): Promise<void> {
    if (isDerivedKey(key)) return;
    for (const derived of derivedKeysOf(key)) {
      await this.client().send(
        new DeleteObjectCommand({ Bucket: bucket, Key: derived }),
      );
    }
  }

  // Proxy plutôt qu'URL S3 directe : le Custom Domain de R2 exige un DNS géré par Cloudflare, ce qui
  // n'est pas le cas. Chemin relatif au préfixe `/api`, que le front résout.
  getPublicUrl(bucket: string, key: string): string {
    return `/storage/${bucket}/${key}`;
  }
}
