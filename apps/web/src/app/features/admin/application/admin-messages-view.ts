import type { ContactMessage } from '@features/contact/domain/models/contact-message.model';
import { filterMessagesByReadStatus } from '@features/contact/domain/use-cases/filter-messages-by-read-status.use-case';
import type { FilterOption } from '@shared/ui/filter-group';
import { pluralize } from './pluralize';
import { withFirstOfMonth } from './with-first-of-month';

export type AdminMessagesFilter = 'all' | 'unread' | 'read';

type AdminMessagesView = {
  readonly filters: readonly FilterOption<AdminMessagesFilter>[];
  readonly rows: readonly ContactMessage[];
  readonly unread: number;
};

const READ_STATUS: Record<AdminMessagesFilter, boolean | 'all'> = {
  all: 'all',
  unread: false,
  read: true,
};

const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;
const NBSP = '\u00a0';

const RECEIVED_ON = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

const receivedAt = (message: ContactMessage): number => Date.parse(message.createdAt);

export function toAdminMessagesView(
  messages: readonly ContactMessage[],
  filter: AdminMessagesFilter,
): AdminMessagesView {
  const unread = messages.filter((message) => !message.read).length;
  const counts: Record<AdminMessagesFilter, number> = {
    all: messages.length,
    unread,
    read: messages.length - unread,
  };
  const option = (
    value: AdminMessagesFilter,
    label: string,
  ): FilterOption<AdminMessagesFilter> => ({
    value,
    label,
    count: counts[value],
    disabled: counts[value] === 0,
  });
  return {
    filters: [option('all', 'Tous'), option('unread', 'Non lus'), option('read', 'Lus')],
    rows: [...filterMessagesByReadStatus(messages, READ_STATUS[filter])].sort(
      (a, b) => receivedAt(b) - receivedAt(a),
    ),
    unread,
  };
}

export function receivedAgo(createdAt: string, now: Date): string {
  const elapsed = now.getTime() - Date.parse(createdAt);
  if (elapsed < MINUTE_MS) return "à l'instant";
  if (elapsed < HOUR_MS) return `il y a ${Math.floor(elapsed / MINUTE_MS)}${NBSP}min`;
  if (elapsed < DAY_MS) return `il y a ${Math.floor(elapsed / HOUR_MS)}${NBSP}h`;
  const days = Math.floor(elapsed / DAY_MS);
  if (days < 7) return `il y a ${days} ${pluralize(days, 'jour', 'jours')}`;
  return withFirstOfMonth(RECEIVED_ON, new Date(createdAt));
}
