import type { RequireAuth } from '../auth/require-auth';
import type { UploadedFile } from '../common/http';
import { ConflictException, NotFoundException } from '../common/http-errors';
import { testApp } from '../common/test-app';
import type { ProjectImagesService } from './project-images.service';
import { projectsRoutes } from './projects.routes';
import type { ProjectsService } from './projects.service';

const ID = '11111111-1111-4111-8111-111111111111';
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64',
);
const VALID = { title: 'T', category: 'Web', description: 'D' };

const passThrough: RequireAuth = async (_c, next) => {
  await next();
};

const fileForm = (bytes: Buffer, type: string) => {
  const data = new FormData();
  data.append('file', new Blob([new Uint8Array(bytes)], { type }), 'a.png');
  return data;
};

describe('projects routes (HTTP)', () => {
  const projects = {
    findAll: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    uploadImage: jest.fn(),
  };
  const build = (requireAuth: RequireAuth) =>
    testApp(
      '/api/projects',
      projectsRoutes(
        projects as unknown as ProjectsService,
        {} as ProjectImagesService,
        requireAuth,
      ),
    );
  let app = build(passThrough);

  beforeEach(() => {
    jest.clearAllMocks();
    app = build(passThrough);
  });

  const json = (method: string, path: string, body: unknown) =>
    app.request(path, {
      method,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });

  describe('GET /projects', () => {
    it('When listed, Then the projects are returned', async () => {
      projects.findAll.mockResolvedValueOnce([{ id: ID }]);

      const res = await app.request('/api/projects');

      expect(res.status).toBe(200);
      expect(await res.json()).toEqual([{ id: ID }]);
    });
  });

  describe('GET /projects/:id', () => {
    it('Given an unknown project, When read, Then the service 404 is returned', async () => {
      projects.findById.mockRejectedValueOnce(new NotFoundException());
      expect((await app.request(`/api/projects/${ID}`)).status).toBe(404);
    });
  });

  describe('POST /projects', () => {
    it('Given an invalid body, When created, Then 400 without calling the service', async () => {
      const res = await json('POST', '/api/projects', { ...VALID, foo: 1 });
      expect(res.status).toBe(400);
      expect(projects.create).not.toHaveBeenCalled();
    });

    it('Given a slug already taken, When created, Then the service 409 is returned', async () => {
      projects.create.mockRejectedValueOnce(new ConflictException());
      expect((await json('POST', '/api/projects', VALID)).status).toBe(409);
    });
  });

  describe('POST /projects/:id/image', () => {
    const upload = (body: FormData, id = ID) =>
      app.request(`/api/projects/${id}/image`, { method: 'POST', body });

    it('Given a PNG, When uploaded, Then 201 with the project and the service gets the file', async () => {
      projects.uploadImage.mockResolvedValueOnce({ id: ID, image: 'url' });
      const res = await upload(fileForm(PNG, 'image/png'));
      expect(res.status).toBe(201);
      expect(await res.json()).toEqual({ id: ID, image: 'url' });
      const [id, file] = projects.uploadImage.mock.calls[0] as [
        string,
        UploadedFile,
      ];
      expect(id).toBe(ID);
      expect(file.buffer).toEqual(PNG);
    });

    it('Given a non-image file, When uploaded, Then 422', async () => {
      const res = await upload(
        fileForm(Buffer.from('%PDF'), 'application/pdf'),
      );
      expect(res.status).toBe(422);
      expect(projects.uploadImage).not.toHaveBeenCalled();
    });

    it('Given a file over 4 MB, When uploaded, Then 413', async () => {
      const res = await upload(
        fileForm(Buffer.alloc(4 * 1024 * 1024 + 1), 'image/png'),
      );
      expect(res.status).toBe(413);
      expect(projects.uploadImage).not.toHaveBeenCalled();
    });

    it('Given a non-UUID id, When uploaded, Then 400', async () => {
      const res = await upload(fileForm(PNG, 'image/png'), 'nope');
      expect(res.status).toBe(400);
      expect(projects.uploadImage).not.toHaveBeenCalled();
    });
  });
});
