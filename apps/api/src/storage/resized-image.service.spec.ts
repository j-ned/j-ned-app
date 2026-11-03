import { NotFoundException } from '../common/http-errors';
import { Readable } from 'node:stream';
import { ImageOptimizer } from './image-optimizer.service';
import { ResizedImageService } from './resized-image.service';
import type { S3ObjectStream, StorageService } from './storage.service';

function s3Object(content: string): S3ObjectStream {
  return {
    stream: Readable.from(Buffer.from(content)),
    contentType: 'image/avif',
    contentLength: content.length,
  };
}

describe('ResizedImageService', () => {
  const resized = Buffer.from('avif-800');
  let storage: jest.Mocked<Pick<StorageService, 'get' | 'upload'>>;
  let images: jest.Mocked<Pick<ImageOptimizer, 'toWidth'>>;
  let service: ResizedImageService;

  beforeEach(() => {
    storage = {
      get: jest.fn(),
      upload: jest.fn().mockResolvedValue(undefined),
    };
    images = { toWidth: jest.fn().mockResolvedValue(resized) };
    service = new ResizedImageService(
      storage as unknown as StorageService,
      images as unknown as ImageOptimizer,
    );
  });

  it('sert la variante déjà dérivée sans rien régénérer', async () => {
    storage.get.mockResolvedValueOnce(s3Object('cached-800'));

    const out = await service.get('b', 'projects/1.avif', 800);

    expect(storage.get).toHaveBeenCalledTimes(1);
    expect(storage.get).toHaveBeenCalledWith('b', 'projects/1.avif.w800.avif');
    expect(out.buffer.toString()).toBe('cached-800');
    expect(out.contentType).toBe('image/avif');
    expect(images.toWidth).not.toHaveBeenCalled();
    expect(storage.upload).not.toHaveBeenCalled();
  });

  it("dérive la variante de l'original à la première demande et la conserve dans S3", async () => {
    storage.get
      .mockRejectedValueOnce(new NotFoundException())
      .mockResolvedValueOnce(s3Object('original-avif'));

    const out = await service.get('b', 'projects/1.avif', 800);

    expect(storage.get).toHaveBeenNthCalledWith(2, 'b', 'projects/1.avif');
    expect(images.toWidth).toHaveBeenCalledWith(
      Buffer.from('original-avif'),
      800,
    );
    expect(storage.upload).toHaveBeenCalledWith(
      'b',
      'projects/1.avif.w800.avif',
      resized,
      'image/avif',
    );
    expect(out.buffer).toBe(resized);
  });

  it("propage le 404 quand l'original n'existe pas non plus", async () => {
    storage.get.mockRejectedValue(new NotFoundException());

    await expect(
      service.get('b', 'projects/missing.avif', 800),
    ).rejects.toThrow(NotFoundException);
    expect(storage.upload).not.toHaveBeenCalled();
  });

  it('ne masque pas une erreur S3 autre que 404 sur la dérivée', async () => {
    storage.get.mockRejectedValueOnce(new Error('network down'));

    await expect(service.get('b', 'projects/1.avif', 800)).rejects.toThrow(
      'network down',
    );
    expect(images.toWidth).not.toHaveBeenCalled();
  });
});
