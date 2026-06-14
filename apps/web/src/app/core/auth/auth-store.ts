import { computed, DestroyRef, PLATFORM_ID, inject, Injectable, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { catchError, map, Observable, of, tap } from 'rxjs';
import { setUser as sentrySetUser } from '@sentry/angular';
import type { User } from '@features/auth/domain/models/user.model';
import type { TwoFactorSecretResponse, UserResponse } from '@features/auth/domain/models/auth.types';
import { AuthGateway } from '@features/auth/domain/gateways/auth.gateway';

@Injectable({ providedIn: 'root' })
export class AuthStore {
  private readonly gateway = inject(AuthGateway);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly _currentUser = signal<User | null>(null);
  private readonly _pendingChallengeToken = signal<string | null>(null);

  readonly currentUser = this._currentUser.asReadonly();
  readonly isLoggedIn = computed(() => this._currentUser() !== null);
  readonly pendingChallengeToken = this._pendingChallengeToken.asReadonly();

  /**
   * Promise résolue quand le check d'auth initial (restoreSession) est terminé.
   * Récréée à chaque appel de `restoreSession()` pour que les nouveaux awaiters
   * (router guards, etc.) attendent la restoration en cours plutôt qu'une
   * promise déjà résolue côté SSG (où le constructor finit instantanément).
   */
  private _ready: Promise<void> = Promise.resolve();
  get ready(): Promise<void> {
    return this._ready;
  }

  constructor() {
    if (this.isBrowser) {
      this.restoreSession();
    }
  }

  login(email: string, password: string): Observable<'success' | 'two-factor' | 'error'> {
    return this.gateway.login(email, password).pipe(
      map((res) => {
        if (res.requiresTwoFactor && res.challengeToken) {
          this._pendingChallengeToken.set(res.challengeToken);
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

  verifyTwoFactor(challengeToken: string, code: string): Observable<boolean> {
    return this.gateway.verifyTwoFactor(challengeToken, code).pipe(
      map((res) => {
        if (res.user) {
          this.setUserFromApi(res.user);
          this._pendingChallengeToken.set(null);
          return true;
        }
        return false;
      }),
      catchError(() => of(false)),
    );
  }

  generateTwoFactorSecret(): Observable<TwoFactorSecretResponse> {
    return this.gateway.generateTwoFactorSecret();
  }

  enableTwoFactor(code: string): Observable<boolean> {
    return this.gateway.enableTwoFactor(code).pipe(
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
    return this.gateway.disableTwoFactor(password).pipe(
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
    return this.gateway.changePassword(currentPassword, newPassword).pipe(
      map(() => true),
      catchError(() => of(false)),
    );
  }

  logout(): void {
    this.gateway
      .logout()
      .pipe(
        catchError(() => of(null)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this._currentUser.set(null);
        sentrySetUser(null);
        void this.router.navigate(['/']);
      });
  }

  private setUserFromApi(apiUser: UserResponse): void {
    this._currentUser.set({
      id: apiUser.id,
      email: apiUser.email,
      displayName: apiUser.email,
      isTwoFactorEnabled: apiUser.isTwoFactorEnabled,
    });
    sentrySetUser({ id: apiUser.id });
  }

  /**
   * Tente de restaurer la session depuis le cookie httpOnly via GET /auth/me.
   * Public car appelé explicitement par App au boot client (le constructor
   * d'AuthStore peut ne pas être re-exécuté lors de l'hydration SSG).
   * Idempotent : reset puis reset le state selon la réponse backend.
   * Recrée `ready` pour que les awaiters subséquents attendent le nouveau
   * check (cas où ready avait déjà été résolue côté SSG sans fetch).
   */
  restoreSession(): void {
    if (!this.isBrowser) return;
    this._ready = new Promise<void>((resolve) => {
      this.gateway
        .getCurrentUser()
        .pipe(
          tap((res) => this.setUserFromApi(res)),
          catchError(() => {
            this._currentUser.set(null);
            sentrySetUser(null);
            return of(null);
          }),
          takeUntilDestroyed(this.destroyRef),
        )
        .subscribe(() => resolve());
    });
  }
}
