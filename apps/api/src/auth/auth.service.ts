import { createHash, randomUUID } from 'node:crypto';
import {
  UnauthorizedException,
  BadRequestException,
  TooManyRequestsException,
} from '../common/http-errors';
import { countHit, TWO_FACTOR_ACCOUNT_THROTTLE } from '../common/throttle';
import type { JwtService } from './jwt.service';
import { UsersService } from '../users/users.service';
import { PasswordService } from './password.service';
import { TwoFactorService } from './two-factor.service';
import type { User } from '../database/schema';
import type { JwtPayload } from './jwt-payload.interface';

export type LoginResult =
  | { kind: 'authenticated'; token: string; user: PublicUser }
  | { kind: 'challenge'; challengeToken: string };

export type PublicUser = {
  id: string;
  email: string;
  isTwoFactorEnabled: boolean;
};

function publicUser(u: User): PublicUser {
  return { id: u.id, email: u.email, isTwoFactorEnabled: u.isTwoFactorEnabled };
}

// Un code TOTP vaut 30 s ; 90 s couvrent sa fenêtre et un décalage d'horloge.
const TOTP_REPLAY_WINDOW_MS = 90_000;

export class AuthService {
  private decoyHash?: Promise<string>;

  constructor(
    private readonly users: UsersService,
    private readonly password: PasswordService,
    private readonly twoFactor: TwoFactorService,
    private readonly jwt: JwtService,
  ) {}

  /**
   * Logout : incrémente `tokenVersion` pour que le JWT (7 jours) ne survive pas à la
   * déconnexion s'il a fuité. Un cookie absent, expiré ou de challenge 2FA est ignoré :
   * le contrôleur efface le cookie dans tous les cas.
   */
  async revokeSessionFromToken(token: string | undefined): Promise<void> {
    if (!token) return;
    let payload: JwtPayload;
    try {
      payload = this.jwt.verify<JwtPayload>(token);
    } catch {
      return;
    }
    if (payload.scope === '2fa-challenge') return;
    await this.users.revokeSessions(payload.sub);
  }

  async login(email: string, plainPassword: string): Promise<LoginResult> {
    const user = await this.users.findByEmail(email);
    // Compte inconnu : même travail argon2 qu'un mauvais mot de passe, la durée ne trahit pas le compte.
    const hash = user?.passwordHash ?? (await this.decoyPasswordHash());
    const ok = await this.password.verify(plainPassword, hash);
    if (!user || !ok) throw new UnauthorizedException('Invalid credentials');

    if (user.isTwoFactorEnabled) {
      const challengeToken = this.jwt.sign(
        { sub: user.id, scope: '2fa-challenge' },
        { expiresIn: '5m' },
      );
      return { kind: 'challenge', challengeToken };
    }

    const token = this.jwt.sign({
      sub: user.id,
      tokenVersion: user.tokenVersion,
    });
    return { kind: 'authenticated', token, user: publicUser(user) };
  }

  async verifyTwoFactor(
    challengeToken: string,
    creds: { code?: string; backupCode?: string },
  ): Promise<{ token: string; user: PublicUser }> {
    let payload: JwtPayload;
    try {
      payload = this.jwt.verify<JwtPayload>(challengeToken);
    } catch {
      throw new UnauthorizedException('Invalid challenge token');
    }
    if (payload.scope !== '2fa-challenge') {
      throw new UnauthorizedException('Invalid challenge token');
    }
    const user = await this.users.findById(payload.sub);
    if (!user || !user.isTwoFactorEnabled || !user.twoFactorSecret) {
      throw new UnauthorizedException('Invalid challenge token');
    }

    const attempts = await countHit(
      `2fa|${user.id}`,
      TWO_FACTOR_ACCOUNT_THROTTLE.ttlMs,
    );
    if (attempts && attempts.count > TWO_FACTOR_ACCOUNT_THROTTLE.limit) {
      throw new TooManyRequestsException();
    }

    if (creds.code) {
      if (
        !this.twoFactor.verifyTotpCode(user.twoFactorSecret, creds.code) ||
        (await this.isReplayedTotpCode(user.id, creds.code))
      ) {
        throw new UnauthorizedException('Invalid 2FA code');
      }
    } else if (creds.backupCode) {
      const matchHash = await this.twoFactor.findMatchingBackupCode(
        creds.backupCode,
        user.twoFactorBackupCodesHash ?? [],
      );
      if (!matchHash) throw new UnauthorizedException('Invalid backup code');
      await this.users.consumeBackupCode(user.id, matchHash);
    } else {
      throw new UnauthorizedException('Either code or backupCode is required');
    }

    const token = this.jwt.sign({
      sub: user.id,
      tokenVersion: user.tokenVersion,
    });
    return { token, user: publicUser(user) };
  }

  /** Un code TOTP ne sert qu'une fois par compte : intercepté, il ne se rejoue pas dans sa fenêtre. */
  private async isReplayedTotpCode(
    userId: string,
    code: string,
  ): Promise<boolean> {
    const digest = createHash('sha256')
      .update(`${userId}|${code}`)
      .digest('hex');
    const uses = await countHit(`2fa-used|${digest}`, TOTP_REPLAY_WINDOW_MS);
    return uses !== undefined && uses.count > 1;
  }

  private decoyPasswordHash(): Promise<string> {
    this.decoyHash ??= this.password.hash(randomUUID());
    return this.decoyHash;
  }

  async changePassword(
    user: User,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const ok = await this.password.verify(currentPassword, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Invalid current password');
    const newHash = await this.password.hash(newPassword);
    await this.users.updatePassword(user.id, newHash);
  }

  async generateTwoFactorSecret(
    user: User,
  ): Promise<{ secret: string; qrCodeDataUrl: string }> {
    if (user.isTwoFactorEnabled) {
      throw new BadRequestException('2FA is already enabled');
    }
    const secret = this.twoFactor.generateSecret();
    const qrCodeDataUrl = await this.twoFactor.generateQrCodeDataUrl(
      user.email,
      secret,
    );
    await this.users.updateTwoFactorSecret(user.id, secret);
    return { secret, qrCodeDataUrl };
  }

  async enableTwoFactor(
    user: User,
    code: string,
  ): Promise<{ backupCodes: string[] }> {
    if (!user.twoFactorSecret) {
      throw new BadRequestException(
        'Generate a 2FA secret first via /auth/2fa/generate',
      );
    }
    if (!this.twoFactor.verifyTotpCode(user.twoFactorSecret, code)) {
      throw new UnauthorizedException('Invalid 2FA code');
    }
    const backupCodes = this.twoFactor.generateBackupCodes();
    const hashes = await this.twoFactor.hashBackupCodes(backupCodes);
    await this.users.enableTwoFactor(user.id, hashes);
    return { backupCodes };
  }

  async disableTwoFactor(user: User, password: string): Promise<void> {
    if (!user.isTwoFactorEnabled) {
      throw new BadRequestException('2FA is not enabled');
    }
    const ok = await this.password.verify(password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Invalid password');
    await this.users.disableTwoFactor(user.id);
  }
}
