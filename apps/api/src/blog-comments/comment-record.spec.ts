import { seedCommentRow } from '../testing/comment-harness';
import { toCommentRecord } from './comment-record';

const POST_ID = '11111111-1111-4111-8111-111111111111';

describe('toCommentRecord', () => {
  it('Given a pending visitor row, When it is narrowed, Then the author carries name and e-mail and the moderation has no date', () => {
    const row = seedCommentRow({
      postId: POST_ID,
      status: 'pending',
      name: 'Camille',
      email: 'camille@example.test',
    });

    expect(toCommentRecord(row)).toEqual({
      id: row.id,
      postId: POST_ID,
      parentId: null,
      author: {
        kind: 'visitor',
        name: 'Camille',
        email: 'camille@example.test',
      },
      moderation: { status: 'pending' },
      body: row.body,
      createdAt: row.createdAt,
    });
  });

  it('Given a published owner row, When it is narrowed, Then the author is the owner alone and the moderation is dated', () => {
    const moderatedAt = new Date('2026-11-03T08:00:00.000Z');
    const row = seedCommentRow({
      postId: POST_ID,
      parentId: '22222222-2222-4222-8222-222222222222',
      owner: true,
      moderatedAt,
    });

    expect(toCommentRecord(row)).toMatchObject({
      author: { kind: 'owner' },
      moderation: { status: 'published', moderatedAt },
    });
  });

  it.each([
    ['a visitor without name', { authorName: null }],
    ['a visitor without e-mail', { authorEmail: null }],
    ['a refused comment without moderation date', { moderatedAt: null }],
  ])(
    'Given %s, a row the database constraints forbid, When it is narrowed, Then it throws instead of inventing a value',
    (_, corruption) => {
      const row = {
        ...seedCommentRow({ postId: POST_ID, status: 'refused' }),
        ...corruption,
      };

      expect(() => toCommentRecord(row)).toThrow(row.id);
    },
  );
});
