import { makeAdminComment } from '@features/comments/testing/comment-builders';
import { frenchTypographyViolations } from '../../../testing/french-typography-violations';
import {
  COMMENT_FILTERS,
  commentsSummary,
  deletionPrompt,
  moderationFailureMessage,
  toAdminCommentRow,
} from './admin-comments-view';

const NOW = new Date('2026-11-21T12:00:00.000Z');

describe('toAdminCommentRow', () => {
  it('Given a pending comment of a visitor When it is shown Then the row names the visitor, the e-mail, the article and the status', () => {
    const row = toAdminCommentRow(
      makeAdminComment({
        author: { kind: 'visitor', name: 'Camille', email: 'camille@example.test' },
        post: { id: 'p-1', slug: 'article-temoin', title: 'Article témoin' },
        createdAt: '2026-11-21T09:00:00.000Z',
      }),
      NOW,
    );

    expect(row).toEqual(
      expect.objectContaining({
        author: 'Camille',
        email: 'camille@example.test',
        mailto: 'mailto:camille@example.test',
        postTitle: 'Article témoin',
        postLink: ['/blog', 'article-temoin'],
        status: 'En attente',
        received: 'il y a 3 h',
        createdAt: '2026-11-21T09:00:00.000Z',
        parent: null,
        replies: '',
      }),
    );
  });

  it('Given a reply of the owner to a visitor When it is shown Then the owner is named without e-mail and the parent is quoted', () => {
    const row = toAdminCommentRow(
      makeAdminComment({
        author: { kind: 'owner' },
        status: 'published',
        parent: { id: 'c-0', author: { kind: 'visitor', name: 'Camille' }, excerpt: 'Merci !' },
      }),
      NOW,
    );

    expect({
      author: row.author,
      email: row.email,
      parent: row.parent,
      status: row.status,
    }).toEqual({
      author: 'Toi, auteur du site',
      email: null,
      parent: 'En réponse à Camille : « Merci ! »',
      status: 'Publié',
    });
  });

  it('Given a reply of a visitor to the owner When it is shown Then the parent is named as the owner', () => {
    const row = toAdminCommentRow(
      makeAdminComment({
        parent: { id: 'c-0', author: { kind: 'owner' }, excerpt: 'Bonne question' },
      }),
      NOW,
    );

    expect(row.parent).toBe('En réponse à toi : « Bonne question »');
  });

  it.each([
    { replyCount: 0, replies: '' },
    { replyCount: 1, replies: '1 réponse' },
    { replyCount: 3, replies: '3 réponses' },
  ])(
    'Given a comment with $replyCount reply(ies) When it is shown Then it reads « $replies »',
    ({ replyCount, replies }) => {
      expect(
        toAdminCommentRow(makeAdminComment({ status: 'published', replyCount }), NOW).replies,
      ).toBe(replies);
    },
  );
});

describe('commentsSummary', () => {
  it.each([
    { status: 'pending', total: 1, summary: '1 commentaire en attente' },
    { status: 'pending', total: 4, summary: '4 commentaires en attente' },
    { status: 'published', total: 1, summary: '1 commentaire publié' },
    { status: 'published', total: 12, summary: '12 commentaires publiés' },
  ] as const)(
    'Given $total $status comment(s) When summarized Then it reads « $summary »',
    ({ status, total, summary }) => {
      expect(commentsSummary(status, total)).toBe(summary);
    },
  );
});

describe('COMMENT_FILTERS', () => {
  it('Given the moderation queue When its filters are listed Then pending comes first, then published', () => {
    expect(COMMENT_FILTERS.map(({ value, label }) => ({ value, label }))).toEqual([
      { value: 'pending', label: 'En attente' },
      { value: 'published', label: 'Publiés' },
    ]);
  });
});

describe('Typographie des textes de la file', () => {
  it('Given every row label When it is checked Then it follows French typography', () => {
    const row = toAdminCommentRow(
      makeAdminComment({
        parent: { id: 'c-0', author: { kind: 'visitor', name: 'Camille' }, excerpt: 'Merci' },
      }),
      NOW,
    );

    expect(
      [row.parent ?? '', commentsSummary('pending', 2)].flatMap((text) =>
        frenchTypographyViolations(text, 'row'),
      ),
    ).toEqual([]);
  });
});

describe('Publication', () => {
  it.each([
    { status: 'pending', publishLabel: 'Publier le commentaire de Camille' },
    { status: 'published', publishLabel: null },
  ] as const)(
    'Given a $status comment When it is shown Then its publish action reads « $publishLabel »',
    ({ status, publishLabel }) => {
      expect(toAdminCommentRow(makeAdminComment({ status }), NOW).publishLabel).toBe(publishLabel);
    },
  );

  it.each([
    {
      reason: 'not-found',
      parent: null,
      message: 'Ce commentaire a été supprimé entre-temps. La liste est à jour.',
    },
    {
      reason: 'conflict',
      parent: null,
      message: 'Ce commentaire est déjà publié. La liste est à jour.',
    },
    {
      reason: 'conflict',
      parent: { id: 'c-0', author: { kind: 'owner' }, excerpt: 'Oui' },
      message:
        "Ce commentaire est déjà publié, ou celui auquel il répond ne l'est pas encore. La liste est à jour.",
    },
    {
      reason: 'failed',
      parent: null,
      message: "Le commentaire n'a pas pu être publié. Réessaie dans un instant.",
    },
  ] as const)(
    'Given publishing fails with « $reason » When the failure is told Then it reads « $message »',
    ({ reason, parent, message }) => {
      expect(moderationFailureMessage('publish', reason, makeAdminComment({ parent }))).toBe(
        message,
      );
    },
  );
});

describe('Suppression', () => {
  const OWNER_REPLY = makeAdminComment({
    author: { kind: 'owner' },
    status: 'published',
    parent: { id: 'c-0', author: { kind: 'visitor', name: 'Camille' }, excerpt: 'Merci' },
  });

  it.each([
    {
      name: 'a pending comment',
      comment: makeAdminComment(),
      label: 'Refuser le commentaire de Camille',
    },
    {
      name: 'a published comment',
      comment: makeAdminComment({ status: 'published' }),
      label: 'Supprimer le commentaire de Camille',
    },
    { name: 'a reply of the owner', comment: OWNER_REPLY, label: 'Supprimer ta réponse' },
  ])(
    'Given $name When it is shown Then its delete action reads « $label »',
    ({ comment, label }) => {
      expect(toAdminCommentRow(comment, NOW).deleteLabel).toBe(label);
    },
  );

  it.each([
    {
      name: 'a pending comment',
      comment: makeAdminComment(),
      prompt: {
        heading: 'Refuser le commentaire de Camille ?',
        description: 'Un commentaire refusé est supprimé définitivement.',
        confirmLabel: 'Refuser et supprimer',
        done: 'Commentaire de Camille refusé et supprimé',
      },
    },
    {
      name: 'a published comment with 2 replies',
      comment: makeAdminComment({ status: 'published', replyCount: 2 }),
      prompt: {
        heading: 'Supprimer le commentaire de Camille ?',
        description:
          "Le commentaire disparaît de l'article, et ses 2 réponses avec lui. Cette action est définitive.",
        confirmLabel: 'Supprimer le commentaire',
        done: 'Commentaire de Camille supprimé',
      },
    },
    {
      name: 'a published comment with 1 reply',
      comment: makeAdminComment({ status: 'published', replyCount: 1 }),
      prompt: {
        heading: 'Supprimer le commentaire de Camille ?',
        description:
          "Le commentaire disparaît de l'article, et sa réponse avec lui. Cette action est définitive.",
        confirmLabel: 'Supprimer le commentaire',
        done: 'Commentaire de Camille supprimé',
      },
    },
    {
      name: 'a published comment without reply',
      comment: makeAdminComment({ status: 'published' }),
      prompt: {
        heading: 'Supprimer le commentaire de Camille ?',
        description: "Le commentaire disparaît de l'article. Cette action est définitive.",
        confirmLabel: 'Supprimer le commentaire',
        done: 'Commentaire de Camille supprimé',
      },
    },
    {
      name: 'a reply of the owner',
      comment: OWNER_REPLY,
      prompt: {
        heading: 'Supprimer ta réponse ?',
        description: "Ta réponse disparaît de l'article. Cette action est définitive.",
        confirmLabel: 'Supprimer la réponse',
        done: 'Ta réponse est supprimée',
      },
    },
  ])(
    'Given $name When its deletion is asked for Then the prompt says what goes',
    ({ comment, prompt }) => {
      expect(deletionPrompt(comment)).toEqual(prompt);
    },
  );

  it.each([
    { reason: 'not-found', message: 'Ce commentaire était déjà supprimé. La liste est à jour.' },
    {
      reason: 'failed',
      message: "Le commentaire n'a pas pu être supprimé. Réessaie dans un instant.",
    },
  ] as const)(
    'Given a deletion fails with « $reason » When the failure is told Then it reads « $message »',
    ({ reason, message }) => {
      expect(moderationFailureMessage('delete', reason, makeAdminComment())).toBe(message);
    },
  );

  it('Given every deletion prompt When it is checked Then it follows French typography', () => {
    const prompts = [
      makeAdminComment(),
      makeAdminComment({ status: 'published', replyCount: 3 }),
      OWNER_REPLY,
    ].map(deletionPrompt);

    expect(
      prompts.flatMap((prompt) =>
        Object.values(prompt).flatMap((text) => frenchTypographyViolations(text, 'prompt')),
      ),
    ).toEqual([]);
  });
});
