import { computed, inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { map, Observable, catchError, of } from 'rxjs';
import type { User } from '../models';
import { API_BASE_URL } from '../../../../shared/api/api-config';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly _currentUser = signal<User | null>(null);

  readonly currentUser = this._currentUser.asReadonly();
  readonly isLoggedIn = computed(() => this._currentUser() !== null);

  login(login: string, password: string): Observable<boolean> {
    return this.http
      .get<
        (User & { password: string })[]
      >(`${API_BASE_URL}/users?login=${encodeURIComponent(login)}&password=${encodeURIComponent(password)}`)
      .pipe(
        map((users) => {
          if (users.length > 0) {
            const { password: _, ...user } = users[0];
            this._currentUser.set(user);
            return true;
          }
          return false;
        }),
        catchError(() => of(false)),
      );
  }

  logout(): void {
    this._currentUser.set(null);
    this.router.navigate(['/']);
  }
}
