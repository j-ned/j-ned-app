import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';
import { describe, it, expect, afterEach } from 'vitest';

import { API_BASE_URL } from '@shared/api';
import { HttpCvGateway } from './http-cv.gateway';
import type { CvInfo } from '../../domain';

const BASE = '/api';

function configure(): { gateway: HttpCvGateway; httpController: HttpTestingController } {
  TestBed.configureTestingModule({
    providers: [
      HttpCvGateway,
      provideHttpClient(),
      provideHttpClientTesting(),
      { provide: API_BASE_URL, useValue: BASE },
    ],
  });
  return {
    gateway: TestBed.inject(HttpCvGateway),
    httpController: TestBed.inject(HttpTestingController),
  };
}

describe('HttpCvGateway', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
  });

  describe('upload', () => {
    it('upload(file) émet POST /<base>/cv/upload avec FormData{file} + withCredentials, retourne CvInfo', async () => {
      const { gateway, httpController } = configure();
      const file = new File(['pdf-content'], 'cv.pdf', { type: 'application/pdf' });
      const expected: CvInfo = {
        id: 'uuid-1',
        fileName: 'cv.pdf',
        fileSize: 11,
        mimeType: 'application/pdf',
        uploadedAt: '2026-05-03T10:00:00Z',
      };

      const promise = firstValueFrom(gateway.upload(file));

      const req = httpController.expectOne(`${BASE}/cv/upload`);
      expect(req.request.method).toBe('POST');
      expect(req.request.withCredentials).toBe(true);
      expect(req.request.body).toBeInstanceOf(FormData);
      const formData = req.request.body as FormData;
      expect(formData.get('file')).toEqual(file);
      req.flush(expected);

      const result = await promise;
      expect(result).toEqual(expected);
      httpController.verify();
    });
  });

  describe('getCurrent', () => {
    it('getCurrent() émet GET /<base>/cv + withCredentials, retourne CvInfo', async () => {
      const { gateway, httpController } = configure();
      const expected: CvInfo = {
        id: 'uuid-1',
        fileName: 'cv.pdf',
        fileSize: 12345,
        mimeType: 'application/pdf',
        uploadedAt: '2026-05-03T10:00:00Z',
      };

      const promise = firstValueFrom(gateway.getCurrent());

      const req = httpController.expectOne(`${BASE}/cv`);
      expect(req.request.method).toBe('GET');
      expect(req.request.withCredentials).toBe(true);
      req.flush(expected);

      const result = await promise;
      expect(result).toEqual(expected);
      httpController.verify();
    });

    it('getCurrent() retourne null si aucun CV uploadé', async () => {
      const { gateway, httpController } = configure();

      const promise = firstValueFrom(gateway.getCurrent());

      const req = httpController.expectOne(`${BASE}/cv`);
      req.flush(null);

      const result = await promise;
      expect(result).toBeNull();
      httpController.verify();
    });
  });

  describe('delete', () => {
    it('delete() émet DELETE /<base>/cv + withCredentials', async () => {
      const { gateway, httpController } = configure();

      const promise = firstValueFrom(gateway.delete());

      const req = httpController.expectOne(`${BASE}/cv`);
      expect(req.request.method).toBe('DELETE');
      expect(req.request.withCredentials).toBe(true);
      req.flush(null, { status: 204, statusText: 'No Content' });

      await promise;
      httpController.verify();
    });
  });

  describe('getDownloadUrl', () => {
    it('getDownloadUrl() retourne `${baseUrl}/cv/download` (sync, no HTTP request)', () => {
      const { gateway, httpController } = configure();

      const url = gateway.getDownloadUrl();

      expect(url).toBe(`${BASE}/cv/download`);
      httpController.verify();
    });
  });
});
