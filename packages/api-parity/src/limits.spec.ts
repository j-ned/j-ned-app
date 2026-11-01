import { beforeAll, describe, it } from 'vitest';
import { expectApiError } from './api-error';
import { newVisitor } from './client';
import { adminSession } from './session';

const MB = 1024 * 1024;

function multipart(bytes: number, type: string, filename: string): FormData {
  const form = new FormData();
  form.append('file', new Blob([new Uint8Array(bytes)], { type }), filename);
  return form;
}

// 4 Mo partout : une fonction Vercel refuse les corps de plus de 4,5 Mo (ADR-0036).
describe('upload size limits', () => {
  let session = '';

  beforeAll(async () => {
    session = await adminSession();
  });

  it.each<[string, string, number, string, string]>([
    ['the CV', '/api/cv/upload', 4, 'application/pdf', 'cv.pdf'],
    ['a blog body image', '/api/blog/content-images', 4, 'image/png', 'image.png'],
    ['the portrait', '/api/profile/portrait', 4, 'image/png', 'portrait.png'],
  ])(
    'Given a file just over the limit of %s, When it is uploaded, Then the API answers 413 before storing anything',
    async (_, path, limitMb, type, filename) => {
      const response = await newVisitor().request('POST', path, {
        session,
        body: multipart(limitMb * MB + 1024, type, filename),
      });

      expectApiError(response, 413, path);
    },
  );
});
