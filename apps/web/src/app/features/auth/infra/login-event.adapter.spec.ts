import { toLoginEvent } from './login-event.adapter';
import type { LoginEventDto } from './login-event.types';

const dto = (overrides: Partial<LoginEventDto> = {}): LoginEventDto => ({
  id: 'event-1',
  kind: 'password_accepted',
  userId: 'user-1',
  browser: 'Firefox 128.0',
  os: 'Linux x86_64',
  country: 'FR',
  createdAt: '2026-11-19T18:42:00.000Z',
  ...overrides,
});

describe('toLoginEvent', () => {
  it.each([
    ['password_accepted'],
    ['password_rejected'],
    ['two_factor_accepted'],
    ['two_factor_rejected'],
  ])('Given the known step %s When adapted Then the event is kept as sent', (kind) => {
    expect(toLoginEvent(dto({ kind }))).toEqual(dto({ kind }));
  });

  it.each([['passkey_accepted'], ['']])(
    'Given the step "%s" the front does not know yet When adapted Then it becomes an unknown step, the rest untouched',
    (kind) => {
      expect(toLoginEvent(dto({ kind, userId: null }))).toEqual({
        ...dto({ userId: null }),
        kind: 'unknown',
      });
    },
  );
});
