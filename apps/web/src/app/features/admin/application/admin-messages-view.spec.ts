import type { ContactMessage } from '@features/contact/domain/models/contact-message.model';
import { makeContactMessage } from '@features/contact/testing/contact-message-builders';
import { receivedAgo, toAdminMessagesView, type AdminMessagesFilter } from './admin-messages-view';

const INBOX: readonly ContactMessage[] = [
  makeContactMessage({ id: 1, read: true, createdAt: '2026-10-01T10:00:00Z' }),
  makeContactMessage({ id: 2, read: false, createdAt: '2026-10-06T10:00:00Z' }),
  makeContactMessage({ id: 3, read: false, createdAt: '2026-09-20T10:00:00Z' }),
  makeContactMessage({ id: 4, read: true, createdAt: '2026-10-07T08:00:00Z' }),
];

describe('toAdminMessagesView', () => {
  it.each<AdminMessagesFilter>(['all', 'unread', 'read'])(
    'Given two unread and two read messages When the %s filter is active Then the filters count the whole inbox',
    (filter) => {
      expect(toAdminMessagesView(INBOX, filter).filters).toEqual([
        { value: 'all', label: 'Tous', count: 4, disabled: false },
        { value: 'unread', label: 'Non lus', count: 2, disabled: false },
        { value: 'read', label: 'Lus', count: 2, disabled: false },
      ]);
    },
  );

  it.each([
    { case: 'an empty inbox', messages: [], disabled: [true, true, true] },
    {
      case: 'an inbox read through',
      messages: [makeContactMessage({ id: 1, read: true })],
      disabled: [false, true, false],
    },
    {
      case: 'an inbox never opened',
      messages: [makeContactMessage({ id: 1, read: false })],
      disabled: [false, false, true],
    },
  ])(
    'Given $case When the view is built Then a filter at zero is inactive',
    ({ messages, disabled }) => {
      expect(toAdminMessagesView(messages, 'all').filters.map((option) => option.disabled)).toEqual(
        disabled,
      );
    },
  );

  it.each<{ filter: AdminMessagesFilter; ids: readonly number[] }>([
    { filter: 'all', ids: [4, 2, 1, 3] },
    { filter: 'unread', ids: [2, 3] },
    { filter: 'read', ids: [4, 1] },
  ])(
    'Given an inbox in any order When the $filter filter is active Then the rows are its messages, newest first',
    ({ filter, ids }) => {
      expect(toAdminMessagesView(INBOX, filter).rows.map((message) => message.id)).toEqual(ids);
    },
  );

  it('Given two messages received at the same time When the view is built Then they keep the inbox order', () => {
    const sameTime = '2026-10-06T10:00:00Z';
    const messages = [
      makeContactMessage({ id: 7, createdAt: sameTime }),
      makeContactMessage({ id: 5, createdAt: sameTime }),
      makeContactMessage({ id: 6, createdAt: '2026-10-07T10:00:00Z' }),
    ];

    expect(toAdminMessagesView(messages, 'all').rows.map((message) => message.id)).toEqual([
      6, 7, 5,
    ]);
  });

  it('Given the inbox When the view is built Then the inbox itself is left in its order', () => {
    const messages = [...INBOX];

    toAdminMessagesView(messages, 'all');

    expect(messages.map((message) => message.id)).toEqual([1, 2, 3, 4]);
  });

  it.each([
    { messages: INBOX, unread: 2 },
    { messages: [], unread: 0 },
    { messages: [makeContactMessage({ read: true })], unread: 0 },
  ])(
    'Given an inbox When the view is built Then it counts $unread unread whatever the filter',
    ({ messages, unread }) => {
      expect(toAdminMessagesView(messages, 'read').unread).toBe(unread);
    },
  );
});

describe('receivedAgo', () => {
  const NOW = new Date('2026-10-07T10:00:00Z');

  it.each([
    { createdAt: '2026-10-07T09:59:30Z', ago: "à l'instant" },
    { createdAt: '2026-10-07T10:05:00Z', ago: "à l'instant" },
    { createdAt: '2026-10-07T09:59:00Z', ago: 'il y a 1\u00a0min' },
    { createdAt: '2026-10-07T09:01:00Z', ago: 'il y a 59\u00a0min' },
    { createdAt: '2026-10-07T08:00:00Z', ago: 'il y a 2\u00a0h' },
    { createdAt: '2026-10-06T10:01:00Z', ago: 'il y a 23\u00a0h' },
    { createdAt: '2026-10-06T10:00:00Z', ago: 'il y a 1 jour' },
    { createdAt: '2026-10-01T10:00:00Z', ago: 'il y a 6 jours' },
    { createdAt: '2026-09-30T10:00:00Z', ago: '30 sept. 2026' },
    { createdAt: '2026-09-01T12:00:00Z', ago: '1er sept. 2026' },
  ])(
    'Given a message received at $createdAt When it is dated Then it reads « $ago »',
    ({ createdAt, ago }) => {
      expect(receivedAgo(createdAt, NOW)).toBe(ago);
    },
  );
});
