import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { SKIP_ERROR_TOAST } from '@core/interceptors/skip-error-toast';
import { API_BASE_URL } from '@shared/api/api-config';
import { makeLoginEvent } from '../../testing/login-event-builders';
import { LoginJournalGateway } from './login-journal.gateway';

describe('LoginJournalGateway', () => {
  let gateway: LoginJournalGateway;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: '/api' },
      ],
    });
    gateway = TestBed.inject(LoginJournalGateway);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('Given page 2 of 25 When requested Then the API is asked for that page and its events come back with the total', async () => {
    const events = [makeLoginEvent({ id: 'event-26' })];
    const page = firstValueFrom(gateway.getPage(2, 25));

    const req = http.expectOne('/api/auth/login-events?page=2&limit=25');
    expect(req.request.method).toBe('GET');
    req.flush({ data: events, total: 26, page: 2, limit: 25 });

    await expect(page).resolves.toEqual({ events, total: 26 });
  });

  it('Given the API sends a step the front does not know yet When requested Then the event comes back as an unknown step', async () => {
    const page = firstValueFrom(gateway.getPage(1, 25));

    http
      .expectOne('/api/auth/login-events?page=1&limit=25')
      .flush({ data: [{ ...makeLoginEvent(), kind: 'passkey_accepted' }], total: 1 });

    await expect(page).resolves.toEqual({
      events: [makeLoginEvent({ kind: 'unknown' })],
      total: 1,
    });
  });

  it('Given the admin page shows its own error state When requested Then the failure raises no toast', () => {
    gateway.getPage(1, 25).subscribe();

    const req = http.expectOne('/api/auth/login-events?page=1&limit=25');
    expect(req.request.context.get(SKIP_ERROR_TOAST)).toBe(true);
    req.flush({ data: [], total: 0, page: 1, limit: 25 });
  });
});
