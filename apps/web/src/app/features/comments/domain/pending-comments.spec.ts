import {
  makePendingComment,
  pendingId,
  makePublishedComment,
  makePublishedReply,
  makePublishedThread,
} from '../testing/comment-builders';
import { PENDING_COMMENT_TTL_MS, parsePendingComments, withoutPublished } from './pending-comments';

const NOW = Date.parse('2026-11-22T12:00:00.000Z');
const P1 = pendingId(1);
const P2 = pendingId(2);
const P3 = pendingId(3);

describe('parsePendingComments', () => {
  it('Given stored entries When they are read Then each keeps its id, name, text, parent and date only', () => {
    const stored: unknown = [
      { ...makePendingComment({ id: P1 }), email: 'lou@example.test', extra: true },
      makePendingComment({ id: P2, parentId: 'c-1' }),
    ];

    expect(parsePendingComments(stored, NOW)).toEqual([
      makePendingComment({ id: P1 }),
      makePendingComment({ id: P2, parentId: 'c-1' }),
    ]);
  });

  it.each([
    { name: 'not a list', stored: { id: P1 } },
    { name: 'null', stored: null },
    { name: 'a string', stored: P1 },
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
    { name: 'a primitive', entry: P1 },
    { name: 'an id that is not a UUID', entry: makePendingComment({ id: 'p-1' }) },
    { name: 'an id holding markup', entry: makePendingComment({ id: '<img src=x>' }) },
    { name: 'a one-letter name', entry: makePendingComment({ name: 'L' }) },
    {
      name: 'a name longer than the API allows',
      entry: makePendingComment({ name: 'x'.repeat(81) }),
    },
    { name: 'a one-letter text', entry: makePendingComment({ body: 'x' }) },
    {
      name: 'a text longer than the API allows',
      entry: makePendingComment({ body: 'x'.repeat(2001) }),
    },
  ])('Given an entry with $name When it is read Then that entry alone is dropped', ({ entry }) => {
    const kept = makePendingComment({ id: pendingId(9) });

    expect(parsePendingComments([entry, kept], NOW)).toEqual([kept]);
  });

  it('Given a name and a text at the bounds of the API When they are read Then they are kept', () => {
    const entry = makePendingComment({ name: 'x'.repeat(80), body: 'x'.repeat(2000) });

    expect(parsePendingComments([entry], NOW)).toEqual([entry]);
  });

  it('Given the same id stored twice When the entries are read Then only the first is kept', () => {
    const first = makePendingComment({ id: P1, body: 'Premier.' });

    expect(
      parsePendingComments([first, makePendingComment({ id: P1, body: 'Second.' })], NOW),
    ).toEqual([first]);
  });

  it('Given an entry older than the waiting delay When it is read Then it is dropped, a younger one stays', () => {
    const expired = makePendingComment({
      id: pendingId(7),
      createdAt: new Date(NOW - PENDING_COMMENT_TTL_MS - 1).toISOString(),
    });
    const fresh = makePendingComment({
      id: pendingId(8),
      createdAt: new Date(NOW - PENDING_COMMENT_TTL_MS + 1).toISOString(),
    });

    expect(parsePendingComments([expired, fresh], NOW).map(({ id }) => id)).toEqual([pendingId(8)]);
  });
});

describe('withoutPublished', () => {
  it('Given pending entries When the thread now publishes some of them, as comment or reply Then only the others stay', () => {
    const thread = makePublishedThread({
      comments: [makePublishedComment({ id: P1, replies: [makePublishedReply({ id: P2 })] })],
    });
    const pending = [
      makePendingComment({ id: P1 }),
      makePendingComment({ id: P2, parentId: P1 }),
      makePendingComment({ id: P3 }),
    ];

    expect(withoutPublished(pending, thread).map(({ id }) => id)).toEqual([P3]);
  });

  it('Given nothing published yet When the thread is read Then the same list comes back', () => {
    const pending = [makePendingComment()];

    expect(withoutPublished(pending, makePublishedThread())).toBe(pending);
  });
});
