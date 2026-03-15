import { createMiddleware } from 'hono/factory';
import { getCookie } from 'hono/cookie';
import { HTTPException } from 'hono/http-exception';
import { jwtVerify } from 'jose';
import { env } from '../lib/env.js';

const accessSecret = new TextEncoder().encode(env.JWT_ACCESS_SECRET);
const refreshSecret = new TextEncoder().encode(env.JWT_REFRESH_SECRET);

export const authMiddleware = createMiddleware(async (c, next) => {
  const token = getCookie(c, 'access_token');

  if (!token) {
    throw new HTTPException(401, { message: 'Authentication required' });
  }

  try {
    const { payload } = await jwtVerify(token, accessSecret);
    c.set('user', {
      sub: payload.sub as string,
      email: payload.email as string,
    });
    await next();
  } catch {
    throw new HTTPException(401, { message: 'Invalid or expired token' });
  }
});

export const refreshMiddleware = createMiddleware(async (c, next) => {
  const token = getCookie(c, 'refresh_token');

  if (!token) {
    throw new HTTPException(401, { message: 'Refresh token required' });
  }

  try {
    const { payload } = await jwtVerify(token, refreshSecret);
    c.set('user', {
      sub: payload.sub as string,
      email: payload.email as string,
    });
    await next();
  } catch {
    throw new HTTPException(401, { message: 'Invalid or expired refresh token' });
  }
});
