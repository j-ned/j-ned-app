import { computed, DestroyRef, PLATFORM_ID, inject, Injectable, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { catchError, map, Observable, of, tap } from 'rxjs';
import { setUser as sentrySetUser } from '@sentry/angular';
import type { User } from '@features/auth/domain/models/user.model';
import type {
  TwoFactorSecretResponse,
  UserResponse,
} from '@features/auth/domain/models/auth.types';
import { AuthGateway } from '@features/auth/domain/gateways/auth.gateway';

// Indice local posé à la connexion : sans lui, aucun appel /auth/me au démarrage. Le cookie
// httpOnly reste la source de vérité ; l'indice évite seulement un 401 par visite anonyme.
export const SESSION_HINT_KEY = 'auth:session';

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

  // Recréée à chaque restoreSession() pour que les guards attendent la restoration en cours.
  private _ready: Promise<void> = Promise.resolve();
  get ready(): Promise<void> {
    return this._ready;
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
        this.writeSessionHint(false);
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
    this.writeSessionHint(true);
    sentrySetUser({ id: apiUser.id });
  }

  // Appelé par l'initialiseur d'app (`initializeAuth`), jamais depuis le constructeur : la requête
  // traverse `authInterceptor`, qui injecte AuthStore. Lancée pendant la construction du store,
  // elle échouait en NG0200 (dépendance circulaire) avant même de partir, et l'erreur effaçait
  // l'indice de session : chaque rechargement déconnectait l'admin.
  restoreSession(): void {
    if (!this.isBrowser || !this.hasSessionHint()) return;
    this._ready = new Promise<void>((resolve) => {
      this.gateway
        .getCurrentUser()
        .pipe(
          tap((res) => this.setUserFromApi(res)),
          catchError((error: unknown) => {
            this._currentUser.set(null);
            // Seul un 401 prouve que le cookie ne vaut plus rien ; une panne réseau ou un 5xx
            // garde l'indice pour réessayer à la prochaine visite.
            if (error instanceof HttpErrorResponse && error.status === 401) {
              this.writeSessionHint(false);
            }
            sentrySetUser(null);
            return of(null);
          }),
          takeUntilDestroyed(this.destroyRef),
        )
        .subscribe(() => resolve());
    });
  }

  private hasSessionHint(): boolean {
    try {
      return localStorage.getItem(SESSION_HINT_KEY) === '1';
    } catch {
      return false;
    }
  }

  private writeSessionHint(present: boolean): void {
    if (!this.isBrowser) return;
    try {
      if (present) {
        localStorage.setItem(SESSION_HINT_KEY, '1');
      } else {
        localStorage.removeItem(SESSION_HINT_KEY);
      }
    } catch {
      // Stockage indisponible : on retombe sur l'ancien comportement (un /auth/me de plus).
    }
  }
}
