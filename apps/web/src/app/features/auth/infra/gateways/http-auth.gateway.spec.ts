import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';
import { describe, it, expect, afterEach } from 'vitest';

import { API_BASE_URL } from '@shared/api/api-config';
import { HttpAuthGateway } from './http-auth.gateway';
import type { LoginResponse, TwoFactorSecretResponse, UserResponse } from '@features/auth/domain/models/auth.types';

const BASE = '/api';

function configure(): { gateway: HttpAuthGateway; httpController: HttpTestingController } {
  TestBed.configureTestingModule({
    providers: [
      HttpAuthGateway,
      provideHttpClient(),
      provideHttpClientTesting(),
      { provide: API_BASE_URL, useValue: BASE },
    ],
  });
  return {
    gateway: TestBed.inject(HttpAuthGateway),
    httpController: TestBed.inject(HttpTestingController),
  };
}

describe('HttpAuthGateway', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('login(email, password) émet POST /<base>/auth/login + withCredentials, retourne LoginResponse', async () => {
    const { gateway, httpController } = configure();
    const expected: LoginResponse = {
      user: { id: 'u1', email: 'a@b.c', isTwoFactorEnabled: false },
    };

    const promise = firstValueFrom(gateway.login('a@b.c', 'pass'));

    const req = httpController.expectOne(`${BASE}/auth/login`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ email: 'a@b.c', password: 'pass' });
    expect(req.request.withCredentials).toBe(true);
    req.flush(expected);

    const result = await promise;
    expect(result).toEqual(expected);
    httpController.verify();
  });

  it('verifyTwoFactor(challengeToken, code) émet POST /<base>/auth/2fa/verify + withCredentials', async () => {
    const { gateway, httpController } = configure();
    const expected: LoginResponse = {
      user: { id: 'u1', email: 'a@b.c', isTwoFactorEnabled: true },
    };

    const promise = firstValueFrom(gateway.verifyTwoFactor('token-abc', '123456'));

    const req = httpController.expectOne(`${BASE}/auth/2fa/verify`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ challengeToken: 'token-abc', code: '123456' });
    expect(req.request.withCredentials).toBe(true);
    req.flush(expected);

    const result = await promise;
    expect(result).toEqual(expected);
    httpController.verify();
  });

  it('getCurrentUser() émet GET /<base>/auth/me + withCredentials, retourne UserResponse', async () => {
    const { gateway, httpController } = configure();
    const expected: UserResponse = { id: 'u1', email: 'a@b.c', isTwoFactorEnabled: false };

    const promise = firstValueFrom(gateway.getCurrentUser());

    const req = httpController.expectOne(`${BASE}/auth/me`);
    expect(req.request.method).toBe('GET');
    expect(req.request.withCredentials).toBe(true);
    req.flush(expected);

    const result = await promise;
    expect(result).toEqual(expected);
    httpController.verify();
  });

  it('logout() émet POST /<base>/auth/logout + withCredentials', async () => {
    const { gateway, httpController } = configure();

    const promise = firstValueFrom(gateway.logout());

    const req = httpController.expectOne(`${BASE}/auth/logout`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({});
    expect(req.request.withCredentials).toBe(true);
    req.flush({ ok: true });

    await promise;
    httpController.verify();
  });

  it('changePassword(current, new) émet POST /<base>/auth/change-password + withCredentials', async () => {
    const { gateway, httpController } = configure();

    const promise = firstValueFrom(gateway.changePassword('old', 'new'));

    const req = httpController.expectOne(`${BASE}/auth/change-password`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ currentPassword: 'old', newPassword: 'new' });
    expect(req.request.withCredentials).toBe(true);
    req.flush({ ok: true });

    await promise;
    httpController.verify();
  });

  it('generateTwoFactorSecret() émet POST /<base>/auth/2fa/generate + withCredentials', async () => {
    const { gateway, httpController } = configure();
    const expected: TwoFactorSecretResponse = {
      secret: 'JBSWY3DPEHPK3PXP',
      qrCodeDataUrl: 'data:image/png;base64,abc',
    };

    const promise = firstValueFrom(gateway.generateTwoFactorSecret());

    const req = httpController.expectOne(`${BASE}/auth/2fa/generate`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({});
    expect(req.request.withCredentials).toBe(true);
    req.flush(expected);

    const result = await promise;
    expect(result).toEqual(expected);
    httpController.verify();
  });

  it('enableTwoFactor(code) émet POST /<base>/auth/2fa/enable + withCredentials', async () => {
    const { gateway, httpController } = configure();

    const promise = firstValueFrom(gateway.enableTwoFactor('123456'));

    const req = httpController.expectOne(`${BASE}/auth/2fa/enable`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ code: '123456' });
    expect(req.request.withCredentials).toBe(true);
    req.flush({ ok: true });

    await promise;
    httpController.verify();
  });

  it('disableTwoFactor(password) émet POST /<base>/auth/2fa/disable + withCredentials', async () => {
    const { gateway, httpController } = configure();

    const promise = firstValueFrom(gateway.disableTwoFactor('pass'));

    const req = httpController.expectOne(`${BASE}/auth/2fa/disable`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ password: 'pass' });
    expect(req.request.withCredentials).toBe(true);
    req.flush({ ok: true });

    await promise;
    httpController.verify();
  });
});
