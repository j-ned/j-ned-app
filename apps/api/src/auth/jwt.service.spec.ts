import jwt, { type SignOptions } from 'jsonwebtoken';
import {
  CHALLENGE_AUDIENCE,
  JWT_ISSUER,
  JwtService,
  SESSION_AUDIENCE,
} from './jwt.service';

const SECRET = 'jwt-service-spec-'.repeat(2);
const PAYLOAD = { sub: 'u1', tokenVersion: 0 };

describe('JwtService', () => {
  const service = new JwtService(SECRET, '24h');
  const forged = (options: SignOptions, payload: object = PAYLOAD) =>
    jwt.sign(payload, SECRET, { algorithm: 'HS256', ...options });
  const session: SignOptions = {
    issuer: JWT_ISSUER,
    audience: SESSION_AUDIENCE,
    expiresIn: '1h',
  };

  it('Given a session token, When it is verified as a session, Then its claims come back with issuer, audience and expiry', () => {
    const claims = service.verify<Record<string, unknown>>(
      SESSION_AUDIENCE,
      service.sign(SESSION_AUDIENCE, PAYLOAD),
    );

    expect(claims).toMatchObject({
      ...PAYLOAD,
      iss: JWT_ISSUER,
      aud: SESSION_AUDIENCE,
    });
    expect(Number(claims['exp']) - Number(claims['iat'])).toBe(24 * 3600);
  });

  it('Given an explicit lifetime, When a token is signed, Then it expires after that lifetime', () => {
    const claims = service.verify<Record<string, unknown>>(
      CHALLENGE_AUDIENCE,
      service.sign(CHALLENGE_AUDIENCE, { sub: 'u1' }, { expiresIn: '5m' }),
    );

    expect(Number(claims['exp']) - Number(claims['iat'])).toBe(300);
  });

  it('Given a 2FA challenge token, When it is presented as a session, Then it is refused', () => {
    const challenge = service.sign(
      CHALLENGE_AUDIENCE,
      { sub: 'u1', scope: '2fa-challenge' },
      { expiresIn: '5m' },
    );

    expect(() => service.verify(SESSION_AUDIENCE, challenge)).toThrow(
      'jwt audience invalid',
    );
  });

  it('Given a session token, When it is presented as a 2FA challenge, Then it is refused', () => {
    const token = service.sign(SESSION_AUDIENCE, PAYLOAD);

    expect(() => service.verify(CHALLENGE_AUDIENCE, token)).toThrow(
      'jwt audience invalid',
    );
  });

  it.each<[string, SignOptions, string]>([
    [
      'without issuer',
      { audience: SESSION_AUDIENCE, expiresIn: '1h' },
      'jwt issuer invalid',
    ],
    [
      'from another issuer',
      { ...session, issuer: 'someone-else' },
      'jwt issuer invalid',
    ],
    [
      'without audience',
      { issuer: JWT_ISSUER, expiresIn: '1h' },
      'jwt audience invalid',
    ],
    [
      'for another audience',
      { ...session, audience: 'another-service' },
      'jwt audience invalid',
    ],
    [
      'signed with another algorithm',
      { ...session, algorithm: 'HS512' },
      'invalid algorithm',
    ],
    [
      'issued before issuer and audience existed',
      { expiresIn: '7d' },
      'jwt audience invalid',
    ],
  ])(
    'Given a token %s, When it is verified, Then it is refused',
    (_, options, message) => {
      expect(() => service.verify(SESSION_AUDIENCE, forged(options))).toThrow(
        message,
      );
    },
  );

  it.each<[string, typeof SESSION_AUDIENCE | typeof CHALLENGE_AUDIENCE]>([
    ['a session', SESSION_AUDIENCE],
    ['a 2FA challenge', CHALLENGE_AUDIENCE],
  ])(
    'Given a token whose audience lists both usages, When it is verified as %s, Then it is refused',
    (_, audience) => {
      const both = forged({
        ...session,
        audience: [SESSION_AUDIENCE, CHALLENGE_AUDIENCE],
      });

      expect(() => service.verify(audience, both)).toThrow(
        'jwt audience invalid',
      );
    },
  );

  it('Given a token that never expires, When it is verified, Then it is refused', () => {
    const eternal = forged({ issuer: JWT_ISSUER, audience: SESSION_AUDIENCE });

    expect(() => service.verify(SESSION_AUDIENCE, eternal)).toThrow(
      'jwt exp missing',
    );
  });

  it('Given an expired token, When it is verified, Then it is refused', () => {
    const expired = forged(session, { ...PAYLOAD, iat: 1_000 });

    expect(() => service.verify(SESSION_AUDIENCE, expired)).toThrow(
      'jwt expired',
    );
  });

  it('Given a token signed with another secret, When it is verified, Then it is refused', () => {
    const foreign = jwt.sign(PAYLOAD, `${SECRET}-other`, {
      algorithm: 'HS256',
      ...session,
    });

    expect(() => service.verify(SESSION_AUDIENCE, foreign)).toThrow(
      'invalid signature',
    );
  });
});
