import {
  NotFoundException,
  ServiceUnavailableException,
} from '../common/http-errors';
import { mockClient } from 'aws-sdk-client-mock';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  NoSuchKey,
} from '@aws-sdk/client-s3';
import { sdkStreamMixin } from '@smithy/util-stream';
import { Readable } from 'node:stream';
import { StorageService } from './storage.service';

describe('StorageService', () => {
  let service: StorageService;
  const s3Mock = mockClient(S3Client);
  const realClient = new S3Client({ region: 'us-east-1' });

  beforeEach(() => {
    s3Mock.reset();
    service = new StorageService(realClient);
  });

  describe('get', () => {
    const collectStream = (s: Readable): Promise<string> =>
      new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];
        s.on('data', (c: Buffer) => chunks.push(c));
        s.on('end', () => resolve(Buffer.concat(chunks).toString()));
        s.on('error', reject);
      });

    it('retourne { stream, contentType, contentLength } depuis la réponse S3', async () => {
      const stream = sdkStreamMixin(Readable.from(Buffer.from('content')));
      s3Mock.on(GetObjectCommand).resolves({
        Body: stream as never,
        ContentType: 'image/webp',
        ContentLength: 7,
      });
      const result = await service.get('my-bucket', 'foo.txt');
      expect(await collectStream(result.stream)).toBe('content');
      expect(result.contentType).toBe('image/webp');
      expect(result.contentLength).toBe(7);
    });

    it('contentType fallback à application/octet-stream si absent', async () => {
      const stream = sdkStreamMixin(Readable.from(Buffer.from('x')));
      s3Mock.on(GetObjectCommand).resolves({ Body: stream as never });
      const result = await service.get('my-bucket', 'foo.txt');
      expect(result.contentType).toBe('application/octet-stream');
      expect(result.contentLength).toBe(0);
    });

    it('throw NotFoundException si NoSuchKey', async () => {
      s3Mock
        .on(GetObjectCommand)
        .rejects(new NoSuchKey({ message: 'not found', $metadata: {} }));
      await expect(service.get('my-bucket', 'missing.txt')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('rethrow toute autre erreur', async () => {
      s3Mock.on(GetObjectCommand).rejects(new Error('network down'));
      await expect(service.get('my-bucket', 'foo.txt')).rejects.toThrow(
        'network down',
      );
    });
  });

  describe('delete', () => {
    it("efface l'objet et toutes ses dérivées (idempotent)", async () => {
      s3Mock.on(DeleteObjectCommand).resolves({});
      await service.delete('my-bucket', 'foo.txt');
      const keys = s3Mock
        .commandCalls(DeleteObjectCommand)
        .map((c) => c.args[0].input.Key);
      expect(keys).toEqual([
        'foo.txt',
        'foo.txt.share.jpg',
        'foo.txt.w480.avif',
        'foo.txt.w800.avif',
        'foo.txt.w1200.avif',
      ]);
    });
  });

  describe('dérivées (<key>.share.jpg, <key>.w<largeur>.avif)', () => {
    it("un nouvel upload de l'original jette les dérivées obsolètes", async () => {
      s3Mock.on(PutObjectCommand).resolves({});
      s3Mock.on(DeleteObjectCommand).resolves({});
      await service.upload('b', 'blog/1.avif', Buffer.from('x'), 'image/avif');
      const deleted = s3Mock
        .commandCalls(DeleteObjectCommand)
        .map((c) => c.args[0].input.Key);
      expect(deleted).toEqual([
        'blog/1.avif.share.jpg',
        'blog/1.avif.w480.avif',
        'blog/1.avif.w800.avif',
        'blog/1.avif.w1200.avif',
      ]);
    });

    it("l'upload de la carte elle-même ne cascade pas", async () => {
      s3Mock.on(PutObjectCommand).resolves({});
      await service.upload(
        'b',
        'blog/1.avif.share.jpg',
        Buffer.from('x'),
        'image/jpeg',
      );
      expect(s3Mock.commandCalls(DeleteObjectCommand)).toHaveLength(0);
    });

    it("l'upload d'une variante de largeur ne cascade pas", async () => {
      s3Mock.on(PutObjectCommand).resolves({});
      await service.upload(
        'b',
        'blog/1.avif.w800.avif',
        Buffer.from('x'),
        'image/avif',
      );
      expect(s3Mock.commandCalls(DeleteObjectCommand)).toHaveLength(0);
    });
  });

  describe('getPublicUrl', () => {
    it('retourne un chemin relatif /storage/{bucket}/{key} (proxy NestJS)', () => {
      expect(service.getPublicUrl('my-bucket', 'projects/foo.webp')).toBe(
        '/storage/my-bucket/projects/foo.webp',
      );
    });
  });

  describe('sans client S3 (stockage désactivé hors production)', () => {
    const disabled = new StorageService(null);

    it.each([
      [
        'upload',
        () => disabled.upload('b', 'k', Buffer.from('x'), 'image/avif'),
      ],
      ['get', () => disabled.get('b', 'k')],
      ['delete', () => disabled.delete('b', 'k')],
    ])('Given %s, Then it answers 503 without touching S3', async (_, act) => {
      await expect(act()).rejects.toBeInstanceOf(ServiceUnavailableException);
      await expect(act()).rejects.toMatchObject({
        status: 503,
        message: 'File storage is disabled on this environment',
      });
      expect(s3Mock.calls()).toHaveLength(0);
    });

    it('Given a public URL, Then it is still computed (the image is simply missing)', () => {
      expect(disabled.getPublicUrl('b', 'k')).toBe('/storage/b/k');
    });
  });
});
