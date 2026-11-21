import { byTestId, testIdText } from '@shared/testing/by-test-id';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { firstValueFrom, of, type Observable } from 'rxjs';
import { TwoFactorVerify } from './two-factor-verify';
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

describe('TwoFactorVerify a11y', () => {
  let fixture: ComponentFixture<TwoFactorVerify>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TwoFactorVerify],
      providers: [
        provideRouter([]),
        {
          provide: AuthStore,
          useValue: {
            pendingChallengeToken: signal('challenge-token-test'),
            verifyTwoFactor: (): Observable<string> => of('success'),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TwoFactorVerify);
    fixture.detectChanges();
  });

  it('code input has autocomplete=one-time-code, inputmode=numeric, aria-required=true', () => {
    const code = fixture.nativeElement.querySelector('input#code') as HTMLInputElement;
    expect(code.autocomplete).toBe('one-time-code');
    expect(code.inputMode).toBe('numeric');
    expect(code.getAttribute('aria-required')).toBe('true');
  });

  it('code shows aria-invalid + aria-describedby when touched and invalid', () => {
    fixture.componentInstance.form.code().markAsTouched();
    fixture.componentInstance.form.code().value.set('');
    fixture.detectChanges();

    const code = fixture.nativeElement.querySelector('input#code') as HTMLInputElement;
    expect(code.getAttribute('aria-invalid')).toBe('true');
    expect(code.getAttribute('aria-describedby')).toBe('twofa-code-error');

    const errorMsg = fixture.nativeElement.querySelector('#twofa-code-error');
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

describe('TwoFactorVerify: annonce d’un code refusé', () => {
  const VERIFY_URL = '/api/auth/2fa/verify';

  async function submitCode(): Promise<{
    fixture: ComponentFixture<TwoFactorVerify>;
    toast: Mock<(message: ToastMessage) => void>;
    request: TestRequest;
  }> {
    const toast = vi.fn<(message: ToastMessage) => void>();
    TestBed.configureTestingModule({
      imports: [TwoFactorVerify],
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([errorToastInterceptor])),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: '/api' },
        { provide: AuthGateway, useClass: HttpAuthGateway },
        { provide: ToastStore, useValue: { add: toast } },
      ],
    });
    const http = TestBed.inject(HttpTestingController);
    const challenge = firstValueFrom(
      TestBed.inject(AuthStore).login('admin@exemple.fr', 'secret-password'),
    );
    http
      .expectOne('/api/auth/login')
      .flush({ requiresTwoFactor: true, challengeToken: 'challenge-token' });
    await challenge;

    const fixture = TestBed.createComponent(TwoFactorVerify);
    await settle(fixture);
    const host = fixture.nativeElement as HTMLElement;
    const input = host.querySelector<HTMLInputElement>('input#code');
    if (input === null) throw new Error('input#code absent');
    input.value = '123456';
    input.dispatchEvent(new Event('input'));
    byTestId(host, 'two-factor-form')?.dispatchEvent(new Event('submit', { cancelable: true }));
    await settleBounded(fixture);
    const request = http.expectOne(VERIFY_URL);
    return { fixture, toast, request };
  }

  afterEach(() => TestBed.inject(HttpTestingController).verify());

  it.each([
    {
      status: 401,
      statusText: 'Unauthorized',
      message: 'Code invalide ou expiré, réessaie ou reconnecte-toi',
    },
    {
      status: 400,
      statusText: 'Bad Request',
      message: 'Vérification impossible pour le moment, réessaie dans un instant',
    },
    {
      status: 429,
      statusText: 'Too Many Requests',
      message: 'Trop de tentatives, réessaie dans quelques minutes',
    },
    {
      status: 500,
      statusText: 'Server Error',
      message: 'Vérification impossible pour le moment, réessaie dans un instant',
    },
    {
      status: 0,
      statusText: 'Network error',
      message: 'Vérification impossible pour le moment, réessaie dans un instant',
    },
  ])(
    'Given the API answers $status When the user submits a code Then the failure is announced once, next to the form',
    async ({ status, statusText, message }) => {
      const { fixture, toast, request } = await submitCode();

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
