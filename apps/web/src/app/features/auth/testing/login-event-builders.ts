import type { LoginEvent } from '../domain/models/login-event.model';

export function makeLoginEvent(overrides: Partial<LoginEvent> = {}): LoginEvent {
  return {
    id: 'event-1',
    kind: 'password_accepted',
    userId: 'user-1',
    browser: 'Firefox 128.0',
    os: 'Linux x86_64',
    country: 'FR',
    createdAt: '2026-11-19T18:42:00.000Z',
    ...overrides,
  };
}
