import {
  UnauthorizedException,
  BadRequestException,
  TooManyRequestsException,
} from '../common/http-errors';
import { MemoryThrottleStore, setThrottleStore } from '../common/throttle';
import {
  CHALLENGE_AUDIENCE,
  SESSION_AUDIENCE,
  type JwtService,
} from './jwt.service';
import {
  AuthService,
  type AuthTwoFactor,
  type AuthUsers,
} from './auth.service';
import type { PasswordService } from './password.service';
import type { LoginJournalService, LoginOrigin } from './login-journal.service';
import type { User } from '../database/schema';

describe('AuthService', () => {
  let service: AuthService;
  let users: jest.Mocked<AuthUsers>;
  let password: jest.Mocked<Pick<PasswordService, 'hash' | 'verify'>>;
  let twoFactor: jest.Mocked<AuthTwoFactor>;
  let jwt: jest.Mocked<Pick<JwtService, 'sign' | 'verify'>>;
  let journal: jest.Mocked<Pick<LoginJournalService, 'record'>>;
  let now: number;

  const ORIGIN: LoginOrigin = { userAgent: 'Mozilla/5.0 test', country: 'FR' };

  const mkUser = (overrides: Partial<User> = {}): User => ({
    id: 'user-123',
    email: 'admin@example.com',
    passwordHash: '$argon2id$...',
    isTwoFactorEnabled: false,
    twoFactorSecret: null,
    pendingTwoFactorSecret: null,
    twoFactorBackupCodesHash: null,
    tokenVersion: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });

  beforeEach(() => {
    setThrottleStore(new MemoryThrottleStore());
    now = 1_000_000;
    users = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      updatePassword: jest.fn(),
      updateTwoFactorSecret: jest.fn(),
      updatePendingTwoFactorSecret: jest.fn(),
      enableTwoFactor: jest.fn(),
      rotateTwoFactor: jest.fn(),
      disableTwoFactor: jest.fn(),
      consumeBackupCode: jest.fn(),
      revokeSessions: jest.fn(),
    };
    password = {
      hash: jest.fn(),
      verify: jest.fn(),
    };
    twoFactor = {
      generateSecret: jest.fn(),
      generateQrCodeDataUrl: jest.fn(),
      verifyTotpCode: jest.fn(),
      generateBackupCodes: jest.fn(),
      hashBackupCodes: jest.fn(),
      findMatchingBackupCode: jest.fn(),
    };
    jwt = {
      sign: jest.fn(),
      verify: jest.fn(),
    };
    journal = { record: jest.fn().mockResolvedValue(undefined) };
    service = new AuthService(
      users,
      password,
      twoFactor,
      jwt,
      journal,
      () => now,
    );
  });

  describe('login', () => {
    it('retourne un token quand credentials valides et 2FA disabled', async () => {
      const user = mkUser();
      users.findByEmail.mockResolvedValue(user);
      password.verify.mockResolvedValue(true);
      jwt.sign.mockReturnValue('jwt-token-final');

      const result = await service.login(
        'admin@example.com',
        'good-password',
        ORIGIN,
      );
      expect(result).toEqual({
        kind: 'authenticated',
        token: 'jwt-token-final',
        user: { id: user.id, email: user.email, isTwoFactorEnabled: false },
      });
      expect(jwt.sign).toHaveBeenCalledWith(SESSION_AUDIENCE, {
        sub: user.id,
        tokenVersion: user.tokenVersion,
      });
    });

    it('retourne un challengeToken quand 2FA enabled', async () => {
      const user = mkUser({
        isTwoFactorEnabled: true,
        twoFactorSecret: 'SECRET',
      });
      users.findByEmail.mockResolvedValue(user);
      password.verify.mockResolvedValue(true);
      jwt.sign.mockReturnValue('challenge-token');

      const result = await service.login(
        'admin@example.com',
        'good-password',
        ORIGIN,
      );
      expect(result).toEqual({
        kind: 'challenge',
        challengeToken: 'challenge-token',
      });
      expect(jwt.sign).toHaveBeenCalledWith(
        CHALLENGE_AUDIENCE,
        { sub: user.id, scope: '2fa-challenge' },
        { expiresIn: '5m' },
      );
    });

    it('throw UnauthorizedException si user inconnu', async () => {
      users.findByEmail.mockResolvedValue(null);
      await expect(
        service.login('nope@example.com', 'pw', ORIGIN),
      ).rejects.toThrow(UnauthorizedException);
    });

    it("vérifie quand même un mot de passe si l'utilisateur est inconnu : la durée ne trahit pas le compte", async () => {
      users.findByEmail.mockResolvedValue(null);
      password.hash.mockResolvedValue('$argon2id$decoy');
      password.verify.mockResolvedValue(false);

      await expect(
        service.login('nope@example.com', 'pw', ORIGIN),
      ).rejects.toThrow(UnauthorizedException);

      expect(password.verify).toHaveBeenCalledWith('pw', '$argon2id$decoy');
    });

    it('throw UnauthorizedException si password incorrect', async () => {
      users.findByEmail.mockResolvedValue(mkUser());
      password.verify.mockResolvedValue(false);
      await expect(
        service.login('admin@example.com', 'bad', ORIGIN),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('verifyTwoFactor', () => {
    it('accepte un code TOTP valide et retourne le token final', async () => {
      const user = mkUser({
        isTwoFactorEnabled: true,
        twoFactorSecret: 'SECRET',
        twoFactorBackupCodesHash: ['h1', 'h2'],
      });
      jwt.verify.mockReturnValue({ sub: user.id, scope: '2fa-challenge' });
      users.findById.mockResolvedValue(user);
      twoFactor.verifyTotpCode.mockReturnValue(true);
      jwt.sign.mockReturnValue('final-token');

      const result = await service.verifyTwoFactor(
        'challenge',
        {
          code: '123456',
        },
        ORIGIN,
      );
      expect(result).toEqual({
        token: 'final-token',
        user: { id: user.id, email: user.email, isTwoFactorEnabled: true },
      });
      expect(twoFactor.verifyTotpCode).toHaveBeenCalledWith('SECRET', '123456');
      expect(users.consumeBackupCode).not.toHaveBeenCalled();
      expect(jwt.verify).toHaveBeenCalledWith(CHALLENGE_AUDIENCE, 'challenge');
      expect(jwt.sign).toHaveBeenCalledWith(SESSION_AUDIENCE, {
        sub: user.id,
        tokenVersion: user.tokenVersion,
      });
    });

    it('accepte un backup code valide, le consomme, retourne le token final', async () => {
      const user = mkUser({
        isTwoFactorEnabled: true,
        twoFactorSecret: 'SECRET',
        twoFactorBackupCodesHash: ['h1', 'h2', 'h3'],
      });
      jwt.verify.mockReturnValue({ sub: user.id, scope: '2fa-challenge' });
      users.findById.mockResolvedValue(user);
      twoFactor.findMatchingBackupCode.mockResolvedValue('h2');
      jwt.sign.mockReturnValue('final-token');

      const result = await service.verifyTwoFactor(
        'challenge',
        {
          backupCode: 'a1b2-c3d4',
        },
        ORIGIN,
      );
      expect(result.token).toBe('final-token');
      expect(users.consumeBackupCode).toHaveBeenCalledWith(user.id, 'h2');
    });

    it('throw UnauthorizedException si challengeToken sans bon scope', async () => {
      jwt.verify.mockReturnValue({ sub: 'user-123' }); // pas de scope
      await expect(
        service.verifyTwoFactor('bad', { code: '123456' }, ORIGIN),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throw UnauthorizedException si code TOTP invalide', async () => {
      const user = mkUser({
        isTwoFactorEnabled: true,
        twoFactorSecret: 'SECRET',
      });
      jwt.verify.mockReturnValue({ sub: user.id, scope: '2fa-challenge' });
      users.findById.mockResolvedValue(user);
      twoFactor.verifyTotpCode.mockReturnValue(false);
      await expect(
        service.verifyTwoFactor('challenge', { code: '000000' }, ORIGIN),
      ).rejects.toThrow(UnauthorizedException);
    });

    const aChallengedUser = (): User => {
      const user = mkUser({
        isTwoFactorEnabled: true,
        twoFactorSecret: 'SECRET',
      });
      jwt.verify.mockReturnValue({ sub: user.id, scope: '2fa-challenge' });
      users.findById.mockResolvedValue(user);
      return user;
    };

    it('refuse un code TOTP déjà accepté pour ce compte (rejeu)', async () => {
      aChallengedUser();
      twoFactor.verifyTotpCode.mockReturnValue(true);
      jwt.sign.mockReturnValue('final-token');
      await service.verifyTwoFactor('challenge', { code: '123456' }, ORIGIN);

      await expect(
        service.verifyTwoFactor('challenge', { code: '123456' }, ORIGIN),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('verrouille le compte après 5 essais, quelle que soit leur adresse IP', async () => {
      aChallengedUser();
      twoFactor.verifyTotpCode.mockReturnValue(false);
      for (let attempt = 0; attempt < 5; attempt += 1) {
        await expect(
          service.verifyTwoFactor('challenge', { code: '000000' }, ORIGIN),
        ).rejects.toThrow(UnauthorizedException);
      }

      twoFactor.verifyTotpCode.mockReturnValue(true);
      await expect(
        service.verifyTwoFactor('challenge', { code: '123456' }, ORIGIN),
      ).rejects.toThrow(TooManyRequestsException);
    });

    it('ne compte que les échecs : une vérification réussie remet le compteur du compte à zéro', async () => {
      aChallengedUser();
      jwt.sign.mockReturnValue('final-token');
      const fail = async () => {
        twoFactor.verifyTotpCode.mockReturnValue(false);
        await expect(
          service.verifyTwoFactor('challenge', { code: '000000' }, ORIGIN),
        ).rejects.toThrow(UnauthorizedException);
      };
      for (let attempt = 0; attempt < 4; attempt += 1) await fail();
      twoFactor.verifyTotpCode.mockReturnValue(true);
      await service.verifyTwoFactor('challenge', { code: '123456' }, ORIGIN);

      for (let attempt = 0; attempt < 4; attempt += 1) await fail();
    });

    it('throw UnauthorizedException si backup code ne matche aucun hash', async () => {
      const user = mkUser({
        isTwoFactorEnabled: true,
        twoFactorSecret: 'SECRET',
        twoFactorBackupCodesHash: ['h1'],
      });
      jwt.verify.mockReturnValue({ sub: user.id, scope: '2fa-challenge' });
      users.findById.mockResolvedValue(user);
      twoFactor.findMatchingBackupCode.mockResolvedValue(null);
      await expect(
        service.verifyTwoFactor(
          'challenge',
          { backupCode: 'zzzz-zzzz' },
          ORIGIN,
        ),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('journal des connexions', () => {
    const aTwoFactorUser = (): User => {
      const user = mkUser({
        isTwoFactorEnabled: true,
        twoFactorSecret: 'SECRET',
      });
      jwt.verify.mockReturnValue({ sub: user.id, scope: '2fa-challenge' });
      users.findById.mockResolvedValue(user);
      return user;
    };

    it('Given an unknown account, When the login is refused, Then a rejected password is journaled without account', async () => {
      users.findByEmail.mockResolvedValue(null);
      password.hash.mockResolvedValue('$argon2id$decoy');
      password.verify.mockResolvedValue(false);

      await expect(
        service.login('nope@example.com', 'pw', ORIGIN),
      ).rejects.toThrow(UnauthorizedException);

      expect(journal.record.mock.calls).toEqual([
        ['password_rejected', null, ORIGIN],
      ]);
    });

    it('Given a wrong password on the admin account, When the login is refused, Then the rejected password is journaled against that account', async () => {
      const user = mkUser();
      users.findByEmail.mockResolvedValue(user);
      password.verify.mockResolvedValue(false);

      await expect(service.login(user.email, 'bad', ORIGIN)).rejects.toThrow(
        UnauthorizedException,
      );

      expect(journal.record.mock.calls).toEqual([
        ['password_rejected', user.id, ORIGIN],
      ]);
    });

    it.each([
      ['without 2FA', false],
      ['with 2FA, before the code is asked', true],
    ])(
      'Given the right password %s, When the login passes, Then an accepted password is journaled',
      async (_label, isTwoFactorEnabled) => {
        const user = mkUser({ isTwoFactorEnabled });
        users.findByEmail.mockResolvedValue(user);
        password.verify.mockResolvedValue(true);
        jwt.sign.mockReturnValue('token');

        await service.login(user.email, 'good-password', ORIGIN);

        expect(journal.record.mock.calls).toEqual([
          ['password_accepted', user.id, ORIGIN],
        ]);
      },
    );

    it('Given a valid TOTP code, When the second factor passes, Then it is journaled as accepted', async () => {
      const user = aTwoFactorUser();
      twoFactor.verifyTotpCode.mockReturnValue(true);
      jwt.sign.mockReturnValue('final-token');

      await service.verifyTwoFactor('challenge', { code: '123456' }, ORIGIN);

      expect(journal.record.mock.calls).toEqual([
        ['two_factor_accepted', user.id, ORIGIN],
      ]);
    });

    it('Given a wrong TOTP code, When the second factor is refused, Then it is journaled as rejected against the account', async () => {
      const user = aTwoFactorUser();
      twoFactor.verifyTotpCode.mockReturnValue(false);

      await expect(
        service.verifyTwoFactor('challenge', { code: '000000' }, ORIGIN),
      ).rejects.toThrow(UnauthorizedException);

      expect(journal.record.mock.calls).toEqual([
        ['two_factor_rejected', user.id, ORIGIN],
      ]);
    });

    it('Given a forged challenge token, When the second factor is refused, Then it is journaled as rejected without account', async () => {
      jwt.verify.mockImplementation(() => {
        throw new Error('jwt malformed');
      });

      await expect(
        service.verifyTwoFactor('forged', { code: '123456' }, ORIGIN),
      ).rejects.toThrow(UnauthorizedException);

      expect(journal.record.mock.calls).toEqual([
        ['two_factor_rejected', null, ORIGIN],
      ]);
    });

    it('Given the database fails while resolving the account, When the second factor errors, Then nothing is journaled as an attempt', async () => {
      jwt.verify.mockReturnValue({ sub: 'user-123', scope: '2fa-challenge' });
      users.findById.mockRejectedValue(new Error('db down'));

      await expect(
        service.verifyTwoFactor('challenge', { code: '123456' }, ORIGIN),
      ).rejects.toThrow('db down');

      expect(journal.record).not.toHaveBeenCalled();
    });
  });

  describe('quota de ré-authentification par compte', () => {
    const WINDOW_MS = 900_000;
    const twoFactorUser = () => mkUser({ isTwoFactorEnabled: true });
    const wrongChange = async (user: User) => {
      password.verify.mockResolvedValue(false);
      await expect(
        service.changePassword(user, 'bad', 'new-password-12'),
      ).rejects.toThrow(UnauthorizedException);
    };
    const wrongDisable = async (user: User) => {
      password.verify.mockResolvedValue(false);
      await expect(service.disableTwoFactor(user, 'bad')).rejects.toThrow(
        UnauthorizedException,
      );
    };

    beforeEach(() => {
      password.hash.mockResolvedValue('new-hash');
    });

    it('Given 5 wrong current passwords, When the right one comes within the quarter hour, Then changing the password gets 429 with the wait and nothing is checked', async () => {
      const user = mkUser();
      for (let attempt = 0; attempt < 5; attempt += 1) await wrongChange(user);
      password.verify.mockClear();
      password.verify.mockResolvedValue(true);
      now += 60_000;

      const refused = service.changePassword(user, 'good', 'new-password-12');

      await expect(refused).rejects.toThrow(TooManyRequestsException);
      await expect(refused).rejects.toMatchObject({ retryAfterSeconds: 840 });
      expect(password.verify).not.toHaveBeenCalled();
      expect(users.updatePassword).not.toHaveBeenCalled();
    });

    it('Given wrong passwords split between both routes, When the 6th comes on disabling 2FA, Then it gets 429: one counter per account', async () => {
      const user = twoFactorUser();
      for (let attempt = 0; attempt < 3; attempt += 1) await wrongChange(user);
      for (let attempt = 0; attempt < 2; attempt += 1) await wrongDisable(user);
      password.verify.mockResolvedValue(true);

      await expect(service.disableTwoFactor(user, 'good')).rejects.toThrow(
        TooManyRequestsException,
      );
      expect(users.disableTwoFactor).not.toHaveBeenCalled();
    });

    it('Given a locked account, When the quarter hour has passed, Then the right password is accepted again', async () => {
      const user = mkUser();
      for (let attempt = 0; attempt < 5; attempt += 1) await wrongChange(user);
      password.verify.mockResolvedValue(true);
      now += WINDOW_MS - 1;
      await expect(
        service.changePassword(user, 'good', 'new-password-12'),
      ).rejects.toThrow(TooManyRequestsException);

      now += 1;
      await service.changePassword(user, 'good', 'new-password-12');

      expect(users.updatePassword).toHaveBeenCalledWith(user.id, 'new-hash');
    });

    it('Given 4 wrong passwords then the right one, When 4 more wrong ones follow, Then none is locked out: a success clears the counter', async () => {
      const user = mkUser();
      for (let attempt = 0; attempt < 4; attempt += 1) await wrongChange(user);
      password.verify.mockResolvedValue(true);
      await service.changePassword(user, 'good', 'new-password-12');

      for (let attempt = 0; attempt < 4; attempt += 1) await wrongChange(user);
    });

    it('Given a locked account, When another account re-authenticates, Then it keeps its own quota', async () => {
      const locked = mkUser();
      for (let attempt = 0; attempt < 5; attempt += 1)
        await wrongChange(locked);

      await wrongChange(mkUser({ id: 'user-456' }));
    });

    it('Given 5 wrong passwords at re-authentication, When the account logs in, Then the login is not locked', async () => {
      const user = mkUser();
      for (let attempt = 0; attempt < 5; attempt += 1) await wrongChange(user);
      users.findByEmail.mockResolvedValue(user);
      password.verify.mockResolvedValue(true);
      jwt.sign.mockReturnValue('token');

      await expect(
        service.login(user.email, 'good-password', ORIGIN),
      ).resolves.toMatchObject({ kind: 'authenticated' });
    });
  });

  describe('changePassword', () => {
    it('met à jour le password si currentPassword est valide', async () => {
      const user = mkUser();
      password.verify.mockResolvedValue(true);
      password.hash.mockResolvedValue('new-hash');
      await service.changePassword(user, 'old', 'new-password-12');
      expect(password.hash).toHaveBeenCalledWith('new-password-12');
      expect(users.updatePassword).toHaveBeenCalledWith(user.id, 'new-hash');
    });

    it('throw UnauthorizedException si currentPassword invalide', async () => {
      const user = mkUser();
      password.verify.mockResolvedValue(false);
      await expect(
        service.changePassword(user, 'wrong', 'new'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('generateTwoFactorSecret', () => {
    // Reconfiguration : le nouveau secret attend sa confirmation, l'application actuelle reste valable.
    it('Given 2FA enabled, When a secret is generated, Then it is kept pending and the active secret is untouched', async () => {
      const user = mkUser({
        isTwoFactorEnabled: true,
        twoFactorSecret: 'ACTIVE',
      });
      twoFactor.generateSecret.mockReturnValue('NEXT-SECRET');
      twoFactor.generateQrCodeDataUrl.mockResolvedValue(
        'data:image/png;base64,NEXT',
      );

      const result = await service.generateTwoFactorSecret(user);

      expect(result).toEqual({
        secret: 'NEXT-SECRET',
        qrCodeDataUrl: 'data:image/png;base64,NEXT',
      });
      expect(users.updatePendingTwoFactorSecret).toHaveBeenCalledWith(
        user.id,
        'NEXT-SECRET',
      );
      expect(users.updateTwoFactorSecret).not.toHaveBeenCalled();
    });

    it('génère secret + QR code et persiste', async () => {
      const user = mkUser();
      twoFactor.generateSecret.mockReturnValue('NEW-SECRET');
      twoFactor.generateQrCodeDataUrl.mockResolvedValue(
        'data:image/png;base64,XYZ',
      );
      const result = await service.generateTwoFactorSecret(user);
      expect(result).toEqual({
        secret: 'NEW-SECRET',
        qrCodeDataUrl: 'data:image/png;base64,XYZ',
      });
      expect(users.updateTwoFactorSecret).toHaveBeenCalledWith(
        user.id,
        'NEW-SECRET',
      );
    });
  });

  describe('enableTwoFactor', () => {
    const pendingUser = (overrides: Partial<User> = {}) =>
      mkUser({ twoFactorSecret: 'SECRET', ...overrides });

    beforeEach(() => {
      password.verify.mockResolvedValue(true);
      twoFactor.verifyTotpCode.mockReturnValue(true);
      twoFactor.generateBackupCodes.mockReturnValue(['a1b2-c3d4', 'e5f6-g7h8']);
      twoFactor.hashBackupCodes.mockResolvedValue(['hash1', 'hash2']);
    });

    it('throw BadRequestException si pas de secret en attente', async () => {
      const user = mkUser({ twoFactorSecret: null });
      await expect(
        service.enableTwoFactor(user, 'good', '123456'),
      ).rejects.toThrow(BadRequestException);
    });

    it('throw UnauthorizedException si code invalide', async () => {
      twoFactor.verifyTotpCode.mockReturnValue(false);
      await expect(
        service.enableTwoFactor(pendingUser(), 'good', '000000'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('génère + hash backup codes et active 2FA si mot de passe et code valides', async () => {
      const user = pendingUser();

      const result = await service.enableTwoFactor(user, 'good', '123456');

      expect(result).toEqual({ backupCodes: ['a1b2-c3d4', 'e5f6-g7h8'] });
      expect(users.enableTwoFactor).toHaveBeenCalledWith(user.id, [
        'hash1',
        'hash2',
      ]);
    });

    // Une session volée ne doit pas lier son propre authentificateur : le mot de passe est exigé,
    // comme pour désactiver la 2FA ou changer de mot de passe.
    it('Given a wrong password, When enabling 2FA, Then it gets 401 and the second factor is not bound', async () => {
      password.verify.mockResolvedValue(false);

      await expect(
        service.enableTwoFactor(pendingUser(), 'bad', '123456'),
      ).rejects.toThrow(UnauthorizedException);
      expect(users.enableTwoFactor).not.toHaveBeenCalled();
    });

    it('Given 2FA already enabled, When enabling again, Then it gets 400 and the backup codes are not replaced', async () => {
      await expect(
        service.enableTwoFactor(
          pendingUser({ isTwoFactorEnabled: true }),
          'good',
          '123456',
        ),
      ).rejects.toThrow(BadRequestException);
      expect(users.enableTwoFactor).not.toHaveBeenCalled();
    });

    describe('when 2FA is already enabled (reconfiguration)', () => {
      const reconfiguring = (overrides: Partial<User> = {}) =>
        mkUser({
          isTwoFactorEnabled: true,
          twoFactorSecret: 'ACTIVE',
          pendingTwoFactorSecret: 'NEXT',
          ...overrides,
        });

      it('Given a pending secret, When the password and a code of the new app are valid, Then the secret rotates with new backup codes', async () => {
        const user = reconfiguring();

        const result = await service.enableTwoFactor(user, 'good', '123456');

        expect(result).toEqual({ backupCodes: ['a1b2-c3d4', 'e5f6-g7h8'] });
        expect(twoFactor.verifyTotpCode).toHaveBeenCalledWith('NEXT', '123456');
        expect(users.rotateTwoFactor).toHaveBeenCalledWith(user.id, 'NEXT', [
          'hash1',
          'hash2',
        ]);
        expect(users.enableTwoFactor).not.toHaveBeenCalled();
      });

      it('Given a code of the current app only, When confirming, Then it gets 401 and nothing rotates', async () => {
        twoFactor.verifyTotpCode.mockImplementation(
          (secret) => secret === 'ACTIVE',
        );

        await expect(
          service.enableTwoFactor(reconfiguring(), 'good', '123456'),
        ).rejects.toThrow(UnauthorizedException);
        expect(users.rotateTwoFactor).not.toHaveBeenCalled();
      });

      it('Given a wrong password, When confirming, Then it gets 401 and nothing rotates', async () => {
        password.verify.mockResolvedValue(false);

        await expect(
          service.enableTwoFactor(reconfiguring(), 'bad', '123456'),
        ).rejects.toThrow(UnauthorizedException);
        expect(users.rotateTwoFactor).not.toHaveBeenCalled();
      });
    });

    it('Given 5 wrong passwords on change-password, When enabling 2FA with the right one, Then it gets 429: same per-account counter', async () => {
      const user = pendingUser();
      password.verify.mockResolvedValue(false);
      for (let attempt = 0; attempt < 5; attempt += 1) {
        await expect(
          service.changePassword(user, 'bad', 'new-password-12'),
        ).rejects.toThrow(UnauthorizedException);
      }
      password.verify.mockResolvedValue(true);

      await expect(
        service.enableTwoFactor(user, 'good', '123456'),
      ).rejects.toThrow(TooManyRequestsException);
      expect(users.enableTwoFactor).not.toHaveBeenCalled();
    });
  });

  describe('disableTwoFactor', () => {
    it('throw BadRequestException si pas enabled', async () => {
      const user = mkUser({ isTwoFactorEnabled: false });
      await expect(service.disableTwoFactor(user, 'pw')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throw UnauthorizedException si password invalide', async () => {
      const user = mkUser({ isTwoFactorEnabled: true });
      password.verify.mockResolvedValue(false);
      await expect(service.disableTwoFactor(user, 'bad')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('reset 2FA si password valide', async () => {
      const user = mkUser({ isTwoFactorEnabled: true });
      password.verify.mockResolvedValue(true);
      await service.disableTwoFactor(user, 'good');
      expect(users.disableTwoFactor).toHaveBeenCalledWith(user.id);
    });
  });

  describe('revokeSessionFromToken', () => {
    it('incrémente tokenVersion pour le sub du JWT de session', async () => {
      jwt.verify.mockReturnValue({ sub: 'u1', tokenVersion: 3 });
      await service.revokeSessionFromToken('valid.jwt');
      expect(users.revokeSessions).toHaveBeenCalledWith('u1');
      expect(jwt.verify).toHaveBeenCalledWith(SESSION_AUDIENCE, 'valid.jwt');
    });

    it.each<[string | undefined, string]>([
      [undefined, 'cookie absent'],
      ['', 'cookie vide'],
    ])('token %s (%s) → aucune révocation', async (token) => {
      await service.revokeSessionFromToken(token);
      expect(jwt.verify).not.toHaveBeenCalled();
      expect(users.revokeSessions).not.toHaveBeenCalled();
    });

    it('JWT invalide ou expiré → ignoré sans throw', async () => {
      jwt.verify.mockImplementation(() => {
        throw new Error('jwt expired');
      });
      await expect(
        service.revokeSessionFromToken('stale.jwt'),
      ).resolves.toBeUndefined();
      expect(users.revokeSessions).not.toHaveBeenCalled();
    });

    it('challenge 2FA → jamais révoqué', async () => {
      jwt.verify.mockReturnValue({ sub: 'u1', scope: '2fa-challenge' });
      await service.revokeSessionFromToken('challenge.jwt');
      expect(users.revokeSessions).not.toHaveBeenCalled();
    });
  });
});
