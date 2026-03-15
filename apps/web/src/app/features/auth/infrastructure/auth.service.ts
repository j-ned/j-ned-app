import { HttpClient } from '@angular/common/http';
import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { catchError, map, Observable, of, tap } from 'rxjs';
import { API_BASE_URL } from '@shared/api';
import type { User } from '../domain';

type UserResponse = {
  id: string;
  email: string;
  role: string;
  isTwoFactorEnabled: boolean;
};

type LoginResponse = {
  user?: UserResponse;
  requiresTwoFactor?: boolean;
  email?: string;
};

type RefreshResponse = {
  user: UserResponse;
};

type RegisterResponse = {
  id: string;
  email: string;
  role: string;
};

type TwoFactorSecretResponse = {
  secret: string;
  qrCodeDataUrl: string;
};

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly apiUrl = inject(API_BASE_URL);
  private readonly destroyRef = inject(DestroyRef);
  private readonly _currentUser = signal<User | null>(null);
  private readonly _pendingTwoFactorEmail = signal<string | null>(null);
  private _resolveReady!: () => void;

  readonly currentUser = this._currentUser.asReadonly();
  readonly isLoggedIn = computed(() => this._currentUser() !== null);
  readonly pendingTwoFactorEmail = this._pendingTwoFactorEmail.asReadonly();
  readonly ready = new Promise<void>((resolve) => {
    this._resolveReady = resolve;
  });

  constructor() {
    this.restoreSession();
  }

  login(
    email: string,
    password: string,
    twoFactorCode?: string,
  ): Observable<'success' | 'two-factor' | 'error'> {
    return this.http
      .post<LoginResponse>(
        `${this.apiUrl}/auth/login`,
        { email, password, twoFactorCode },
        { withCredentials: true },
      )
      .pipe(
        map((res) => {
          if (res.requiresTwoFactor) {
            this._pendingTwoFactorEmail.set(res.email ?? email);
            return 'two-factor' as const;
          }
          if (res.user) {
            this.setUserFromApi(res.user);
            return 'success' as const;
          }
          return 'error' as const;
        }),
        catchError(() => of('error' as const)),
      );
  }

  register(email: string, password: string): Observable<boolean> {
    return this.http
      .post<RegisterResponse>(
        `${this.apiUrl}/auth/register`,
        { email, password },
        { withCredentials: true },
      )
      .pipe(
        map(() => true),
        catchError(() => of(false)),
      );
  }

  verifyTwoFactor(email: string, code: string): Observable<boolean> {
    return this.http
      .post<LoginResponse>(
        `${this.apiUrl}/auth/2fa/verify`,
        { email, twoFactorCode: code },
        { withCredentials: true },
      )
      .pipe(
        map((res) => {
          if (res.user) {
            this.setUserFromApi(res.user);
            this._pendingTwoFactorEmail.set(null);
            return true;
          }
          return false;
        }),
        catchError(() => of(false)),
      );
  }

  generateTwoFactorSecret(): Observable<TwoFactorSecretResponse> {
    return this.http.post<TwoFactorSecretResponse>(
      `${this.apiUrl}/auth/2fa/generate`,
      {},
      { withCredentials: true },
    );
  }

  enableTwoFactor(code: string): Observable<boolean> {
    return this.http
      .post(`${this.apiUrl}/auth/2fa/enable`, { code }, { withCredentials: true })
      .pipe(
        tap(() => {
          const user = this._currentUser();
          if (user) {
            this._currentUser.set({ ...user, isTwoFactorEnabled: true });
          }
        }),
        map(() => true),
        catchError(() => of(false)),
      );
  }

  disableTwoFactor(password: string): Observable<boolean> {
    return this.http
      .post(`${this.apiUrl}/auth/2fa/disable`, { password }, { withCredentials: true })
      .pipe(
        tap(() => {
          const user = this._currentUser();
          if (user) {
            this._currentUser.set({ ...user, isTwoFactorEnabled: false });
          }
        }),
        map(() => true),
        catchError(() => of(false)),
      );
  }

  changePassword(currentPassword: string, newPassword: string): Observable<boolean> {
    return this.http
      .post(
        `${this.apiUrl}/auth/change-password`,
        { currentPassword, newPassword },
        { withCredentials: true },
      )
      .pipe(
        map(() => true),
        catchError(() => of(false)),
      );
  }

  refresh(): Observable<boolean> {
    return this.http
      .post<RefreshResponse>(`${this.apiUrl}/auth/refresh`, {}, { withCredentials: true })
      .pipe(
        map((res) => {
          if (res.user) {
            this.setUserFromApi(res.user);
          }
          return true;
        }),
        catchError(() => of(false)),
      );
  }

  logout(): void {
    this.http
      .post(`${this.apiUrl}/auth/logout`, {}, { withCredentials: true })
      .pipe(
        catchError(() => of(null)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this._currentUser.set(null);
        this.router.navigate(['/']);
      });
  }

  private setUserFromApi(apiUser: UserResponse): void {
    this._currentUser.set({
      id: apiUser.id,
      email: apiUser.email,
      displayName: apiUser.email,
      role: apiUser.role,
      isTwoFactorEnabled: apiUser.isTwoFactorEnabled,
    });
  }

  private restoreSession(): void {
    this.refresh()
      .pipe(
        tap((success) => {
          if (!success) {
            this._currentUser.set(null);
          }
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => this._resolveReady());
  }
}
