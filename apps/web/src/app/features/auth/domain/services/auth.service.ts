import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { from, map, Observable, catchError, of } from 'rxjs';
import type { User } from '../models';
import { SupabaseClientService } from '../../../../shared/supabase/supabase-client';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly supabase = inject(SupabaseClientService);
  private readonly router = inject(Router);
  private readonly _currentUser = signal<User | null>(null);
  private _resolveReady!: () => void;

  readonly currentUser = this._currentUser.asReadonly();
  readonly isLoggedIn = computed(() => this._currentUser() !== null);
  readonly ready = new Promise<void>((resolve) => {
    this._resolveReady = resolve;
  });

  constructor() {
    this.restoreSession();
  }

  login(email: string, password: string): Observable<boolean> {
    return from(this.supabase.client.auth.signInWithPassword({ email, password })).pipe(
      map(({ data, error }) => {
        if (error || !data.user) return false;
        this.setUser(data.user);
        return true;
      }),
      catchError(() => of(false)),
    );
  }

  logout(): void {
    this.supabase.client.auth.signOut().then(() => {
      this._currentUser.set(null);
      this.router.navigate(['/']);
    });
  }

  private setUser(supabaseUser: {
    id: string;
    email?: string;
    user_metadata: Record<string, unknown>;
    app_metadata: Record<string, unknown>;
  }): void {
    this._currentUser.set({
      id: supabaseUser.id,
      email: supabaseUser.email ?? '',
      displayName:
        (supabaseUser.user_metadata['display_name'] as string) ?? supabaseUser.email ?? '',
      role: (supabaseUser.app_metadata['role'] as string) ?? 'user',
    });
  }

  private restoreSession(): void {
    this.supabase.client.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        this.setUser(session.user);
      } else {
        this._currentUser.set(null);
      }

      if (event === 'INITIAL_SESSION') {
        this._resolveReady();
      }
    });
  }
}
