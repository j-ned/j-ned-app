import type { ContactMessage } from '../models/contact-message.model';

export function filterMessagesByReadStatus(
  messages: readonly ContactMessage[],
  status: boolean | 'all',
): readonly ContactMessage[] {
  if (status === 'all') {
    return messages;
  }
  return messages.filter((m) => m.read === status);
}
