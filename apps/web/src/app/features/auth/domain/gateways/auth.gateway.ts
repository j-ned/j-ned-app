import type { Observable } from 'rxjs';
import type { LoginResponse, TwoFactorSecretResponse, UserResponse } from '../models/auth.types';

export abstract class AuthGateway {
  abstract login(email: string, password: string): Observable<LoginResponse>;
  abstract verifyTwoFactor(challengeToken: string, code: string): Observable<LoginResponse>;
  abstract getCurrentUser(): Observable<UserResponse>;
  abstract logout(): Observable<unknown>;
  abstract changePassword(currentPassword: string, newPassword: string): Observable<unknown>;
  abstract generateTwoFactorSecret(): Observable<TwoFactorSecretResponse>;
  abstract enableTwoFactor(code: string): Observable<unknown>;
  abstract disableTwoFactor(password: string): Observable<unknown>;
}
