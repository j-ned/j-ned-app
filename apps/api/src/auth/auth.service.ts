import { createHash, randomUUID } from 'node:crypto';
import {
  HttpException,
  UnauthorizedException,
  BadRequestException,
  TooManyRequestsException,
} from '../common/http-errors';
import {
  countHit,
  REAUTH_ACCOUNT_THROTTLE,
  resetHits,
  TWO_FACTOR_ACCOUNT_THROTTLE,
} from '../common/throttle';
import {
  CHALLENGE_AUDIENCE,
  SESSION_AUDIENCE,
  type JwtService,
} from './jwt.service';
import { UsersService } from '../users/users.service';
import { PasswordService } from './password.service';
import { TwoFactorService } from './two-factor.service';
import type { User } from '../database/schema';
import type { JwtPayload } from './jwt-payload.interface';
import type { LoginJournalService, LoginOrigin } from './login-journal.service';

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

// Les seules opérations dont l'authentification a besoin : un test les double sans le reste.
export type AuthUsers = Pick<
  UsersService,
  | 'findById'
  | 'findByEmail'
  | 'updatePassword'
  | 'updateTwoFactorSecret'
  | 'enableTwoFactor'
  | 'disableTwoFactor'
  | 'consumeBackupCode'
  | 'revokeSessions'
>;
export type AuthTwoFactor = Pick<
  TwoFactorService,
  | 'generateSecret'
  | 'generateQrCodeDataUrl'
  | 'verifyTotpCode'
  | 'generateBackupCodes'
  | 'hashBackupCodes'
  | 'findMatchingBackupCode'
>;

export class AuthService {
  private decoyHash?: Promise<string>;

  constructor(
    private readonly users: AuthUsers,
    private readonly password: PasswordService,
    private readonly twoFactor: AuthTwoFactor,
    private readonly jwt: Pick<JwtService, 'sign' | 'verify'>,
    private readonly journal: Pick<LoginJournalService, 'record'>,
    private readonly now: () => number = Date.now,
  ) {}

  // Incrémente `tokenVersion` : un JWT fuité ne survit pas à la déconnexion. Un cookie absent, expiré
  // ou de challenge 2FA est ignoré : la route efface le cookie dans tous les cas.
  async revokeSessionFromToken(token: string | undefined): Promise<void> {
    if (!token) return;
    let payload: JwtPayload;
    try {
      payload = this.jwt.verify<JwtPayload>(SESSION_AUDIENCE, token);
    } catch {
      return;
    }
    if (payload.scope === '2fa-challenge') return;
    await this.users.revokeSessions(payload.sub);
  }

  async login(
    email: string,
    plainPassword: string,
    origin: LoginOrigin,
  ): Promise<LoginResult> {
    const user = await this.users.findByEmail(email);
    // Compte inconnu : même travail argon2 qu'un mauvais mot de passe, la durée ne trahit pas le compte.
    const hash = user?.passwordHash ?? (await this.decoyPasswordHash());
    const ok = await this.password.verify(plainPassword, hash);
    if (!user || !ok) {
      await this.journal.record('password_rejected', user?.id ?? null, origin);
      throw new UnauthorizedException('Invalid credentials');
    }
    await this.journal.record('password_accepted', user.id, origin);

    if (user.isTwoFactorEnabled) {
      const challengeToken = this.jwt.sign(
        CHALLENGE_AUDIENCE,
        { sub: user.id, scope: '2fa-challenge' },
        { expiresIn: '5m' },
      );
      return { kind: 'challenge', challengeToken };
    }

    const token = this.jwt.sign(SESSION_AUDIENCE, {
      sub: user.id,
      tokenVersion: user.tokenVersion,
    });
    return { kind: 'authenticated', token, user: publicUser(user) };
  }

  async verifyTwoFactor(
    challengeToken: string,
    creds: { code?: string | undefined; backupCode?: string | undefined },
    origin: LoginOrigin,
  ): Promise<{ token: string; user: PublicUser }> {
    let user: User | undefined;
    try {
      user = await this.challengedUser(challengeToken);
      await this.assertSecondFactor(user, creds);
    } catch (error) {
      // Une panne (base, réseau) n'est pas une tentative refusée : seul un refus est journalisé.
      if (error instanceof HttpException) {
        await this.journal.record(
          'two_factor_rejected',
          user?.id ?? null,
          origin,
        );
      }
      throw error;
    }
    await this.journal.record('two_factor_accepted', user.id, origin);

    const token = this.jwt.sign(SESSION_AUDIENCE, {
      sub: user.id,
      tokenVersion: user.tokenVersion,
    });
    return { token, user: publicUser(user) };
  }

  private async challengedUser(challengeToken: string): Promise<User> {
    let payload: JwtPayload;
    try {
      payload = this.jwt.verify<JwtPayload>(CHALLENGE_AUDIENCE, challengeToken);
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
    return user;
  }

  private async assertSecondFactor(
    user: User,
    creds: { code?: string | undefined; backupCode?: string | undefined },
  ): Promise<void> {
    // Compté avant de vérifier : des essais simultanés ne passent pas sous la limite.
    const attemptsKey = `2fa|${user.id}`;
    const attempts = await countHit(
      attemptsKey,
      TWO_FACTOR_ACCOUNT_THROTTLE.ttlMs,
    );
    if (attempts && attempts.count > TWO_FACTOR_ACCOUNT_THROTTLE.limit) {
      throw new TooManyRequestsException();
    }

    if (creds.code) {
      if (
        !user.twoFactorSecret ||
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
    await resetHits(attemptsKey);
  }

  // Un code TOTP ne sert qu'une fois par compte : intercepté, il ne se rejoue pas dans sa fenêtre.
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
    const ok = await this.verifyCurrentPassword(user, currentPassword);
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
    const ok = await this.verifyCurrentPassword(user, password);
    if (!ok) throw new UnauthorizedException('Invalid password');
    await this.users.disableTwoFactor(user.id);
  }

  // Compté avant de vérifier, par compte : des essais simultanés ou venus de plusieurs adresses ne passent pas sous la limite.
  private async verifyCurrentPassword(
    user: User,
    plainPassword: string,
  ): Promise<boolean> {
    const attemptsKey = `reauth|${user.id}`;
    const at = this.now();
    const attempts = await countHit(
      attemptsKey,
      REAUTH_ACCOUNT_THROTTLE.ttlMs,
      at,
    );
    if (attempts && attempts.count > REAUTH_ACCOUNT_THROTTLE.limit) {
      throw new TooManyRequestsException(
        Math.max(1, Math.ceil((attempts.resetAt - at) / 1000)),
      );
    }
    const ok = await this.password.verify(plainPassword, user.passwordHash);
    if (ok) await resetHits(attemptsKey);
    return ok;
  }
}
