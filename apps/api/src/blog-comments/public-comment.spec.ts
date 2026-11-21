import { publicCommentPageSchema } from './public-comment';

const ID = '11111111-1111-4111-8111-111111111111';
const REPLY_ID = '22222222-2222-4222-8222-222222222222';
const CREATED_AT = '2026-11-02T09:10:00.000Z';

describe('publicCommentPageSchema', () => {
  it('Given whole rows with an e-mail and a sender fingerprint at every level, When the page is parsed for the public, Then only the declared keys remain', () => {
    const leaking = {
      authorEmail: 'do-not-leak@example.test',
      email: 'do-not-leak@example.test',
      senderHash: 'f'.repeat(64),
      status: 'published',
    };

    const page = publicCommentPageSchema.parse({
      data: [
        {
          ...leaking,
          id: ID,
          author: { kind: 'visitor', name: 'Camille', ...leaking },
          body: 'Premier',
          createdAt: CREATED_AT,
          replies: [
            {
              ...leaking,
              id: REPLY_ID,
              author: { kind: 'owner', ...leaking },
              body: 'Réponse',
              createdAt: CREATED_AT,
            },
          ],
        },
      ],
      total: 1,
      page: 1,
      limit: 10,
      ...leaking,
    });

    expect(page).toEqual({
      data: [
        {
          id: ID,
          author: { kind: 'visitor', name: 'Camille' },
          body: 'Premier',
          createdAt: CREATED_AT,
          replies: [
            {
              id: REPLY_ID,
              author: { kind: 'owner' },
              body: 'Réponse',
              createdAt: CREATED_AT,
            },
          ],
        },
      ],
      total: 1,
      page: 1,
      limit: 10,
    });
    expect(JSON.stringify(page)).not.toMatch(/mail|sender|hash/i);
  });

  it('Given an author of an unknown kind, When the page is parsed, Then it is refused rather than served', () => {
    const result = publicCommentPageSchema.safeParse({
      data: [
        {
          id: ID,
          author: { kind: 'admin', name: 'x' },
          body: 'Premier',
          createdAt: CREATED_AT,
          replies: [],
        },
      ],
      total: 1,
      page: 1,
      limit: 10,
    });

    expect(result.success).toBe(false);
  });
});
