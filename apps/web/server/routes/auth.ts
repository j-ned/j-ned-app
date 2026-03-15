import { Hono } from 'hono';
import type { Context } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { setCookie, deleteCookie } from 'hono/cookie';
import { eq } from 'drizzle-orm';
import { db } from '../db/client.js';
import { appUser } from '../db/schema';
import { authMiddleware, refreshMiddleware } from '../middleware/auth.js';
import { rateLimiter } from '../middleware/rate-limit.js';
import {
  hashPassword, verifyPassword,
  generateTokens,
  generateTotpSecret, verifyTotp, generateQrCode,
} from '../services/auth-manager.js';
import {
  registerSchema, loginSchema, changePasswordSchema,
  twoFactorSchema, disableTwoFactorSchema, twoFactorVerifySchema,
} from '../schemas/auth.js';
import { env } from '../lib/env.js';
import type { JwtPayload } from '../types';

const auth = new Hono();

const isProduction = env.NODE_ENV === 'production';

function setAuthCookies(c: Context, accessToken: string, refreshToken: string): void {
  setCookie(c, 'access_token', accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'Strict' : 'Lax',
    maxAge: 15 * 60,
    path: '/',
  });
  setCookie(c, 'refresh_token', refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'Strict' : 'Lax',
    maxAge: 7 * 24 * 60 * 60,
    path: '/auth/refresh',
  });
}

// POST /auth/register
auth.post('/register',
  rateLimiter({ windowMs: 60_000, max: 5 }),
  zValidator('json', registerSchema),
  async (c) => {
    const { email, password } = c.req.valid('json');

    const existing = await db.select().from(appUser).where(eq(appUser.email, email)).limit(1);
    if (existing.length > 0) {
      return c.json({ error: 'Email already registered' }, 409);
    }

    const hashed = await hashPassword(password);
    const [created] = await db.insert(appUser).values({
      email,
      password: hashed,
    }).returning({ id: appUser.id, email: appUser.email });

    return c.json(created, 201);
  },
);

// POST /auth/login
auth.post('/login',
  rateLimiter({ windowMs: 60_000, max: 5 }),
  zValidator('json', loginSchema),
  async (c) => {
    const { email, password, twoFactorCode } = c.req.valid('json');

    const [found] = await db.select().from(appUser).where(eq(appUser.email, email)).limit(1);
    if (!found) {
      return c.json({ error: 'Invalid credentials' }, 401);
    }

    const valid = await verifyPassword(password, found.password);
    if (!valid) {
      return c.json({ error: 'Invalid credentials' }, 401);
    }

    if (found.isTwoFactorEnabled) {
      if (!twoFactorCode) {
        return c.json({ requiresTwoFactor: true, email: found.email }, 200);
      }
      if (!found.twoFactorSecret || !(await verifyTotp(twoFactorCode, found.twoFactorSecret))) {
        return c.json({ error: 'Invalid 2FA code' }, 401);
      }
    }

    const payload: JwtPayload = { sub: found.id, email: found.email };
    const [accessToken, refreshToken] = await generateTokens(payload);

    await db.update(appUser).set({ refreshToken }).where(eq(appUser.id, found.id));

    setAuthCookies(c, accessToken, refreshToken);

    return c.json({
      user: { id: found.id, email: found.email },
      accessToken,
      refreshToken,
    });
  },
);

// POST /auth/refresh
auth.post('/refresh', refreshMiddleware, async (c) => {
  const currentUser = c.get('user');

  const [found] = await db.select().from(appUser).where(eq(appUser.id, currentUser.sub)).limit(1);
  if (!found) {
    return c.json({ error: 'User not found' }, 404);
  }

  const payload: JwtPayload = { sub: found.id, email: found.email };
  const [accessToken, refreshToken] = await generateTokens(payload);

  await db.update(appUser).set({ refreshToken }).where(eq(appUser.id, found.id));

  setAuthCookies(c, accessToken, refreshToken);

  return c.json({
    user: { id: found.id, email: found.email },
    accessToken,
    refreshToken,
  });
});

// POST /auth/logout
auth.post('/logout', authMiddleware, async (c) => {
  const currentUser = c.get('user');

  await db.update(appUser).set({ refreshToken: null }).where(eq(appUser.id, currentUser.sub));

  deleteCookie(c, 'access_token', { path: '/' });
  deleteCookie(c, 'refresh_token', { path: '/auth/refresh' });

  return c.json({ message: 'Logged out' });
});

// POST /auth/change-password
auth.post('/change-password',
  authMiddleware,
  zValidator('json', changePasswordSchema),
  async (c) => {
    const currentUser = c.get('user');
    const { currentPassword, newPassword } = c.req.valid('json');

    const [found] = await db.select().from(appUser).where(eq(appUser.id, currentUser.sub)).limit(1);
    if (!found) {
      return c.json({ error: 'User not found' }, 404);
    }

    const valid = await verifyPassword(currentPassword, found.password);
    if (!valid) {
      return c.json({ error: 'Current password is incorrect' }, 401);
    }

    const hashed = await hashPassword(newPassword);
    await db.update(appUser).set({ password: hashed, updatedAt: new Date() }).where(eq(appUser.id, found.id));

    return c.json({ message: 'Password changed successfully' });
  },
);

// POST /auth/2fa/generate
auth.post('/2fa/generate', authMiddleware, async (c) => {
  const currentUser = c.get('user');
  const secret = generateTotpSecret();

  await db.update(appUser).set({ twoFactorSecret: secret }).where(eq(appUser.id, currentUser.sub));

  const qrCode = await generateQrCode(currentUser.email, secret);

  return c.json({ secret, qrCode });
});

// POST /auth/2fa/enable
auth.post('/2fa/enable',
  authMiddleware,
  zValidator('json', twoFactorSchema),
  async (c) => {
    const currentUser = c.get('user');
    const { code } = c.req.valid('json');

    const [found] = await db.select().from(appUser).where(eq(appUser.id, currentUser.sub)).limit(1);
    if (!found?.twoFactorSecret) {
      return c.json({ error: 'Generate 2FA secret first' }, 400);
    }

    if (!(await verifyTotp(code, found.twoFactorSecret))) {
      return c.json({ error: 'Invalid 2FA code' }, 401);
    }

    await db.update(appUser).set({ isTwoFactorEnabled: true }).where(eq(appUser.id, found.id));

    return c.json({ message: '2FA enabled successfully' });
  },
);

// POST /auth/2fa/disable
auth.post('/2fa/disable',
  authMiddleware,
  zValidator('json', disableTwoFactorSchema),
  async (c) => {
    const currentUser = c.get('user');
    const { password } = c.req.valid('json');

    const [found] = await db.select().from(appUser).where(eq(appUser.id, currentUser.sub)).limit(1);
    if (!found) {
      return c.json({ error: 'User not found' }, 404);
    }

    const valid = await verifyPassword(password, found.password);
    if (!valid) {
      return c.json({ error: 'Invalid password' }, 401);
    }

    await db.update(appUser).set({
      isTwoFactorEnabled: false,
      twoFactorSecret: null,
    }).where(eq(appUser.id, found.id));

    return c.json({ message: '2FA disabled successfully' });
  },
);

// POST /auth/2fa/verify
auth.post('/2fa/verify',
  rateLimiter({ windowMs: 60_000, max: 5 }),
  zValidator('json', twoFactorVerifySchema),
  async (c) => {
    const { email, twoFactorCode } = c.req.valid('json');

    const [found] = await db.select().from(appUser).where(eq(appUser.email, email)).limit(1);
    if (!found || !found.twoFactorSecret) {
      return c.json({ error: 'Invalid request' }, 400);
    }

    if (!(await verifyTotp(twoFactorCode, found.twoFactorSecret))) {
      return c.json({ error: 'Invalid 2FA code' }, 401);
    }

    const payload: JwtPayload = { sub: found.id, email: found.email };
    const [accessToken, refreshToken] = await generateTokens(payload);

    await db.update(appUser).set({ refreshToken }).where(eq(appUser.id, found.id));

    setAuthCookies(c, accessToken, refreshToken);

    return c.json({
      user: { id: found.id, email: found.email },
      accessToken,
      refreshToken,
    });
  },
);

export default auth;
