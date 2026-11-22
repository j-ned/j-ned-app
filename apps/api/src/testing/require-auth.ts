import type { RequireAuth } from '../auth/require-auth';
import { UnauthorizedException } from '../common/http-errors';

export const passThrough: RequireAuth = async (_c, next) => {
  await next();
};

export const denyAll: RequireAuth = () => {
  throw new UnauthorizedException();
};
