import jwt, { type SignOptions } from 'jsonwebtoken';

const ALGORITHM = 'HS256';

export const JWT_ISSUER = 'j-ned-portfolio-api';
// Une audience par usage : un jeton de défi 2FA ne vaut pas session, ni l'inverse.
export const SESSION_AUDIENCE = 'j-ned-portfolio:session';
export const CHALLENGE_AUDIENCE = 'j-ned-portfolio:2fa-challenge';
export type JwtAudience = typeof SESSION_AUDIENCE | typeof CHALLENGE_AUDIENCE;

/**
 * Signature et vérification des JWT de l'API : HS256 seul (jamais l'algorithme annoncé par le jeton),
 * émetteur et audience posés à la signature et exigés à la vérification.
 */
export class JwtService {
  constructor(
    private readonly secret: string,
    private readonly defaultExpiresIn: string,
  ) {}

  sign(
    audience: JwtAudience,
    payload: object,
    options: { expiresIn?: string } = {},
  ): string {
    return jwt.sign(payload, this.secret, {
      algorithm: ALGORITHM,
      issuer: JWT_ISSUER,
      audience,
      expiresIn: (options.expiresIn ?? this.defaultExpiresIn) as NonNullable<
        SignOptions['expiresIn']
      >,
    });
  }

  /** Lève une erreur si le jeton est invalide, expiré ou sans expiration, signé autrement qu'en HS256, d'un autre émetteur, ou d'une audience qui n'est pas exactement celle attendue. */
  verify<T extends object>(audience: JwtAudience, token: string): T {
    const claims = jwt.verify(token, this.secret, {
      algorithms: [ALGORITHM],
      issuer: JWT_ISSUER,
      audience,
    });
    // jsonwebtoken accepte une liste d'audiences dont une seule convient, et un jeton sans expiration.
    if (typeof claims === 'string' || claims.aud !== audience) {
      throw new Error('jwt audience invalid');
    }
    if (typeof claims.exp !== 'number') throw new Error('jwt exp missing');
    return claims as T;
  }
}
