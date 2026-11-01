import type { RequireAuth } from '../auth/require-auth';
import {
  ConflictException,
  UnauthorizedException,
} from '../common/http-errors';
import { testApp } from '../common/test-app';
import { PUBLIC_READ_THROTTLE } from '../common/throttle';
import type { ProfilePortraitService } from './profile-portrait.service';
import { PORTRAIT_UPLOAD, profileRoutes } from './profile.routes';
import type { ProfileService } from './profile.service';
import { aProfileContent } from './profile-test-builders';

const passThrough: RequireAuth = async (_c, next) => {
  await next();
};
const rejectAll: RequireAuth = () => {
  throw new UnauthorizedException();
};

// PNG 1×1 réel.
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64',
);
const PDF = Buffer.from(
  '%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF\n',
);
const SVG = Buffer.from(
  '<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"></svg>',
);

const form = (bytes: Buffer, filename: string, contentType: string) => {
  const data = new FormData();
  data.append(
    'file',
    new File([new Uint8Array(bytes)], filename, { type: contentType }),
  );
  return data;
};

/** Routes montées avec le gestionnaire d'erreurs de l'API ; services et JWT remplacés. */
describe('profile routes', () => {
  const profile = { findCurrent: jest.fn(), replace: jest.fn() };
  const portrait = { replace: jest.fn(), remove: jest.fn() };
  const appWith = (requireAuth: RequireAuth) =>
    testApp(
      '/api/profile',
      profileRoutes(
        profile as unknown as ProfileService,
        portrait as unknown as ProfilePortraitService,
        requireAuth,
      ),
    );
  let app: ReturnType<typeof appWith>;

  beforeEach(() => {
    jest.clearAllMocks();
    // Quotas en mémoire propres à chaque instance : une application neuve par test.
    app = appWith(passThrough);
  });

  describe('without a session', () => {
    it('Given no session, When the profile is read, Then it is public: 200', async () => {
      profile.findCurrent.mockResolvedValueOnce({ version: 1 });

      const res = await appWith(rejectAll).request('/api/profile');

      expect(res.status).toBe(200);
    });

    it.each([
      ['PUT', '/api/profile'],
      ['POST', '/api/profile/portrait'],
      ['DELETE', '/api/profile/portrait'],
    ])(
      'Given no session, When %s %s, Then 401 and no service is called',
      async (method, path) => {
        const res = await appWith(rejectAll).request(path, { method });

        expect(res.status).toBe(401);
        expect(profile.replace).not.toHaveBeenCalled();
        expect(portrait.replace).not.toHaveBeenCalled();
        expect(portrait.remove).not.toHaveBeenCalled();
      },
    );
  });

  describe('GET /api/profile', () => {
    it('allows the public read rate (prerender of the site), then 429', async () => {
      profile.findCurrent.mockResolvedValue({ version: 1 });
      const statuses: number[] = [];
      for (let i = 0; i <= PUBLIC_READ_THROTTLE.limit; i += 1)
        statuses.push((await app.request('/api/profile')).status);

      expect(statuses.slice(0, -1).every((s) => s === 200)).toBe(true);
      expect(statuses.at(-1)).toBe(429);
    });

    it('Given the document, When requested, Then 200 with the document', async () => {
      profile.findCurrent.mockResolvedValueOnce({
        version: 1,
        portrait: null,
      });

      const res = await app.request('/api/profile');

      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ version: 1, portrait: null });
    });
  });

  describe('PUT /api/profile', () => {
    const body = { ...aProfileContent(), version: 2 };
    const put = (sent: unknown) =>
      app.request('/api/profile', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(sent),
      });

    it('Given a valid document, When sent, Then the service replaces it and 200 returns its answer', async () => {
      profile.replace.mockResolvedValueOnce({ version: 3 });

      const res = await put(body);

      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ version: 3 });
      expect(profile.replace).toHaveBeenCalledWith(
        expect.objectContaining({ version: 2, workSummary: body.workSummary }),
      );
    });

    it('Given an unknown key, When sent, Then 400 and the service is not called', async () => {
      const res = await put({ ...body, updatedAt: '2026-10-11' });

      expect(res.status).toBe(400);
      expect(profile.replace).not.toHaveBeenCalled();
    });

    it('Given a stale version, When sent, Then 409', async () => {
      profile.replace.mockRejectedValueOnce(
        new ConflictException('version périmée'),
      );

      const res = await put(body);

      expect(res.status).toBe(409);
    });
  });

  describe('POST /api/profile/portrait', () => {
    const post = (data?: FormData) =>
      app.request('/api/profile/portrait', { method: 'POST', body: data });

    it('accepts up to 4 MB of WebP, JPEG, PNG or AVIF', () => {
      expect(PORTRAIT_UPLOAD.maxBytes).toBe(4 * 1024 * 1024);
      expect(PORTRAIT_UPLOAD.fileType.source).toBe(
        '^image\\/(webp|jpeg|png|avif)$',
      );
    });

    it.each([
      ['image/png', 'portrait.png'],
      ['image/jpeg', 'portrait.jpg'],
      ['image/webp', 'portrait.webp'],
      ['image/avif', 'portrait.avif'],
    ])(
      'Given a %s file, When sent, Then 200 with the document from the service',
      async (contentType, filename) => {
        portrait.replace.mockResolvedValueOnce({ portrait: '/storage/x.avif' });

        const res = await post(form(PNG, filename, contentType));

        expect(res.status).toBe(200);
        expect(await res.json()).toEqual({ portrait: '/storage/x.avif' });
        expect(portrait.replace).toHaveBeenCalledWith(
          expect.objectContaining({ mimetype: contentType }),
        );
      },
    );

    it.each([
      ['a PDF', PDF, 'application/pdf', 'cv.pdf'],
      ['an SVG', SVG, 'image/svg+xml', 'logo.svg'],
    ])(
      'Given %s, When sent, Then 422 and the service is not called',
      async (_label, bytes, contentType, filename) => {
        const res = await post(form(bytes, filename, contentType));

        expect(res.status).toBe(422);
        expect(portrait.replace).not.toHaveBeenCalled();
      },
    );

    it('Given no file, When sent, Then 422', async () => {
      const res = await post();

      expect(res.status).toBe(422);
      expect(portrait.replace).not.toHaveBeenCalled();
    });

    it('Given a file just over 4 MB, When sent, Then 413 and the service is not called', async () => {
      const big = Buffer.concat([
        PNG,
        Buffer.alloc(PORTRAIT_UPLOAD.maxBytes + 1024 - PNG.length),
      ]);

      const res = await post(form(big, 'portrait.png', 'image/png'));

      expect(res.status).toBe(413);
      expect(portrait.replace).not.toHaveBeenCalled();
    });
  });

  describe('DELETE /api/profile/portrait', () => {
    it('When sent, Then the service removes the portrait and 204', async () => {
      portrait.remove.mockResolvedValueOnce(undefined);

      const res = await app.request('/api/profile/portrait', {
        method: 'DELETE',
      });

      expect(res.status).toBe(204);
      expect(await res.text()).toBe('');
      expect(portrait.remove).toHaveBeenCalledTimes(1);
    });
  });
});
