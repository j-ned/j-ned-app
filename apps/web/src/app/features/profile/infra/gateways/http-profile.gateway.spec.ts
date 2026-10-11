import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
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
});
