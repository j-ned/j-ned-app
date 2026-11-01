import type { RequireAuth } from '../auth/require-auth';
import type { UploadedFile } from '../common/http';
import {
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '../common/http-errors';
import { testApp } from '../common/test-app';
import { DEFAULT_THROTTLE, PUBLIC_READ_THROTTLE } from '../common/throttle';
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
const unauthorized: RequireAuth = () => {
  throw new UnauthorizedException();
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
    it('Given filters, When listed, Then the service gets the category and featured=true as a boolean', async () => {
      projects.findAll.mockResolvedValueOnce([{ id: ID }]);
      const res = await app.request('/api/projects?category=web&featured=true');
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual([{ id: ID }]);
      expect(projects.findAll).toHaveBeenCalledWith({
        category: 'web',
        featured: true,
      });
    });

    it('Given no filter, When listed, Then featured is false and category undefined', async () => {
      projects.findAll.mockResolvedValueOnce([]);
      await app.request('/api/projects?featured=1');
      expect(projects.findAll).toHaveBeenCalledWith({
        category: undefined,
        featured: false,
      });
    });

    it(`Given a visitor, When it lists ${PUBLIC_READ_THROTTLE.limit + 1} times within a minute, Then the last one gets 429 (PublicReadThrottle)`, async () => {
      projects.findAll.mockResolvedValue([]);
      const statuses: number[] = [];
      for (let i = 0; i <= PUBLIC_READ_THROTTLE.limit; i += 1) {
        const res = await app.request('/api/projects', {
          headers: { 'x-forwarded-for': '203.0.113.1' },
        });
        statuses.push(res.status);
      }
      expect(statuses.slice(0, -1).every((s) => s === 200)).toBe(true);
      expect(statuses.at(-1)).toBe(429);
    });
  });

  describe('GET /projects/:id', () => {
    it('Given an id, When read, Then 200 with the project', async () => {
      projects.findById.mockResolvedValueOnce({ id: ID });
      const res = await app.request(`/api/projects/${ID}`);
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ id: ID });
      expect(projects.findById).toHaveBeenCalledWith(ID);
    });

    it('Given a non-UUID id, When read, Then 400', async () => {
      expect((await app.request('/api/projects/nope')).status).toBe(400);
      expect(projects.findById).not.toHaveBeenCalled();
    });

    it('Given an unknown project, When read, Then the service 404 is returned', async () => {
      projects.findById.mockRejectedValueOnce(new NotFoundException());
      expect((await app.request(`/api/projects/${ID}`)).status).toBe(404);
    });
  });

  describe('session', () => {
    it.each([
      ['POST', '/api/projects'],
      ['PATCH', `/api/projects/${ID}`],
      ['DELETE', `/api/projects/${ID}`],
      ['POST', `/api/projects/${ID}/image`],
    ])(
      'Given no session, When %s %s, Then 401 without calling the service',
      async (method, path) => {
        const res = await build(unauthorized).request(path, { method });
        expect(res.status).toBe(401);
        for (const fn of Object.values(projects)) {
          expect(fn).not.toHaveBeenCalled();
        }
      },
    );

    it('Given no session, When listing, Then the public read is served', async () => {
      projects.findAll.mockResolvedValueOnce([]);
      const res = await build(unauthorized).request('/api/projects');
      expect(res.status).toBe(200);
    });
  });

  describe('POST /projects', () => {
    it('Given a valid project, When created, Then 201 with the project', async () => {
      projects.create.mockResolvedValueOnce({ id: ID, ...VALID });
      const res = await json('POST', '/api/projects', VALID);
      expect(res.status).toBe(201);
      expect(await res.json()).toEqual({ id: ID, ...VALID });
      expect(projects.create).toHaveBeenCalledWith(
        expect.objectContaining(VALID),
      );
    });

    it('Given an invalid body, When created, Then 400 without calling the service', async () => {
      const res = await json('POST', '/api/projects', { ...VALID, foo: 1 });
      expect(res.status).toBe(400);
      expect(projects.create).not.toHaveBeenCalled();
    });

    it('Given a slug already taken, When created, Then the service 409 is returned', async () => {
      projects.create.mockRejectedValueOnce(new ConflictException());
      expect((await json('POST', '/api/projects', VALID)).status).toBe(409);
    });

    it(`Given an admin, When it creates ${DEFAULT_THROTTLE.limit + 1} times within a minute, Then the last one gets 429 (default quota)`, async () => {
      projects.create.mockResolvedValue({ id: ID });
      const statuses: number[] = [];
      for (let i = 0; i <= DEFAULT_THROTTLE.limit; i += 1) {
        const res = await app.request('/api/projects', {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'x-forwarded-for': '203.0.113.2',
          },
          body: JSON.stringify(VALID),
        });
        statuses.push(res.status);
      }
      expect(statuses.slice(0, -1).every((s) => s === 201)).toBe(true);
      expect(statuses.at(-1)).toBe(429);
    });
  });

  describe('PATCH /projects/:id', () => {
    it('Given a partial update, When patched, Then 200 and the service gets id + dto', async () => {
      projects.update.mockResolvedValueOnce({ id: ID, featured: true });
      const res = await json('PATCH', `/api/projects/${ID}`, {
        featured: true,
      });
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ id: ID, featured: true });
      expect(projects.update).toHaveBeenCalledWith(
        ID,
        expect.objectContaining({ featured: true }),
      );
    });

    it('Given a non-UUID id, When patched, Then 400', async () => {
      const res = await json('PATCH', '/api/projects/nope', { featured: true });
      expect(res.status).toBe(400);
      expect(projects.update).not.toHaveBeenCalled();
    });
  });

  describe('DELETE /projects/:id', () => {
    it('Given a project, When deleted, Then 204 without body', async () => {
      projects.remove.mockResolvedValueOnce(undefined);
      const res = await app.request(`/api/projects/${ID}`, {
        method: 'DELETE',
      });
      expect(res.status).toBe(204);
      expect(await res.text()).toBe('');
      expect(projects.remove).toHaveBeenCalledWith(ID);
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

    it('Given a file over 5 MB, When uploaded, Then 413', async () => {
      const res = await upload(
        fileForm(Buffer.alloc(5 * 1024 * 1024 + 1), 'image/png'),
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
