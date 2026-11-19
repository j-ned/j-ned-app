import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import type { Mock } from 'vitest';
import { AuthStore } from '@core/auth/auth-store';
import { authInterceptor } from './auth-interceptor';

type Setup = {
  readonly client: HttpClient;
  readonly http: HttpTestingController;
  readonly logout: Mock<() => void>;
};

function setup(isLoggedIn: boolean): Setup {
  const logout = vi.fn<() => void>();
  TestBed.configureTestingModule({
    providers: [
      provideHttpClient(withInterceptors([authInterceptor])),
      provideHttpClientTesting(),
      { provide: AuthStore, useValue: { isLoggedIn: (): boolean => isLoggedIn, logout } },
    ],
  });
  return {
    client: TestBed.inject(HttpClient),
    http: TestBed.inject(HttpTestingController),
    logout,
  };
}

const UNAUTHORIZED = { status: 401, statusText: 'Unauthorized' };

describe('authInterceptor: session expirée', () => {
  afterEach(() => TestBed.inject(HttpTestingController).verify());

  it.each([['/api/contact/messages'], ['/api/auth/login-events?page=1&limit=25']])(
    'Given a signed-in admin When the read %s answers 401 Then the session is closed once',
    (url) => {
      const { client, http, logout } = setup(true);

      client.get(url).subscribe({ error: () => undefined });
      http.expectOne(url).flush(null, UNAUTHORIZED);

      expect(logout).toHaveBeenCalledTimes(1);
    },
  );

  it.each([['/api/auth/change-password'], ['/api/auth/2fa/enable'], ['/api/auth/2fa/disable']])(
    'Given a signed-in admin When %s refuses a wrong password or code with 401 Then the session stays open',
    (url) => {
      const { client, http, logout } = setup(true);

      client.post(url, {}).subscribe({ error: () => undefined });
      http.expectOne(url).flush(null, UNAUTHORIZED);

      expect(logout).not.toHaveBeenCalled();
    },
  );

  it('Given a visitor without session When a request answers 401 Then nothing is closed', () => {
    const { client, http, logout } = setup(false);

    client.get('/api/contact/messages').subscribe({ error: () => undefined });
    http.expectOne('/api/contact/messages').flush(null, UNAUTHORIZED);

    expect(logout).not.toHaveBeenCalled();
  });
});
