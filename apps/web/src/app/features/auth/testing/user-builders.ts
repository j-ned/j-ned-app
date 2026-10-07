import type { User } from '../domain/models/user.model';

export function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user-1',
    email: 'contact@nedellec-julien.fr',
    displayName: 'Julien Nédellec',
    isTwoFactorEnabled: true,
    ...overrides,
  };
}
