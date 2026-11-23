import { createHash } from 'node:crypto';
import {
  NotFoundException,
  UnprocessableEntityException,
} from '../common/http-errors';
import { SQL } from 'drizzle-orm';
import { PgDialect } from 'drizzle-orm/pg-core';
import type { UploadedFile } from '../common/http';
import { asDatabase } from '../testing/mock-database';
import { createMockDb } from '../testing/test-utils';
import type { ProjectImage } from '../database/schema/project-images';
import type { StorageService } from '../storage/storage.service';
import type { ImageOptimizer } from '../storage/image-optimizer.service';
import { ProjectImagesService } from './project-images.service';
import { PROJECT_GALLERY_MAX } from './project-gallery';
import { projects, type Project } from '../database/schema/projects';
import { defined } from '../testing/defined';

const PROJECT_ID = '11111111-1111-1111-1111-111111111111';

const mkImage = (overrides: Partial<ProjectImage> = {}): ProjectImage => ({
  id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  projectId: PROJECT_ID,
  key: 'project-images/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa-12345678.avif',
  alt: 'Tableau de bord',
  width: 1600,
  height: 1000,
  order: 0,
  createdAt: new Date('2026-10-06T10:00:00Z'),
  updatedAt: new Date('2026-10-06T10:00:00Z'),
  ...overrides,
});

describe('ProjectImagesService', () => {
  let service: ProjectImagesService;
  let db: ReturnType<typeof createMockDb>;
  let storage: jest.Mocked<
    Pick<StorageService, 'upload' | 'delete' | 'getPublicUrl'>
  >;
  let optimizer: jest.Mocked<Pick<ImageOptimizer, 'optimize'>>;

  beforeEach(() => {
    db = createMockDb();
    storage = {
      upload: jest.fn().mockResolvedValue(undefined),
      delete: jest.fn().mockResolvedValue(undefined),
      getPublicUrl: jest.fn(
        (bucket: string, key: string) => `/storage/${bucket}/${key}`,
      ),
    };
    optimizer = {
      optimize: jest.fn().mockResolvedValue({
        buffer: Buffer.from('avif-bytes'),
        mimetype: 'image/avif',
        ext: 'avif',
        width: 1280,
        height: 800,
      }),
    };

    service = new ProjectImagesService(asDatabase(db), storage, optimizer);
  });

  describe('galleryOf', () => {
    it('Given no project id, When reading galleries, Then no query is sent', async () => {
      const gallery = await service.galleryOf([]);
      expect(gallery.size).toBe(0);
      expect(db.select).not.toHaveBeenCalled();
    });

    it('Given project ids, When reading galleries, Then rows are grouped with public urls', async () => {
      db.where.mockResolvedValueOnce([
        mkImage({ id: 'b', order: 1, key: 'project-images/b-2.avif' }),
        mkImage({ id: 'a', order: 0, key: 'project-images/a-1.avif' }),
      ]);
      const gallery = await service.galleryOf([PROJECT_ID]);
      expect(gallery.get(PROJECT_ID)?.map((i) => [i.id, i.url])).toEqual([
        ['a', '/storage/portfolio-storage/project-images/a-1.avif'],
        ['b', '/storage/portfolio-storage/project-images/b-2.avif'],
      ]);
    });
  });

  describe('upload', () => {
    const HASH = createHash('sha256')
      .update('avif-bytes')
      .digest('hex')
      .slice(0, 8);
    const file = {
      buffer: Buffer.from('png-bytes'),
      mimetype: 'image/png',
    } as UploadedFile;
    const project = { id: PROJECT_ID } as Project;

    // findByIdOrFail se termine sur limit(), la lecture de la galerie sur where().
    const givenProject = (images: ProjectImage[]) => {
      db.limit.mockResolvedValueOnce([project]);
      db.where.mockReturnValueOnce(db).mockResolvedValueOnce(images);
    };

    it('Given an unknown project, When uploading, Then 404 and nothing reaches S3', async () => {
      db.limit.mockResolvedValueOnce([]);
      await expect(service.upload(PROJECT_ID, file, 'Alt')).rejects.toThrow(
        NotFoundException,
      );
      expect(optimizer.optimize).not.toHaveBeenCalled();
      expect(storage.upload).not.toHaveBeenCalled();
    });

    it(`Given a gallery of ${PROJECT_GALLERY_MAX} captures, When uploading, Then 422 and nothing reaches S3`, async () => {
      givenProject(
        Array.from({ length: PROJECT_GALLERY_MAX }, (_, order) =>
          mkImage({ order }),
        ),
      );
      await expect(service.upload(PROJECT_ID, file, 'Alt')).rejects.toThrow(
        UnprocessableEntityException,
      );
      expect(optimizer.optimize).not.toHaveBeenCalled();
      expect(storage.upload).not.toHaveBeenCalled();
      expect(db.insert).not.toHaveBeenCalled();
    });

    it('Given an unreadable image, When uploading, Then the optimizer 422 propagates and nothing is stored', async () => {
      givenProject([]);
      optimizer.optimize.mockRejectedValueOnce(
        new UnprocessableEntityException('Image illisible'),
      );
      await expect(service.upload(PROJECT_ID, file, 'Alt')).rejects.toThrow(
        UnprocessableEntityException,
      );
      expect(storage.upload).not.toHaveBeenCalled();
      expect(db.insert).not.toHaveBeenCalled();
    });

    it('Given a valid image, When uploading, Then the AVIF goes to a hashed key, the row is appended last and the new project version is returned', async () => {
      givenProject([mkImage({ order: 0 }), mkImage({ order: 3 })]);
      db.returning.mockResolvedValueOnce([{ version: 2 }]);
      db.returning.mockImplementationOnce(() => {
        const [values] = db.values.mock.calls[0] as [ProjectImage];
        return Promise.resolve([
          mkImage({ ...values, createdAt: new Date(), updatedAt: new Date() }),
        ]);
      });

      const result = await service.upload(PROJECT_ID, file, 'Tableau de bord');

      expect(optimizer.optimize).toHaveBeenCalledWith(file.buffer);
      const [bucket, key, body, mime] = defined(storage.upload.mock.calls[0]);
      expect(bucket).toBe('portfolio-storage');
      expect(key).toMatch(
        new RegExp(
          `^project-images/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}-${HASH}\\.avif$`,
        ),
      );
      expect(body).toEqual(Buffer.from('avif-bytes'));
      expect(mime).toBe('image/avif');

      const [inserted] = db.values.mock.calls[0] as [ProjectImage];
      expect(inserted).toEqual({
        id: key.slice('project-images/'.length, 'project-images/'.length + 36),
        projectId: PROJECT_ID,
        key,
        alt: 'Tableau de bord',
        width: 1280,
        height: 800,
        order: 4,
      });

      expect(result).toEqual({
        result: {
          id: inserted.id,
          url: `/storage/portfolio-storage/${key}`,
          alt: 'Tableau de bord',
          width: 1280,
          height: 800,
          order: 4,
        },
        projectVersion: 2,
      });
      expect(db.update.mock.invocationCallOrder[0]).toBeLessThan(
        db.insert.mock.invocationCallOrder[0] ?? 0,
      );
    });

    it('Given the database insert fails, When uploading, Then the error propagates (S3 object left orphan, never a row without object)', async () => {
      givenProject([]);
      db.returning.mockResolvedValueOnce([{ version: 2 }]);
      db.returning.mockRejectedValueOnce(new Error('DB down'));
      await expect(service.upload(PROJECT_ID, file, 'Alt')).rejects.toThrow(
        'DB down',
      );
      expect(storage.upload).toHaveBeenCalled();
    });
  });

  describe('updateAlt', () => {
    const IMAGE_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

    it('Given a capture of the project, When its alt changes, Then the project is locked first, the alt saved and returned with the project version', async () => {
      db.returning.mockResolvedValueOnce([{ version: 5 }]);
      db.returning.mockResolvedValueOnce([mkImage({ alt: 'Nouvel alt' })]);
      const result = await service.updateAlt(
        PROJECT_ID,
        IMAGE_ID,
        'Nouvel alt',
      );
      expect(db.set).toHaveBeenCalledWith(
        expect.objectContaining({ alt: 'Nouvel alt' }),
      );
      expect(result.result).toEqual(
        expect.objectContaining({ id: IMAGE_ID, alt: 'Nouvel alt' }),
      );
      expect(result.result).not.toHaveProperty('key');
      expect(result.projectVersion).toBe(5);
      expect(db.update).toHaveBeenNthCalledWith(1, projects);
    });

    it('Given an unknown project, When an alt changes, Then 404 and no capture is touched', async () => {
      db.returning.mockResolvedValueOnce([]);
      await expect(
        service.updateAlt(PROJECT_ID, IMAGE_ID, 'Alt'),
      ).rejects.toThrow(
        new NotFoundException(`Project ${PROJECT_ID} not found`),
      );
      expect(db.update).toHaveBeenCalledTimes(1);
    });

    it('Given an image id that is not in this project, When its alt changes, Then 404', async () => {
      db.returning.mockResolvedValueOnce([{ version: 5 }]);
      db.returning.mockResolvedValueOnce([]);
      await expect(
        service.updateAlt(PROJECT_ID, IMAGE_ID, 'Alt'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    const IMAGE_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

    it('Given a capture of the project, When removed, Then the row goes first, then its S3 object', async () => {
      const row = mkImage({ key: 'project-images/a-1.avif' });
      const calls: string[] = [];
      db.returning.mockImplementationOnce(() => {
        calls.push('project');
        return Promise.resolve([{ version: 3 }]);
      });
      db.returning.mockImplementationOnce(() => {
        calls.push('db');
        return Promise.resolve([row]);
      });
      storage.delete.mockImplementationOnce(() => {
        calls.push('s3');
        return Promise.resolve();
      });
      const removed = await service.remove(PROJECT_ID, IMAGE_ID);
      expect(storage.delete).toHaveBeenCalledWith(
        'portfolio-storage',
        'project-images/a-1.avif',
      );
      expect(calls).toEqual(['project', 'db', 's3']);
      expect(removed).toEqual({ result: null, projectVersion: 3 });
    });

    it('Given an image id that is not in this project, When removed, Then 404 and S3 untouched', async () => {
      db.returning.mockResolvedValueOnce([{ version: 3 }]);
      db.returning.mockResolvedValueOnce([]);
      await expect(service.remove(PROJECT_ID, IMAGE_ID)).rejects.toThrow(
        NotFoundException,
      );
      expect(storage.delete).not.toHaveBeenCalled();
    });

    it('Given the database delete fails, When removed, Then S3 is untouched', async () => {
      db.returning.mockResolvedValueOnce([{ version: 3 }]);
      db.returning.mockRejectedValueOnce(new Error('DB down'));
      await expect(service.remove(PROJECT_ID, IMAGE_ID)).rejects.toThrow(
        'DB down',
      );
      expect(storage.delete).not.toHaveBeenCalled();
    });
  });

  describe('reorder', () => {
    const A = 'aaaaaaaa-aaaa-4aaa-8aaa-000000000001';
    const B = 'aaaaaaaa-aaaa-4aaa-8aaa-000000000002';
    const C = 'aaaaaaaa-aaaa-4aaa-8aaa-000000000003';
    // Version du projet d'abord (`returning`), puis la lecture de la galerie (`where`).
    const givenGallery = (images: ProjectImage[]) => {
      db.returning.mockResolvedValueOnce([{ version: 6 }]);
      db.where.mockReturnValueOnce(db).mockResolvedValueOnce(images);
    };

    it('Given the exact list in a new order, When reordering, Then each order is rewritten in a transaction and the sorted gallery is returned', async () => {
      givenGallery([
        mkImage({ id: A, order: 0, key: 'project-images/a.avif' }),
        mkImage({ id: B, order: 1, key: 'project-images/b.avif' }),
        mkImage({ id: C, order: 2, key: 'project-images/c.avif' }),
      ]);

      const result = await service.reorder(PROJECT_ID, [C, A, B]);

      expect(db.transaction).toHaveBeenCalledTimes(1);
      // Chaque update porte un `where` (imageId, projectId) et un `set` ({ order }) : on apparie
      // les deux pour vérifier quel id reçoit quel rang, pas seulement la suite des rangs.
      // Le premier `UPDATE` passe la version du projet (testé à part), les trois suivants les captures.
      const updatedWheres = db.where.mock.calls.slice(2, 5) as [SQL][];
      const patches = db.set.mock.calls.slice(1, 4) as [{ order: number }][];
      const ranks = updatedWheres.map(([where], i) => {
        const [imageId, projectId] = new PgDialect().sqlToQuery(where).params;
        const [{ order }] = defined(patches[i]);
        return [imageId, projectId, order];
      });
      expect(ranks).toEqual([
        [C, PROJECT_ID, 0],
        [A, PROJECT_ID, 1],
        [B, PROJECT_ID, 2],
      ]);
      expect(db.update).toHaveBeenNthCalledWith(1, projects);
      expect(db.set).toHaveBeenNthCalledWith(1, {
        version: expect.any(SQL) as unknown,
      });
      expect(result.projectVersion).toBe(6);
      expect(result.result.map((i) => [i.id, i.order])).toEqual([
        [C, 0],
        [A, 1],
        [B, 2],
      ]);
      expect(defined(result.result[0]).url).toBe(
        '/storage/portfolio-storage/project-images/c.avif',
      );
    });

    it.each([
      ['one missing', [A, B]],
      ['one foreign', [A, B, 'ffffffff-ffff-4fff-8fff-ffffffffffff']],
      ['one extra', [A, B, C, 'ffffffff-ffff-4fff-8fff-ffffffffffff']],
    ])(
      'Given a list with %s, When reordering, Then 422 and no capture is written (the transaction rolls the version back)',
      async (_, ids) => {
        givenGallery([
          mkImage({ id: A, order: 0 }),
          mkImage({ id: B, order: 1 }),
          mkImage({ id: C, order: 2 }),
        ]);
        await expect(service.reorder(PROJECT_ID, ids)).rejects.toThrow(
          UnprocessableEntityException,
        );
        expect(db.update.mock.calls).toEqual([[projects]]);
      },
    );

    it('Given an unknown project, When reordering, Then 404 and no capture is written', async () => {
      db.returning.mockResolvedValueOnce([]);
      await expect(service.reorder(PROJECT_ID, [])).rejects.toThrow(
        NotFoundException,
      );
      expect(db.update.mock.calls).toEqual([[projects]]);
    });
  });
});
