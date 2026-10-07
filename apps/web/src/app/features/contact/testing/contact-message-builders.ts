import type { ContactMessage } from '../domain/models/contact-message.model';

export function makeContactMessage(overrides: Partial<ContactMessage> = {}): ContactMessage {
  return {
    id: 1,
    name: 'Alice',
    email: 'alice@example.com',
    subject: 'Bonjour',
    message: 'Un message',
    createdAt: '2026-01-01T10:00:00Z',
    read: false,
    ...overrides,
  };
}
