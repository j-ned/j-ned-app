import { InjectionToken } from '@angular/core';
import type { Observable } from 'rxjs';
import type { LoginResponse, TwoFactorSecretResponse, UserResponse } from '../models/auth.types';

export abstract class AuthGateway {
  abstract login(email: string, password: string): Observable<LoginResponse>;
  abstract verifyTwoFactor(challengeToken: string, code: string): Observable<LoginResponse>;
  abstract getCurrentUser(): Observable<UserResponse>;
  abstract logout(): Observable<unknown>;
  abstract changePassword(
    currentPassword: string,
    newPassword: string,
  ): Observable<unknown>;
  abstract generateTwoFactorSecret(): Observable<TwoFactorSecretResponse>;
  abstract enableTwoFactor(code: string): Observable<unknown>;
  abstract disableTwoFactor(password: string): Observable<unknown>;
}

export const AUTH_GATEWAY = new InjectionToken<AuthGateway>('AUTH_GATEWAY', {
  providedIn: 'root',
  factory: (): never => {
    throw new Error('AUTH_GATEWAY must be provided in app.config.ts');
  },
});
