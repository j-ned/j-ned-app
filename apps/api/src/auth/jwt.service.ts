import jwt, { type SignOptions } from 'jsonwebtoken';

const ALGORITHM = 'HS256';

/**
 * Signature et vérification des JWT de l'API (HS256 seul, jamais l'algorithme annoncé par le jeton).
 * Même bibliothèque et mêmes réglages que `@nestjs/jwt` avant elle : les sessions ouvertes survivent
 * au changement de framework.
 */
export class JwtService {
  constructor(
    private readonly secret: string,
    private readonly defaultExpiresIn: string,
  ) {}

  sign(payload: object, options: { expiresIn?: string } = {}): string {
    return jwt.sign(payload, this.secret, {
      algorithm: ALGORITHM,
      expiresIn: (options.expiresIn ??
        this.defaultExpiresIn) as SignOptions['expiresIn'],
    });
  }

  /** Lève une erreur si le jeton est invalide, expiré ou signé autrement qu'en HS256. */
  verify<T extends object>(token: string): T {
    return jwt.verify(token, this.secret, { algorithms: [ALGORITHM] }) as T;
  }
}
