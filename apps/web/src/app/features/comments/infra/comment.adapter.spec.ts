import { makeAdminComment, toAdminCommentDto } from '../testing/comment-builders';
import { toAdminCommentPage } from './comment.adapter';

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
