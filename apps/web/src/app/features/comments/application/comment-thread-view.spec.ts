import { OWNER_NAME } from '@shared/seo/site-person';
import { frenchTypographyViolations } from '../../../testing/french-typography-violations';
import {
  makePendingComment,
  makePublishedComment,
  makePublishedReply,
  makePublishedThread,
} from '../testing/comment-builders';
import { COMMENT_COPY } from './comment-copy';
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
    { comments: 0, replies: 0, count: 0 },
    { comments: 1, replies: 0, count: 1 },
    { comments: 2, replies: 1, count: 3 },
  ])(
    'Given $comments comments and $replies replies When the thread is shown Then the heading counts $count',
    ({ comments, replies, count }) => {
      const thread = makePublishedThread({
        comments: Array.from({ length: comments }, (_, index) =>
          makePublishedComment({
            id: `c-${index}`,
            replies: index === 0 ? Array.from({ length: replies }, () => makePublishedReply()) : [],
          }),
        ),
      });

      expect(toCommentThreadView(thread).count).toBe(count);
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
      COMMENT_COPY.pending,
      view.truncation ?? '',
      ...view.items.flatMap((item) => [item.repliesLabel, item.replies[0]?.ownerMention ?? '']),
    ];

    expect({
      texts: texts.every((text) => text !== ''),
      violations: texts.flatMap((text) => frenchTypographyViolations(text, 'view')),
    }).toEqual({ texts: true, violations: [] });
  });

  it.each([
    { name: 'Camille', initial: 'C' },
    { name: 'émile', initial: 'É' },
    { name: '  noa', initial: 'N' },
  ])('Given $name When the thread is shown Then the badge shows $initial', ({ name, initial }) => {
    const view = toCommentThreadView(
      makePublishedThread({
        comments: [makePublishedComment({ author: { kind: 'visitor', name } })],
      }),
    );

    expect(view.items[0]?.initial).toBe(initial);
  });

  it('Given an owner reply When the thread is shown Then its badge shows the initial of the site author', () => {
    const view = toCommentThreadView(
      makePublishedThread({
        comments: [
          makePublishedComment({ replies: [makePublishedReply({ author: { kind: 'owner' } })] }),
        ],
      }),
    );

    expect(view.items[0]?.replies[0]?.initial).toBe(OWNER_NAME.charAt(0));
  });

  it('Given comments of this reader still waiting When the thread is shown Then a comment comes after the published ones and a reply under its parent, both marked waiting, none counted', () => {
    const view = toCommentThreadView(
      makePublishedThread({
        comments: [
          makePublishedComment({ id: 'c-1', replies: [makePublishedReply({ id: 'r-1' })] }),
        ],
      }),
      [
        makePendingComment({ id: 'p-1', name: 'Lou', body: 'Bel article.' }),
        makePendingComment({ id: 'p-2', parentId: 'c-1' }),
      ],
    );

    expect({
      count: view.count,
      items: view.items.map((item) => ({
        id: item.id,
        pending: item.pending,
        replies: item.replies.map((reply) => [reply.id, reply.pending]),
      })),
      waiting: view.items[1] && {
        author: view.items[1].author,
        body: view.items[1].body,
        ownerMention: view.items[1].ownerMention,
      },
    }).toEqual({
      count: 2,
      items: [
        {
          id: 'c-1',
          pending: false,
          replies: [
            ['r-1', false],
            ['p-2', true],
          ],
        },
        { id: 'p-1', pending: true, replies: [] },
      ],
      waiting: { author: 'Lou', body: 'Bel article.', ownerMention: null },
    });
  });

  it('Given a waiting reply whose parent is not in the thread When the thread is shown Then it is not shown', () => {
    const view = toCommentThreadView(makePublishedThread(), [
      makePendingComment({ id: 'p-2', parentId: 'c-gone' }),
    ]);

    expect(view.items.flatMap((item) => item.replies)).toEqual([]);
  });

  it('Given a waiting comment now published When the thread is shown Then it appears once, as published', () => {
    const view = toCommentThreadView(
      makePublishedThread({ comments: [makePublishedComment({ id: 'p-1' })] }),
      [makePendingComment({ id: 'p-1' })],
    );

    expect(view.items.map((item) => [item.id, item.pending])).toEqual([['p-1', false]]);
  });

  it('Given only a waiting comment When the thread is shown Then it is listed and the heading counts nothing', () => {
    const view = toCommentThreadView(makePublishedThread({ comments: [] }), [makePendingComment()]);

    expect([view.count, view.items.length]).toEqual([0, 1]);
  });
});
