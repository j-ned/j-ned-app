import { getCookie } from 'hono/cookie';
import { createMiddleware } from 'hono/factory';
import type { AppEnv } from '../common/http';
import { UnauthorizedException } from '../common/http-errors';
import type { UsersService } from '../users/users.service';
import { AUTH_COOKIE_NAME } from './auth-cookie';
import type { JwtPayload } from './jwt-payload.interface';
import type { JwtService } from './jwt.service';

const BEARER = /^Bearer\s+(\S+)$/i;

/**
 * Session admin requise : JWT du cookie `__Host-token` (ou, à défaut, `Authorization: Bearer`),
 * vérifié en HS256, qui n'est pas un jeton de challenge 2FA et dont la version n'a pas été révoquée
 * par une déconnexion. L'utilisateur est posé dans `c.var.user`.
 */
export function requireAuth(jwt: JwtService, users: UsersService) {
  return createMiddleware<AppEnv>(async (c, next) => {
    const token =
      getCookie(c, AUTH_COOKIE_NAME) ??
      BEARER.exec(c.req.header('authorization') ?? '')?.[1];
    if (!token) throw new UnauthorizedException();

    let payload: JwtPayload;
    try {
      payload = jwt.verify<JwtPayload>(token);
    } catch {
      throw new UnauthorizedException();
    }
    if (payload.scope === '2fa-challenge') {
      throw new UnauthorizedException(
        'Challenge token cannot be used for authentication',
      );
    }
    const user = await users.findById(payload.sub);
    if (!user) throw new UnauthorizedException('User no longer exists');
    if (payload.tokenVersion !== user.tokenVersion) {
      throw new UnauthorizedException('Token revoked');
    }
    c.set('user', user);
    await next();
  });
}

export type RequireAuth = ReturnType<typeof requireAuth>;
