import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse, provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { firstValueFrom, type Observable } from 'rxjs';
import { describe, it, expect, afterEach, vi } from 'vitest';

import { API_BASE_URL } from '@shared/api/api-config';
import { errorToastInterceptor } from '@core/interceptors/error-toast';
import { ToastStore } from '@shared/ui/toast-store';
import { HttpCvGateway } from './http-cv.gateway';
import type { CvInfo } from '../../domain/models/cv.model';

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

describe('HttpCvGateway: écritures de l’admin derrière l’intercepteur de toasts', () => {
  const add = vi.fn();

  function configureWithToasts(): {
    gateway: HttpCvGateway;
    httpController: HttpTestingController;
  } {
    add.mockClear();
    TestBed.configureTestingModule({
      providers: [
        HttpCvGateway,
        provideHttpClient(withInterceptors([errorToastInterceptor])),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: BASE },
        { provide: ToastStore, useValue: { add } },
      ],
    });
    return {
      gateway: TestBed.inject(HttpCvGateway),
      httpController: TestBed.inject(HttpTestingController),
    };
  }

  async function failingStatus(
    request: Observable<unknown>,
    httpController: HttpTestingController,
    url: string,
  ): Promise<number | null> {
    const outcome = firstValueFrom(request).then(
      () => null,
      (error: unknown) => (error instanceof HttpErrorResponse ? error.status : -1),
    );
    httpController.expectOne(url).flush(null, { status: 500, statusText: 'Server Error' });
    return outcome;
  }

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it.each<{ write: string; url: string; call: (gateway: HttpCvGateway) => Observable<unknown> }>([
    {
      write: 'upload',
      url: `${BASE}/cv/upload`,
      call: (g): Observable<unknown> =>
        g.upload(new File(['%PDF'], 'cv.pdf', { type: 'application/pdf' })),
    },
    { write: 'delete', url: `${BASE}/cv`, call: (g): Observable<unknown> => g.delete() },
  ])(
    'Given the API answers 500 When $write is called Then no toast is shown and the caller still receives the error',
    async ({ url, call }) => {
      const { gateway, httpController } = configureWithToasts();

      const status = await failingStatus(call(gateway), httpController, url);

      expect({ status, toasts: add.mock.calls.length }).toEqual({ status: 500, toasts: 0 });
      httpController.verify();
    },
  );

  it('Given the public page reads the current CV When the API answers 500 Then the interceptor still shows its toast', async () => {
    const { gateway, httpController } = configureWithToasts();

    const status = await failingStatus(gateway.getCurrent(), httpController, `${BASE}/cv`);

    expect({ status, toasts: add.mock.calls.length }).toEqual({ status: 500, toasts: 1 });
    httpController.verify();
  });
});
