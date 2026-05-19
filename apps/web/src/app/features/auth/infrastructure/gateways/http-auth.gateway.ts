import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '@shared/api';
import { AuthGateway } from '@features/auth/domain';
import type { LoginResponse, TwoFactorSecretResponse, UserResponse } from '@features/auth/domain';

@Injectable()
export class HttpAuthGateway extends AuthGateway {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_BASE_URL);

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(
      `${this.apiUrl}/auth/login`,
      { email, password },
      { withCredentials: true },
    );
  }

  verifyTwoFactor(challengeToken: string, code: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(
      `${this.apiUrl}/auth/2fa/verify`,
      { challengeToken, code },
      { withCredentials: true },
    );
  }

  getCurrentUser(): Observable<UserResponse> {
    return this.http.get<UserResponse>(`${this.apiUrl}/auth/me`, { withCredentials: true });
  }

  logout(): Observable<unknown> {
    return this.http.post(`${this.apiUrl}/auth/logout`, {}, { withCredentials: true });
  }

  changePassword(currentPassword: string, newPassword: string): Observable<unknown> {
    return this.http.post(
      `${this.apiUrl}/auth/change-password`,
      { currentPassword, newPassword },
      { withCredentials: true },
    );
  }

  generateTwoFactorSecret(): Observable<TwoFactorSecretResponse> {
    return this.http.post<TwoFactorSecretResponse>(
      `${this.apiUrl}/auth/2fa/generate`,
      {},
      { withCredentials: true },
    );
  }

  enableTwoFactor(code: string): Observable<unknown> {
    return this.http.post(`${this.apiUrl}/auth/2fa/enable`, { code }, { withCredentials: true });
  }

  disableTwoFactor(password: string): Observable<unknown> {
    return this.http.post(
      `${this.apiUrl}/auth/2fa/disable`,
      { password },
      { withCredentials: true },
    );
  }
}
