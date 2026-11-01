import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import type { Observable } from 'rxjs';
import { SKIP_ERROR_TOAST } from '@core/interceptors/skip-error-toast';
import { API_BASE_URL } from '@shared/api/api-config';
import type { ProfileDocument } from '../../domain/models/profile-content.model';
import { aProfileContent, aProfileDocument } from '../../testing/profile-builders';
import type { ProfileDto } from '../profile.types';
import { HttpProfileGateway } from './http-profile.gateway';

const BASE = 'https://api.test/api';
const PORTRAIT_PATH = '/storage/portfolio-storage/profile/portrait-1a2b3c4d.avif';

describe('HttpProfileGateway', () => {
  let gateway: HttpProfileGateway;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        HttpProfileGateway,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: BASE },
      ],
    });
    gateway = TestBed.inject(HttpProfileGateway);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('Given the public profile When getProfile is read Then one GET on /profile is answered by the adapted document, portrait served by the site origin', () => {
    const received: ProfileDocument[] = [];
    gateway.getProfile().subscribe((document) => received.push(document));
    const body: ProfileDto = {
      ...aProfileContent(),
      version: 2,
      updatedAt: '2026-10-11T09:30:00.000Z',
      portrait: PORTRAIT_PATH,
    };

    const request = http.expectOne(`${BASE}/profile`);
    request.flush(body);

    expect(request.request.method).toBe('GET');
    expect(received).toEqual([
      aProfileDocument({
        version: 2,
        updatedAt: '2026-10-11T09:30:00.000Z',
        content: aProfileContent(),
        portraitUrl: `/api${PORTRAIT_PATH}`,
      }),
    ]);
  });

  it('Given the API failing When getProfile is read Then the error reaches the page, without any fallback content', () => {
    const received: ProfileDocument[] = [];
    const errors: unknown[] = [];
    gateway.getProfile().subscribe({
      next: (document) => received.push(document),
      error: (error: unknown) => errors.push(error),
    });

    http
      .expectOne(`${BASE}/profile`)
      .flush(null, { status: 503, statusText: 'Service Unavailable' });

    expect(received).toEqual([]);
    expect(errors.map((error) => (error as HttpErrorResponse).status)).toEqual([503]);
  });

  it('Given an edited content and the version read When saveProfile is called Then one silent PUT on /profile carries the content and the version, and the answer is the adapted document', () => {
    const content = aProfileContent({ workSummary: 'Résumé réécrit.' });
    const received: ProfileDocument[] = [];
    gateway.saveProfile(content, 4).subscribe((document) => received.push(document));
    const body: ProfileDto = {
      ...content,
      version: 5,
      updatedAt: '2026-10-11T10:00:00.000Z',
      portrait: null,
    };

    const request = http.expectOne(`${BASE}/profile`);
    request.flush(body);

    expect({
      method: request.request.method,
      body: request.request.body,
      silent: request.request.context.get(SKIP_ERROR_TOAST),
      received,
    }).toEqual({
      method: 'PUT',
      body: { ...aProfileContent({ workSummary: 'Résumé réécrit.' }), version: 4 },
      silent: true,
      received: [
        aProfileDocument({
          version: 5,
          updatedAt: '2026-10-11T10:00:00.000Z',
          content: aProfileContent({ workSummary: 'Résumé réécrit.' }),
          portraitUrl: null,
        }),
      ],
    });
  });

  it.each([400, 401, 409])(
    'Given the API answering %i When saveProfile is called Then the error reaches the page untouched',
    (status) => {
      const errors: unknown[] = [];
      gateway.saveProfile(aProfileContent(), 1).subscribe({
        error: (error: unknown) => errors.push(error),
      });

      http.expectOne(`${BASE}/profile`).flush(null, { status, statusText: 'Refused' });

      expect(errors.map((error) => (error as HttpErrorResponse).status)).toEqual([status]);
    },
  );

  it('Given an image When uploadPortrait is called Then one silent multipart POST on /profile/portrait carries it as « file », and the answer is the adapted document', () => {
    const file = new File(['png'], 'portrait.png', { type: 'image/png' });
    const received: ProfileDocument[] = [];
    gateway.uploadPortrait(file).subscribe((document) => received.push(document));
    const body: ProfileDto = {
      ...aProfileContent(),
      version: 3,
      updatedAt: '2026-10-11T11:00:00.000Z',
      portrait: PORTRAIT_PATH,
    };

    const request = http.expectOne(`${BASE}/profile/portrait`);
    request.flush(body);
    const sent = request.request.body;

    expect({
      method: request.request.method,
      multipart: sent instanceof FormData,
      file: sent instanceof FormData ? sent.get('file') : null,
      silent: request.request.context.get(SKIP_ERROR_TOAST),
      received,
    }).toEqual({
      method: 'POST',
      multipart: true,
      file,
      silent: true,
      received: [
        aProfileDocument({
          version: 3,
          updatedAt: '2026-10-11T11:00:00.000Z',
          content: aProfileContent(),
          portraitUrl: `/api${PORTRAIT_PATH}`,
        }),
      ],
    });
  });

  it('Given a portrait When removePortrait is called Then one silent DELETE on /profile/portrait completes on its 204', () => {
    const events: string[] = [];
    gateway.removePortrait().subscribe({
      next: () => events.push('next'),
      complete: () => events.push('complete'),
    });

    const request = http.expectOne(`${BASE}/profile/portrait`);
    request.flush(null, { status: 204, statusText: 'No Content' });

    expect({
      method: request.request.method,
      silent: request.request.context.get(SKIP_ERROR_TOAST),
      events,
    }).toEqual({ method: 'DELETE', silent: true, events: ['next', 'complete'] });
  });

  it.each([
    { call: 'uploadPortrait', status: 422 },
    { call: 'uploadPortrait', status: 503 },
    { call: 'removePortrait', status: 503 },
  ] as const)(
    'Given the API answering $status When $call is called Then the error reaches the page untouched',
    ({ call, status }) => {
      const errors: unknown[] = [];
      const request$: Observable<unknown> =
        call === 'uploadPortrait'
          ? gateway.uploadPortrait(new File(['x'], 'p.png', { type: 'image/png' }))
          : gateway.removePortrait();
      request$.subscribe({ error: (error: unknown) => errors.push(error) });

      http.expectOne(`${BASE}/profile/portrait`).flush(null, { status, statusText: 'Refused' });

      expect(errors.map((error) => (error as HttpErrorResponse).status)).toEqual([status]);
    },
  );
});
