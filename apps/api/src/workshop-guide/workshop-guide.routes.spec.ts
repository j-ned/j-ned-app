import type { RequireAuth } from '../auth/require-auth';
import { UnauthorizedException } from '../common/http-errors';
import { testApp } from '../common/test-app';
import { PUBLIC_READ_THROTTLE } from '../common/throttle';
import { workshopGuideRoutes } from './workshop-guide.routes';
import type { WorkshopGuideService } from './workshop-guide.service';
import {
  anAllMaterialsEntry,
  aWorkshopGuideContent,
  withoutDecoderToggle,
} from './workshop-guide-test-builders';

const passThrough: RequireAuth = async (_c, next) => {
  await next();
};
const rejectAll: RequireAuth = () => {
  throw new UnauthorizedException();
};

/** Routes montées avec le gestionnaire d'erreurs de l'API ; service et JWT remplacés. */
describe('workshop-guide routes', () => {
  const guide = { findCurrent: jest.fn(), replace: jest.fn() };
  const appWith = (requireAuth: RequireAuth) =>
    testApp(
      '/api/workshop-guide',
      workshopGuideRoutes(
        guide as unknown as WorkshopGuideService,
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
    it('Given no session, When the guide is read, Then it is public: 200', async () => {
      guide.findCurrent.mockResolvedValueOnce({ version: 0 });

      const res = await appWith(rejectAll).request('/api/workshop-guide');

      expect(res.status).toBe(200);
    });

    it('Given no session, When the guide is replaced, Then 401 and the service is not called', async () => {
      const res = await appWith(rejectAll).request('/api/workshop-guide', {
        method: 'PUT',
      });

      expect(res.status).toBe(401);
      expect(guide.replace).not.toHaveBeenCalled();
    });
  });

  describe('GET /api/workshop-guide', () => {
    it('allows the public read rate (pages rendered on request), then 429', async () => {
      guide.findCurrent.mockResolvedValue({ version: 0 });
      const statuses: number[] = [];
      for (let i = 0; i <= PUBLIC_READ_THROTTLE.limit; i += 1)
        statuses.push((await app.request('/api/workshop-guide')).status);

      expect(statuses.slice(0, -1).every((s) => s === 200)).toBe(true);
      expect(statuses.at(-1)).toBe(429);
    });

    it('Given the document, When requested, Then 200 with the document', async () => {
      guide.findCurrent.mockResolvedValueOnce({
        enabled: false,
        decoderEnabled: false,
        entries: [],
        version: 0,
        updatedAt: null,
      });

      const res = await app.request('/api/workshop-guide');

      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({
        enabled: false,
        decoderEnabled: false,
        entries: [],
        version: 0,
        updatedAt: null,
      });
    });
  });

  describe('PUT /api/workshop-guide', () => {
    const put = (sent: unknown) =>
      app.request('/api/workshop-guide', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(sent),
      });
    const body = { ...aWorkshopGuideContent(), version: 2 };

    it('Given a valid document, When sent, Then the service replaces it and 200 returns its answer', async () => {
      guide.replace.mockResolvedValueOnce({ version: 3 });

      const res = await put(body);

      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ version: 3 });
      expect(guide.replace).toHaveBeenCalledWith(
        expect.objectContaining({
          version: 2,
          enabled: true,
          decoderEnabled: true,
        }),
      );
    });

    it('Given a document without decoderEnabled (admin before spec 036), When sent, Then 200 and decoderEnabled stays undefined', async () => {
      guide.replace.mockResolvedValueOnce({ version: 3 });

      const res = await put({
        ...withoutDecoderToggle(body),
        version: body.version,
      });

      expect(res.status).toBe(200);
      const [[dto]] = guide.replace.mock.calls as [
        [{ decoderEnabled?: unknown }],
      ];
      expect(dto.decoderEnabled).toBeUndefined();
    });

    it.each([
      [
        'an all-materials boring entry without radius',
        {
          ...body,
          entries: [
            { ...anAllMaterialsEntry(), operation: 'boring', material: '' },
          ],
        },
      ],
      [
        'an entry with a null radius',
        { ...body, entries: [{ ...body.entries[0], noseRadius: null }] },
      ],
    ])(
      'Given %s (spec 037), When sent, Then 200 and the service is called',
      async (_l, sent) => {
        guide.replace.mockResolvedValueOnce({ version: 3 });

        const res = await put(sent);

        expect(res.status).toBe(200);
        expect(guide.replace).toHaveBeenCalled();
      },
    );

    it.each([
      [
        'an entry without material nor allMaterials',
        {
          ...body,
          entries: [{ ...body.entries[0], material: undefined }],
        },
      ],
      [
        'a radius at 0',
        { ...body, entries: [{ ...body.entries[0], noseRadius: 0 }] },
      ],
      ['an unknown key', { ...body, updatedAt: '2026-10-27' }],
      [
        'an operation outside the closed list',
        {
          ...body,
          entries: [{ ...body.entries[0], operation: 'milling' }],
        },
      ],
      ['enabled as a string', { ...body, enabled: 'false' }],
      ['decoderEnabled as a string', { ...body, decoderEnabled: 'false' }],
    ])(
      'Given %s, When sent, Then 400 and the service is not called',
      async (_l, sent) => {
        const res = await put(sent);

        expect(res.status).toBe(400);
        expect(guide.replace).not.toHaveBeenCalled();
      },
    );
  });
});
