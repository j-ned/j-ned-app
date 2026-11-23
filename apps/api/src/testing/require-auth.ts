import type { RequireAuth } from '../auth/require-auth';
import { UnauthorizedException } from '../common/http-errors';
import type { User } from '../database/schema';

export const TEST_ADMIN: User = {
  id: '00000000-0000-4000-8000-000000000001',
  email: 'admin@example.test',
  passwordHash: 'not-a-hash',
  isTwoFactorEnabled: false,
  twoFactorSecret: null,
  twoFactorBackupCodesHash: null,
  tokenVersion: 0,
  createdAt: new Date(0),
  updatedAt: new Date(0),
};

// Comme `requireAuth` après une session valide : l'utilisateur est posé dans `c.var.user`.
export const passThrough: RequireAuth = async (c, next) => {
  c.set('user', TEST_ADMIN);
  await next();
};

export const denyAll: RequireAuth = () => {
  throw new UnauthorizedException();
};
