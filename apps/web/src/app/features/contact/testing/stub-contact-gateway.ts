import { of } from 'rxjs';
import type { ContactGateway } from '../domain/gateways/contact.gateway';
import type { ContactMessage } from '../domain/models/contact-message.model';

export function stubContactGateway(overrides: Partial<ContactGateway> = {}): ContactGateway {
  return {
    submitContactForm: () => of({ success: true, message: 'OK' }),
    getAllMessages: () => of([]),
    markMessageAsRead: () => of({} as ContactMessage),
    deleteMessage: () => of(undefined),
    getUnreadCount: () => of(0),
    invalidateUnreadCount: () => undefined,
    markAllRead: () => of({ count: 0 }),
    ...overrides,
  };
}
