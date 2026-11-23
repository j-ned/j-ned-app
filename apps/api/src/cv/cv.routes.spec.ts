import { Readable } from 'node:stream';
import type { RequireAuth } from '../auth/require-auth';
import type { UploadedFile } from '../common/http';
import { NotFoundException } from '../common/http-errors';
import { testApp } from '../testing/test-app';
import { cvRoutes } from './cv.routes';
import { fileForm } from '../testing/multipart';
import { denyAll, passThrough } from '../testing/require-auth';

const PDF = Buffer.from('%PDF-1.4\n%âãÏÓ\n1 0 obj\n<<>>\nendobj\n%%EOF\n');
const METADATA = {
  id: '11111111-1111-1111-1111-111111111111',
  fileName: 'Julien-CV.pdf',
  fileKey: 'cv/cv.pdf',
  fileSize: PDF.length,
  mimeType: 'application/pdf',
};

describe('cv routes (HTTP)', () => {
  const cv = {
    upsert: jest.fn(),
    findLatestMetadata: jest.fn(),
    download: jest.fn(),
    remove: jest.fn(),
  };
  const build = (auth: RequireAuth) => testApp('/api/cv', cvRoutes(cv, auth));
  let app = build(passThrough);

  beforeEach(() => {
    jest.clearAllMocks();
    app = build(passThrough);
  });

  let ip = 0;
  const call = (path: string, init: RequestInit = {}, target = app) =>
    target.request(`/api/cv${path}`, {
      ...init,
      headers: { 'x-forwarded-for': `198.51.100.${(ip = (ip % 250) + 1)}` },
    });

  describe('POST /upload', () => {
    it('Given a PDF, When uploaded, Then 201 with the stored metadata', async () => {
      cv.upsert.mockResolvedValueOnce(METADATA);
      const res = await call('/upload', {
        method: 'POST',
        body: fileForm(PDF, 'Julien-CV.pdf', 'application/pdf'),
      });
      expect(res.status).toBe(201);
      expect(await res.json()).toEqual(METADATA);
      const [file] = cv.upsert.mock.calls[0] as [UploadedFile];
      expect(file).toEqual(
        expect.objectContaining({
          originalname: 'Julien-CV.pdf',
          mimetype: 'application/pdf',
          size: PDF.length,
        }),
      );
      expect(file.buffer).toEqual(PDF);
    });

    it('Given a non-PDF or no file, When uploaded, Then 422 without calling the service', async () => {
      const png = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        'base64',
      );
      expect(
        (
          await call('/upload', {
            method: 'POST',
            body: fileForm(png, 'cv.pdf', 'application/pdf'),
          })
        ).status,
      ).toBe(422);
      expect((await call('/upload', { method: 'POST' })).status).toBe(422);
      expect(cv.upsert).not.toHaveBeenCalled();
    });

    it('Given a file over 4 MB, When uploaded, Then 413', async () => {
      const res = await call('/upload', {
        method: 'POST',
        body: fileForm(
          Buffer.alloc(4 * 1024 * 1024 + 1),
          'big.pdf',
          'application/pdf',
        ),
      });
      expect(res.status).toBe(413);
      expect(cv.upsert).not.toHaveBeenCalled();
    });
  });

  describe('GET /', () => {
    it('answers 200 with an empty body when there is no CV', async () => {
      cv.findLatestMetadata.mockResolvedValueOnce(null);
      const res = await call('');
      expect(res.status).toBe(200);
      expect(await res.text()).toBe('');
    });
  });

  describe('GET /download', () => {
    it('streams the PDF as an attachment under its original name', async () => {
      cv.download.mockResolvedValueOnce({
        stream: Readable.from(PDF),
        metadata: METADATA,
      });
      const res = await call('/download', {}, build(denyAll));
      expect(res.status).toBe(200);
      expect(res.headers.get('content-type')).toBe('application/pdf');
      expect(res.headers.get('content-disposition')).toBe(
        'attachment; filename="Julien-CV.pdf"',
      );
      expect(res.headers.get('content-length')).toBe(String(PDF.length));
      expect(Buffer.from(await res.arrayBuffer())).toEqual(PDF);
    });

    it.each([
      [
        'CV – Julien Nédellec.pdf',
        `attachment; filename="CV _ Julien Nedellec.pdf"; filename*=UTF-8''CV%20%E2%80%93%20Julien%20N%C3%A9dellec.pdf`,
      ],
      [
        'cv "final".pdf',
        `attachment; filename="cv _final_.pdf"; filename*=UTF-8''cv%20%22final%22.pdf`,
      ],
    ])(
      'does not answer 500 when the original name is %s',
      async (fileName, expected) => {
        cv.download.mockResolvedValueOnce({
          stream: Readable.from(PDF),
          metadata: { ...METADATA, fileName },
        });
        const res = await call('/download');
        expect(res.status).toBe(200);
        expect(res.headers.get('content-disposition')).toBe(expected);
      },
    );

    it('answers 404 when there is no CV', async () => {
      cv.download.mockRejectedValueOnce(
        new NotFoundException('No CV uploaded'),
      );
      const res = await call('/download');
      expect(res.status).toBe(404);
    });
  });
});
