import { Hono } from 'hono';
import { getCookie, setCookie } from 'hono/cookie';
import type { AppConfigService } from '../config/app-config.service';
import { jsonBody, type AppEnv } from '../common/http';
import {
  AUTH_ATTEMPT_THROTTLE,
  PUBLIC_READ_THROTTLE,
  throttle,
} from '../common/throttle';
import { parseDurationMs } from '../common/utils';
import { AUTH_COOKIE_NAME, authCookieOptions } from './auth-cookie';
import type { AuthService } from './auth.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { LoginDto } from './dto/login.dto';
import { TwoFactorDisableDto } from './dto/two-factor-disable.dto';
import { TwoFactorEnableDto } from './dto/two-factor-enable.dto';
import { TwoFactorVerifyDto } from './dto/two-factor-verify.dto';
import type { RequireAuth } from './require-auth';

export type AuthRoutesDeps = {
  readonly auth: AuthService;
  readonly config: AppConfigService;
  readonly requireAuth: RequireAuth;
};

/** `/api/auth` : connexion (mot de passe puis 2FA), session, mot de passe et 2FA de l'admin. */
export function authRoutes({ auth, config, requireAuth }: AuthRoutesDeps) {
  const sessionMaxAgeMs = parseDurationMs(config.jwtExpiresIn);

  return (
    new Hono<AppEnv>()
      // Connexion : cookie posé si pas de 2FA, sinon un jeton de challenge (5 min).
      .post('/login', throttle(AUTH_ATTEMPT_THROTTLE), async (c) => {
        const dto = await jsonBody(c, LoginDto);
        const result = await auth.login(dto.email, dto.password);
        if (result.kind === 'authenticated') {
          setCookie(
            c,
            AUTH_COOKIE_NAME,
            result.token,
            authCookieOptions(sessionMaxAgeMs),
          );
          return c.json({ user: result.user });
        }
        return c.json({
          requiresTwoFactor: true,
          challengeToken: result.challengeToken,
        });
      })

      .post('/2fa/verify', throttle(AUTH_ATTEMPT_THROTTLE), async (c) => {
        const dto = await jsonBody(c, TwoFactorVerifyDto);
        const result = await auth.verifyTwoFactor(dto.challengeToken, {
          code: dto.code,
          backupCode: dto.backupCode,
        });
        setCookie(
          c,
          AUTH_COOKIE_NAME,
          result.token,
          authCookieOptions(sessionMaxAgeMs),
        );
        return c.json({ user: result.user });
      })

      // Déconnexion : révoque toutes les sessions (version du jeton) et efface le cookie.
      .post('/logout', throttle(), requireAuth, async (c) => {
        await auth.revokeSessionFromToken(getCookie(c, AUTH_COOKIE_NAME));
        setCookie(c, AUTH_COOKIE_NAME, '', authCookieOptions());
        return c.json({ ok: true });
      })

      .get('/me', throttle(PUBLIC_READ_THROTTLE), requireAuth, (c) => {
        const user = c.var.user;
        return c.json({
          id: user.id,
          email: user.email,
          isTwoFactorEnabled: user.isTwoFactorEnabled,
        });
      })

      .post('/change-password', throttle(), requireAuth, async (c) => {
        const dto = await jsonBody(c, ChangePasswordDto);
        await auth.changePassword(
          c.var.user,
          dto.currentPassword,
          dto.newPassword,
        );
        return c.json({ ok: true });
      })

      // Secret TOTP et QR code, sans activer la 2FA.
      .post('/2fa/generate', throttle(), requireAuth, async (c) =>
        c.json(await auth.generateTwoFactorSecret(c.var.user)),
      )

      // Active la 2FA sur un code valide ; rend les 10 codes de secours à usage unique.
      .post('/2fa/enable', throttle(), requireAuth, async (c) => {
        const dto = await jsonBody(c, TwoFactorEnableDto);
        return c.json(await auth.enableTwoFactor(c.var.user, dto.code));
      })

      .post('/2fa/disable', throttle(), requireAuth, async (c) => {
        const dto = await jsonBody(c, TwoFactorDisableDto);
        await auth.disableTwoFactor(c.var.user, dto.password);
        return c.json({ ok: true });
      })

      .post(
        '/2fa/regenerate-backup-codes',
        throttle(),
        requireAuth,
        async (c) => {
          const dto = await jsonBody(c, TwoFactorDisableDto);
          return c.json(
            await auth.regenerateBackupCodes(c.var.user, dto.password),
          );
        },
      )
  );
}
