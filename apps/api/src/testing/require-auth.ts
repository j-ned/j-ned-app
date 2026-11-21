import type { RequireAuth } from '../auth/require-auth';
import { UnauthorizedException } from '../common/http-errors';

/** Garde d'authentification qui laisse tout passer. */
export const passThrough: RequireAuth = async (_c, next) => {
  await next();
};

/** Garde d'authentification qui refuse tout (401). */
export const denyAll: RequireAuth = () => {
  throw new UnauthorizedException();
};
