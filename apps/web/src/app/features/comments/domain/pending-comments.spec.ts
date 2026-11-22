import {
  makePendingComment,
  makePublishedComment,
  makePublishedReply,
  makePublishedThread,
} from '../testing/comment-builders';
import { PENDING_COMMENT_TTL_MS, parsePendingComments, withoutPublished } from './pending-comments';

const NOW = Date.parse('2026-11-22T12:00:00.000Z');

describe('parsePendingComments', () => {
  it('Given stored entries When they are read Then each keeps its id, name, text, parent and date only', () => {
    const stored: unknown = [
      { ...makePendingComment({ id: 'p-1' }), email: 'lou@example.test', extra: true },
      makePendingComment({ id: 'p-2', parentId: 'c-1' }),
    ];

    expect(parsePendingComments(stored, NOW)).toEqual([
      makePendingComment({ id: 'p-1' }),
      makePendingComment({ id: 'p-2', parentId: 'c-1' }),
    ]);
  });

  it.each([
    { name: 'not a list', stored: { id: 'p-1' } },
    { name: 'null', stored: null },
    { name: 'a string', stored: 'p-1' },
  ])('Given $name When it is read Then nothing is pending', ({ stored }) => {
    expect(parsePendingComments(stored, NOW)).toEqual([]);
  });

  it.each([
    { name: 'a missing id', entry: { ...makePendingComment(), id: undefined } },
    { name: 'a numeric name', entry: { ...makePendingComment(), name: 42 } },
    { name: 'a missing text', entry: { ...makePendingComment(), body: undefined } },
    { name: 'a parent that is not text', entry: { ...makePendingComment(), parentId: 7 } },
    { name: 'a date that is no date', entry: { ...makePendingComment(), createdAt: 'hier' } },
    {
      name: 'a date in the future',
      entry: makePendingComment({ createdAt: '2026-11-23T12:00:00.000Z' }),
    },
    { name: 'a primitive', entry: 'p-1' },
  ])('Given an entry with $name When it is read Then that entry alone is dropped', ({ entry }) => {
    const kept = makePendingComment({ id: 'p-ok' });

    expect(parsePendingComments([entry, kept], NOW)).toEqual([kept]);
  });

  it('Given an entry older than the waiting delay When it is read Then it is dropped, a younger one stays', () => {
    const expired = makePendingComment({
      id: 'p-old',
      createdAt: new Date(NOW - PENDING_COMMENT_TTL_MS - 1).toISOString(),
    });
    const fresh = makePendingComment({
      id: 'p-new',
      createdAt: new Date(NOW - PENDING_COMMENT_TTL_MS + 1).toISOString(),
    });

    expect(parsePendingComments([expired, fresh], NOW).map(({ id }) => id)).toEqual(['p-new']);
  });
});

describe('withoutPublished', () => {
  it('Given pending entries When the thread now publishes some of them, as comment or reply Then only the others stay', () => {
    const thread = makePublishedThread({
      comments: [makePublishedComment({ id: 'p-1', replies: [makePublishedReply({ id: 'p-2' })] })],
    });
    const pending = [
      makePendingComment({ id: 'p-1' }),
      makePendingComment({ id: 'p-2', parentId: 'p-1' }),
      makePendingComment({ id: 'p-3' }),
    ];

    expect(withoutPublished(pending, thread).map(({ id }) => id)).toEqual(['p-3']);
  });

  it('Given nothing published yet When the thread is read Then the same list comes back', () => {
    const pending = [makePendingComment()];

    expect(withoutPublished(pending, makePublishedThread())).toBe(pending);
  });
});
