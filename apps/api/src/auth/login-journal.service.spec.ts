import { loginEvent } from '../database/schema';
import { asDatabase } from '../testing/mock-database';
import { createMockDb } from '../testing/test-utils';
import {
  LoginJournalService,
  loginEventCutoff,
  type LoginOrigin,
} from './login-journal.service';

describe('LoginJournalService', () => {
  let db: ReturnType<typeof createMockDb>;
  let service: LoginJournalService;

  const ORIGIN: LoginOrigin = {
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    country: 'FR',
  };

  beforeEach(() => {
    db = createMockDb();
    service = new LoginJournalService(asDatabase(db));
  });

  describe('record', () => {
    it('Given a rejected password for a known account, When recorded, Then one row keeps the step, the account, the country and the browser, and nothing else about the origin', async () => {
      db.values.mockResolvedValueOnce(undefined);

      await service.record('password_rejected', 'user-123', ORIGIN);

      expect(db.insert).toHaveBeenCalledWith(loginEvent);
      expect(db.values).toHaveBeenCalledWith({
        kind: 'password_rejected',
        userId: 'user-123',
        browser: 'Chrome 120.0.0.0',
        os: 'Windows 10',
        country: 'FR',
      });
    });

    it('Given an unknown account and an unreadable origin, When recorded, Then the row holds nulls rather than guesses', async () => {
      db.values.mockResolvedValueOnce(undefined);

      await service.record('password_rejected', null, {
        userAgent: '',
        country: null,
      });

      expect(db.values).toHaveBeenCalledWith({
        kind: 'password_rejected',
        userId: null,
        browser: null,
        os: null,
        country: null,
      });
    });

    it('Given the database is down, When recorded, Then the failure does not reach the login', async () => {
      db.values.mockRejectedValueOnce(new Error('db down'));

      await expect(
        service.record('password_accepted', 'user-123', ORIGIN),
      ).resolves.toBeUndefined();
    });
  });

  describe('findAll', () => {
    it('Given page 2 of 20, When listed, Then the page and the total come back together', async () => {
      const rows = [{ id: 'event-1', kind: 'password_accepted' }];
      db.from.mockResolvedValueOnce([{ count: 41 }]);
      db.offset.mockResolvedValueOnce(rows);

      const result = await service.findAll({ page: 2, limit: 20, offset: 20 });

      expect(result).toEqual({ data: rows, total: 41, page: 2, limit: 20 });
      expect(db.limit).toHaveBeenCalledWith(20);
      expect(db.offset).toHaveBeenCalledWith(20);
    });
  });

  describe('purgeExpired', () => {
    it('Given the daily task, When purging, Then only the login journal is deleted from', async () => {
      db.where.mockResolvedValueOnce(undefined);

      await service.purgeExpired(new Date('2026-11-19T12:00:00.000Z'));

      expect(db.delete).toHaveBeenCalledTimes(1);
      expect(db.delete).toHaveBeenCalledWith(loginEvent);
    });

    it('keeps 90 days of journal', () => {
      expect(loginEventCutoff(new Date('2026-11-19T12:00:00.000Z'))).toEqual(
        new Date('2026-08-21T12:00:00.000Z'),
      );
    });
  });
});
