import {
  makeAdminComment,
  makePublishedComment,
  makePublishedReply,
  makePublishedThread,
  toAdminCommentDto,
  toPublicCommentPageDto,
} from '../testing/comment-builders';
import { toAdminCommentPage, toPublishedThread } from './comment.adapter';

describe('toPublishedThread', () => {
  it('Given a public page of comments When it is adapted Then each comment keeps its replies, in order, and the total of the article', () => {
    const thread = makePublishedThread({
      comments: [
        makePublishedComment({
          id: 'c-1',
          replies: [
            makePublishedReply({ id: 'r-1' }),
            makePublishedReply({ id: 'r-2', author: { kind: 'visitor', name: 'Lou' } }),
          ],
        }),
        makePublishedComment({ id: 'c-2' }),
      ],
      total: 120,
    });

    expect(toPublishedThread(toPublicCommentPageDto(thread))).toEqual(thread);
  });

  it('Given an answer of the API carrying an e-mail it should not When it is adapted Then the address never reaches the page', () => {
    const leaking = {
      data: [
        {
          id: 'c-1',
          author: { kind: 'visitor' as const, name: 'Camille', email: 'camille@example.test' },
          body: 'Merci.',
          createdAt: '2026-11-21T09:30:00.000Z',
          senderHash: 'abc',
          replies: [
            {
              id: 'r-1',
              author: { kind: 'visitor' as const, name: 'Lou', email: 'lou@example.test' },
              body: 'Pareil.',
              createdAt: '2026-11-21T10:30:00.000Z',
            },
          ],
        },
      ],
      total: 1,
      page: 1,
      limit: 100,
    };

    expect(toPublishedThread(leaking)).toEqual(
      makePublishedThread({
        comments: [
          makePublishedComment({
            body: 'Merci.',
            replies: [
              makePublishedReply({
                author: { kind: 'visitor', name: 'Lou' },
                body: 'Pareil.',
                createdAt: '2026-11-21T10:30:00.000Z',
              }),
            ],
          }),
        ],
      }),
    );
  });
});

describe('toAdminCommentPage', () => {
  it('Given a page of the moderation queue When it is adapted Then its comments and total come back, without the moderation date', () => {
    const pending = makeAdminComment({ id: 'c-1' });
    const published = makeAdminComment({ id: 'c-2', status: 'published' });

    expect(
      toAdminCommentPage({
        data: [toAdminCommentDto(pending), toAdminCommentDto(published)],
        total: 7,
        page: 1,
        limit: 20,
      }),
    ).toEqual({ comments: [pending, published], total: 7 });
  });

  it('Given a reply of the owner to a visitor When it is adapted Then the owner has neither name nor e-mail and the parent keeps its excerpt', () => {
    const reply = makeAdminComment({
      author: { kind: 'owner' },
      status: 'published',
      parent: { id: 'c-0', author: { kind: 'visitor', name: 'Camille' }, excerpt: 'Merci…' },
    });

    expect(
      toAdminCommentPage({ data: [toAdminCommentDto(reply)], total: 1, page: 1, limit: 20 })
        .comments,
    ).toEqual([reply]);
  });
});
