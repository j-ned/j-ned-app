import type { ContactMessage } from '../models/contact-message.model';
import { filterMessagesByReadStatus } from './filter-messages-by-read-status.use-case';

function makeMessage(id: number, read: boolean): ContactMessage {
  return {
    id,
    name: `Sender ${id}`,
    email: `sender${id}@example.com`,
    subject: `Subject ${id}`,
    message: `Message ${id}`,
    createdAt: '2026-06-23T10:00:00.000Z',
    read,
  };
}

describe('filterMessagesByReadStatus', () => {
  const messages: readonly ContactMessage[] = [
    makeMessage(1, true),
    makeMessage(2, false),
    makeMessage(3, true),
    makeMessage(4, false),
  ];

  describe('Given the status is true (read only)', () => {
    it('When filtering, Then only read messages are returned', () => {
      const result = filterMessagesByReadStatus(messages, true);
      expect(result).toHaveLength(2);
      expect(result.every((m) => m.read === true)).toBe(true);
      expect(result.map((m) => m.id)).toEqual([1, 3]);
    });
  });

  describe('Given the status is false (unread only)', () => {
    it('When filtering, Then only unread messages are returned', () => {
      const result = filterMessagesByReadStatus(messages, false);
      expect(result).toHaveLength(2);
      expect(result.every((m) => m.read === false)).toBe(true);
      expect(result.map((m) => m.id)).toEqual([2, 4]);
    });
  });

  describe("Given the status is 'all'", () => {
    it('When filtering, Then all messages are returned by unchanged reference', () => {
      const result = filterMessagesByReadStatus(messages, 'all');
      expect(result).toBe(messages);
      expect(result).toHaveLength(4);
    });
  });

  describe('Given an empty message list', () => {
    it.each([
      { status: true as const, label: 'true' },
      { status: false as const, label: 'false' },
      { status: 'all' as const, label: "'all'" },
    ])('When filtering by $label, Then an empty list is returned', ({ status }) => {
      expect(filterMessagesByReadStatus([], status)).toEqual([]);
    });
  });

  describe('Given any read-status filter', () => {
    it('When filtering, Then the input array is not mutated', () => {
      const input: readonly ContactMessage[] = [makeMessage(1, true), makeMessage(2, false)];
      const snapshot = [...input];

      filterMessagesByReadStatus(input, true);
      filterMessagesByReadStatus(input, false);
      filterMessagesByReadStatus(input, 'all');

      expect(input).toEqual(snapshot);
      expect(input).toHaveLength(2);
    });
  });
});
