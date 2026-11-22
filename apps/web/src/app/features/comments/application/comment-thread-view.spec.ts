import { OWNER_NAME } from '@shared/seo/site-person';
import { frenchTypographyViolations } from '../../../testing/french-typography-violations';
import {
  makePublishedComment,
  makePublishedReply,
  makePublishedThread,
} from '../testing/comment-builders';
import { toCommentThreadView } from './comment-thread-view';

describe('toCommentThreadView', () => {
  it('Given comments in the order of the API When the thread is shown Then that order is kept and each reply stays under its comment', () => {
    const view = toCommentThreadView(
      makePublishedThread({
        comments: [
          makePublishedComment({
            id: 'c-1',
            replies: [makePublishedReply({ id: 'r-1' }), makePublishedReply({ id: 'r-2' })],
          }),
          makePublishedComment({ id: 'c-2' }),
        ],
      }),
    );

    expect(view.items.map((item) => [item.id, item.replies.map((reply) => reply.id)])).toEqual([
      ['c-1', ['r-1', 'r-2']],
      ['c-2', []],
    ]);
  });

  it('Given a visitor comment answered by the owner When the thread is shown Then the visitor keeps the name typed and the owner reads as the site author, said in words', () => {
    const view = toCommentThreadView(
      makePublishedThread({
        comments: [
          makePublishedComment({
            author: { kind: 'visitor', name: 'Camille' },
            replies: [makePublishedReply({ author: { kind: 'owner' } })],
          }),
        ],
      }),
    );
    const [item] = view.items;

    expect({
      comment: { author: item?.author, mention: item?.ownerMention },
      reply: { author: item?.replies[0]?.author, mention: item?.replies[0]?.ownerMention },
    }).toEqual({
      comment: { author: 'Camille', mention: null },
      reply: { author: OWNER_NAME, mention: 'auteur de l’article' },
    });
  });

  it('Given a comment and its body When the thread is shown Then the date and the text are kept as written, and the heading id derives from the comment id', () => {
    const view = toCommentThreadView(
      makePublishedThread({
        comments: [
          makePublishedComment({
            id: 'c-9',
            body: '<app-root>\nligne 2',
            createdAt: '2026-11-21T09:30:00.000Z',
          }),
        ],
      }),
    );

    expect(view.items[0]).toMatchObject({
      headingId: 'comment-c-9-author',
      body: '<app-root>\nligne 2',
      createdAt: '2026-11-21T09:30:00.000Z',
      repliesLabel: 'Réponses à Camille',
    });
  });

  it.each([
    { comments: 0, replies: 0, heading: 'Commentaires' },
    { comments: 1, replies: 0, heading: 'Commentaires (1)' },
    { comments: 2, replies: 1, heading: 'Commentaires (3)' },
  ])(
    'Given $comments comments and $replies replies When the thread is shown Then the heading reads $heading',
    ({ comments, replies, heading }) => {
      const thread = makePublishedThread({
        comments: Array.from({ length: comments }, (_, index) =>
          makePublishedComment({
            id: `c-${index}`,
            replies: index === 0 ? Array.from({ length: replies }, () => makePublishedReply()) : [],
          }),
        ),
      });

      expect(toCommentThreadView(thread).heading).toBe(heading);
    },
  );

  it('Given an article with more published comments than the page read When the thread is shown Then it says only the first ones are shown', () => {
    const comments = Array.from({ length: 100 }, (_, index) =>
      makePublishedComment({ id: `c-${index}` }),
    );

    expect(toCommentThreadView(makePublishedThread({ comments, total: 120 })).truncation).toBe(
      'Seuls les 100 premiers commentaires sont affichés.',
    );
  });

  it('Given every comment read When the thread is shown Then nothing says it is cut', () => {
    expect(toCommentThreadView(makePublishedThread()).truncation).toBeNull();
  });

  it('Given an owner reply When the texts are read Then they follow French typography', () => {
    const view = toCommentThreadView(
      makePublishedThread({
        comments: [makePublishedComment({ replies: [makePublishedReply()] })],
        total: 120,
      }),
    );
    const texts = [
      view.heading,
      view.truncation ?? '',
      ...view.items.flatMap((item) => [item.repliesLabel, item.replies[0]?.ownerMention ?? '']),
    ];

    expect({
      texts: texts.every((text) => text !== ''),
      violations: texts.flatMap((text) => frenchTypographyViolations(text, 'view')),
    }).toEqual({ texts: true, violations: [] });
  });
});
