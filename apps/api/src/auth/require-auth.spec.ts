import { Hono } from 'hono';
import jwt from 'jsonwebtoken';
import { handleError } from '../common/error-handler';
import type { AppEnv } from '../common/http';
import type { User } from '../database/schema';
import type { UsersService } from '../users/users.service';
import { AUTH_COOKIE_NAME } from './auth-cookie';
import {
  CHALLENGE_AUDIENCE,
  JwtService,
  SESSION_AUDIENCE,
} from './jwt.service';
import { requireAuth } from './require-auth';

const SECRET = 'require-auth-spec-'.repeat(2);

describe('requireAuth', () => {
  const service = new JwtService(SECRET, '24h');
  const admin: User = {
    id: 'u1',
    email: 'admin@example.com',
    passwordHash: '$argon2id$...',
    isTwoFactorEnabled: false,
    twoFactorSecret: null,
    pendingTwoFactorSecret: null,
    twoFactorBackupCodesHash: null,
    tokenVersion: 0,
    createdAt: new Date(0),
    updatedAt: new Date(0),
  };
  const users: Pick<UsersService, 'findById'> = {
    findById: (id) => Promise.resolve(id === admin.id ? admin : null),
  };
  const app = new Hono<AppEnv>()
    .get('/me', requireAuth(service, users), (c) =>
      c.json({ id: c.var.user.id }),
    )
    .onError(handleError);
  const me = (token: string) =>
    app.request('/me', {
      headers: { cookie: `${AUTH_COOKIE_NAME}=${token}` },
    });

  it('Given a session token, When a protected route is read, Then it is served', async () => {
    const res = await me(
      service.sign(SESSION_AUDIENCE, { sub: 'u1', tokenVersion: 0 }),
    );

    expect(res.status).toBe(200);
  });

  it('Given a session opened before issuer and audience were required, When it is presented, Then it gets a plain 401', async () => {
    const legacy = jwt.sign({ sub: 'u1', tokenVersion: 0 }, SECRET, {
      algorithm: 'HS256',
      expiresIn: '7d',
    });

    const res = await me(legacy);

    expect(res.status).toBe(401);
    expect(await res.json()).toMatchObject({
      statusCode: 401,
      error: 'Unauthorized',
      message: 'Unauthorized',
    });
  });

  it('Given a 2FA challenge token without its scope claim, When it is presented as a session, Then its audience alone gets it refused', async () => {
    const challenge = service.sign(
      CHALLENGE_AUDIENCE,
      { sub: 'u1', tokenVersion: 0 },
      { expiresIn: '5m' },
    );

    expect((await me(challenge)).status).toBe(401);
  });
});
