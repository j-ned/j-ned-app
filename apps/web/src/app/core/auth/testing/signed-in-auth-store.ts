import { signal } from '@angular/core';
import type { AuthStore } from '@core/auth/auth-store';
import type { User } from '@features/auth/domain/models/user.model';

export type SignedInAuthStore = Pick<AuthStore, 'currentUser' | 'logout'>;

export function signedInAuthStore(user: User, logout: () => void): SignedInAuthStore {
  return { currentUser: signal(user).asReadonly(), logout };
}
