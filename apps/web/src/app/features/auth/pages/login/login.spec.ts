import { byTestId, testIdText } from '@shared/testing/by-test-id';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, type Observable } from 'rxjs';
import { Login } from './login';
import { AuthStore } from '@core/auth/auth-store';
import { ToastStore } from '@core/notifications/toast-store';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
  type TestRequest,
} from '@angular/common/http/testing';
import type { Mock } from 'vitest';
import type { ToastMessage } from '@shared/ui/toast.types';
import { API_BASE_URL } from '@shared/api/api-config';
import { errorToastInterceptor } from '@core/interceptors/error-toast';
import { AuthGateway } from '@features/auth/domain/gateways/auth.gateway';
import { HttpAuthGateway } from '@features/auth/infra/gateways/http-auth.gateway';
import { settle, settleBounded } from '@shared/testing/settle';

describe('Login a11y', () => {
  let fixture: ComponentFixture<Login>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Login],
      providers: [
        provideRouter([]),
        { provide: AuthStore, useValue: { login: (): Observable<string> => of('success') } },
        { provide: ToastStore, useValue: { add: (): void => undefined } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Login);
    fixture.detectChanges();
  });

  it('email input has type=email, autocomplete=email, aria-required=true', () => {
    const email = fixture.nativeElement.querySelector('input#email') as HTMLInputElement;
    expect(email.type).toBe('email');
    expect(email.autocomplete).toBe('email');
    expect(email.getAttribute('aria-required')).toBe('true');
  });

  it('password input has autocomplete=current-password, aria-required=true', () => {
    const password = fixture.nativeElement.querySelector('input#password') as HTMLInputElement;
    expect(password.autocomplete).toBe('current-password');
    expect(password.getAttribute('aria-required')).toBe('true');
  });

  it('email shows aria-invalid + aria-describedby when touched and invalid', () => {
    fixture.componentInstance.form.email().markAsTouched();
    fixture.componentInstance.form.email().value.set('');
    fixture.detectChanges();

    const email = fixture.nativeElement.querySelector('input#email') as HTMLInputElement;
    expect(email.getAttribute('aria-invalid')).toBe('true');
    expect(email.getAttribute('aria-describedby')).toBe('login-email-error');

    const errorMsg = fixture.nativeElement.querySelector('#login-email-error');
    expect(errorMsg).not.toBeNull();
    expect(errorMsg!.getAttribute('role')).toBe('alert');
  });

  it('password shows aria-invalid + aria-describedby when touched and invalid', () => {
    fixture.componentInstance.form.password().markAsTouched();
    fixture.componentInstance.form.password().value.set('');
    fixture.detectChanges();

    const password = fixture.nativeElement.querySelector('input#password') as HTMLInputElement;
    expect(password.getAttribute('aria-invalid')).toBe('true');
    expect(password.getAttribute('aria-describedby')).toBe('login-password-error');

    const errorMsg = fixture.nativeElement.querySelector('#login-password-error');
    expect(errorMsg).not.toBeNull();
    expect(errorMsg!.getAttribute('role')).toBe('alert');
  });

  it('Given a refused attempt When the error renders Then it is announced as an alert', () => {
    fixture.componentInstance.errorMessage.set('Code invalide');
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;

    expect({
      role: byTestId(host, 'status-message')?.getAttribute('role'),
      text: testIdText(host, 'status-message'),
    }).toEqual({ role: 'alert', text: 'Code invalide' });
  });
});

describe('Login: annonce d’un échec de connexion', () => {
  const LOGIN_URL = '/api/auth/login';

  async function attemptLogin(): Promise<{
    fixture: ComponentFixture<Login>;
    toast: Mock<(message: ToastMessage) => void>;
    request: TestRequest;
  }> {
    const toast = vi.fn<(message: ToastMessage) => void>();
    TestBed.configureTestingModule({
      imports: [Login],
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([errorToastInterceptor])),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: '/api' },
        { provide: AuthGateway, useClass: HttpAuthGateway },
        { provide: ToastStore, useValue: { add: toast } },
      ],
    });
    const fixture = TestBed.createComponent(Login);
    await settle(fixture);
    const host = fixture.nativeElement as HTMLElement;
    for (const [selector, value] of [
      ['input#email', 'admin@exemple.fr'],
      ['input#password', 'secret-password'],
    ] as const) {
      const input = host.querySelector<HTMLInputElement>(selector);
      if (input === null) throw new Error(`${selector} absent`);
      input.value = value;
      input.dispatchEvent(new Event('input'));
    }
    byTestId(host, 'login-form')?.dispatchEvent(new Event('submit', { cancelable: true }));
    await settleBounded(fixture);
    const request = TestBed.inject(HttpTestingController).expectOne(LOGIN_URL);
    return { fixture, toast, request };
  }

  afterEach(() => TestBed.inject(HttpTestingController).verify());

  it.each([
    { status: 401, statusText: 'Unauthorized', message: 'Email ou mot de passe incorrect' },
    { status: 400, statusText: 'Bad Request', message: 'Email ou mot de passe incorrect' },
    {
      status: 403,
      statusText: 'Forbidden',
      message: 'Connexion impossible pour le moment, réessaie dans un instant',
    },
    {
      status: 429,
      statusText: 'Too Many Requests',
      message: 'Trop de tentatives en peu de temps, réessaie dans une minute',
    },
    {
      status: 500,
      statusText: 'Server Error',
      message: 'Connexion impossible pour le moment, réessaie dans un instant',
    },
    {
      status: 0,
      statusText: 'Network error',
      message: 'Connexion impossible pour le moment, réessaie dans un instant',
    },
  ])(
    'Given the API answers $status When the user signs in Then the failure is announced once, next to the form',
    async ({ status, statusText, message }) => {
      const { fixture, toast, request } = await attemptLogin();

      request.flush({}, { status, statusText });
      await settle(fixture);

      const host = fixture.nativeElement as HTMLElement;
      expect({
        toasts: toast.mock.calls.length,
        role: byTestId(host, 'status-message')?.getAttribute('role'),
        text: testIdText(host, 'status-message'),
      }).toEqual({ toasts: 0, role: 'alert', text: message });
    },
  );
});
