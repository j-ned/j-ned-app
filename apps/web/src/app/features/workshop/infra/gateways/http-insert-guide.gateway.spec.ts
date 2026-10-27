import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_BASE_URL } from '@shared/api/api-config';
import type { InsertGuide } from '../../domain/models/insert-guide.model';
import type { InsertGuideDto } from '../insert-guide.types';
import { HttpInsertGuideGateway } from './http-insert-guide.gateway';

const BASE = 'https://api.test/api';

describe('HttpInsertGuideGateway', () => {
  let gateway: HttpInsertGuideGateway;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: BASE },
      ],
    });
    gateway = TestBed.inject(HttpInsertGuideGateway);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('Given the public guide When getGuide is read Then one GET on /workshop-guide is answered by the adapted guide', () => {
    const received: InsertGuide[] = [];
    gateway.getGuide().subscribe((guide) => received.push(guide));
    const body: InsertGuideDto = {
      enabled: true,
      entries: [
        {
          material: 'Matière fictive',
          operation: 'threading',
          insert: 'CODE-FICTIF-01',
          noseRadius: 0.2,
        },
      ],
      version: 1,
      updatedAt: '2026-10-26T10:00:00.000Z',
    };

    const request = http.expectOne(`${BASE}/workshop-guide`);
    request.flush(body);

    expect([request.request.method, received]).toEqual([
      'GET',
      [
        {
          enabled: true,
          entries: [
            {
              material: 'Matière fictive',
              operation: 'threading',
              insert: 'CODE-FICTIF-01',
              noseRadius: 0.2,
            },
          ],
        },
      ],
    ]);
  });

  it('Given the API failing When getGuide is read Then the error reaches the page, without any fallback guide', () => {
    const received: InsertGuide[] = [];
    const errors: unknown[] = [];
    gateway.getGuide().subscribe({
      next: (guide) => received.push(guide),
      error: (error: unknown) => errors.push(error),
    });

    http
      .expectOne(`${BASE}/workshop-guide`)
      .flush(null, { status: 503, statusText: 'Service Unavailable' });

    expect([received, errors.map((error) => (error as HttpErrorResponse).status)]).toEqual([
      [],
      [503],
    ]);
  });
});
