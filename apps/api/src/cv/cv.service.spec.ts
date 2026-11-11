/* eslint-disable @typescript-eslint/unbound-method */
import { NotFoundException } from '../common/http-errors';
import { CvService } from './cv.service';
import { createMockDb } from '../database/test-utils';
import { StorageService } from '../storage/storage.service';
import type { CvFile } from '../database/schema';

describe('CvService', () => {
  let service: CvService;
  let db: ReturnType<typeof createMockDb>;
  let storage: jest.Mocked<StorageService>;

  const mkCvFile = (overrides: Partial<CvFile> = {}): CvFile => ({
    id: '11111111-1111-1111-1111-111111111111',
    fileName: 'Julien-CV.pdf',
    fileKey: 'cv/cv.pdf',
    fileSize: 524288,
    mimeType: 'application/pdf',
    uploadedAt: new Date('2026-04-26T00:00:00Z'),
    updatedAt: new Date('2026-04-26T00:00:00Z'),
    ...overrides,
  });

  beforeEach(() => {
    db = createMockDb();
    storage = {
      upload: jest.fn().mockResolvedValue(undefined),
      get: jest.fn().mockResolvedValue(Buffer.from('pdf-bytes')),
      delete: jest.fn().mockResolvedValue(undefined),
      list: jest.fn(),
      getPublicUrl: jest.fn(),
    } as unknown as jest.Mocked<StorageService>;

    service = new CvService(db as never, storage);
  });

  describe('upsert', () => {
    it('stocke le CV en application/pdf, quel que soit le type déclaré par le client', async () => {
      db.returning.mockResolvedValueOnce([mkCvFile()]);
      const buffer = Buffer.from('%PDF-1.7');

      await service.upsert({
        buffer,
        originalname: 'cv.pdf',
        mimetype: 'text/html',
        size: buffer.length,
      });

      expect(storage.upload).toHaveBeenCalledWith(
        'portfolio-storage',
        'cv/cv.pdf',
        buffer,
        'application/pdf',
      );
      expect(db.values).toHaveBeenCalledWith(
        expect.objectContaining({ mimeType: 'application/pdf' }),
      );
    });
  });

  describe('download', () => {
    it('retourne { stream, metadata } si CV existe', async () => {
      const metadata = mkCvFile();
      db.limit.mockResolvedValueOnce([metadata]);
      const { Readable } = await import('node:stream');
      const stream = Readable.from(Buffer.from('pdf-bytes'));
      storage.get.mockResolvedValueOnce({
        stream,
        contentType: 'application/pdf',
        contentLength: 9,
      });

      const result = await service.download();

      expect(result.metadata).toEqual(metadata);
      expect(result.stream).toBe(stream);
      expect(storage.get).toHaveBeenCalledWith(
        'portfolio-storage',
        'cv/cv.pdf',
      );
    });

    it('throw NotFoundException si pas de CV', async () => {
      db.limit.mockResolvedValueOnce([]);
      await expect(service.download()).rejects.toThrow(NotFoundException);
      expect(storage.get).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('supprime DB row puis S3 file dans cet ordre', async () => {
      const metadata = mkCvFile();
      db.limit.mockResolvedValueOnce([metadata]);
      // db.delete().where() résout via le builder default
      const callOrder: string[] = [];
      db.where.mockImplementationOnce(() => {
        callOrder.push('db-delete');
        return Promise.resolve(undefined) as never;
      });
      storage.delete.mockImplementationOnce(() => {
        callOrder.push('s3-delete');
        return Promise.resolve();
      });

      await service.remove();

      expect(callOrder).toEqual(['db-delete', 's3-delete']);
      expect(storage.delete).toHaveBeenCalledWith(
        'portfolio-storage',
        'cv/cv.pdf',
      );
    });

    it('throw NotFoundException si pas de CV', async () => {
      db.limit.mockResolvedValueOnce([]);
      await expect(service.remove()).rejects.toThrow(NotFoundException);
      expect(storage.delete).not.toHaveBeenCalled();
    });

    it("si S3.delete échoue après DB.delete → propage l'erreur", async () => {
      const metadata = mkCvFile();
      db.limit.mockResolvedValueOnce([metadata]);
      // db delete OK
      db.where.mockResolvedValueOnce(undefined);
      // S3 delete échoue
      storage.delete.mockRejectedValueOnce(new Error('S3 unreachable'));

      await expect(service.remove()).rejects.toThrow('S3 unreachable');
    });
  });
});
