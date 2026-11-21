import { randomUUID } from 'node:crypto';
import { resolve } from 'node:path';
import { asc } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import type { Database } from '../database/drizzle.types';
import { blogComments, blogPosts, schema } from '../database/schema';
import {
  seedCommentRow,
  seedPostRow,
  type CommentHarness,
} from '../testing/comment-harness';
import { describeCommentRoutes } from '../testing/comment-route-scenarios';
import { DrizzleCommentStore } from './drizzle-comment-store';

// Commentaires sur un vrai Postgres : garanties portées par la base elle-même, puis les scénarios de
// routes rejoués sur le stockage réel. Ignoré sans base dédiée (elle est migrée puis vidée) :
// `COMMENTS_IT_DATABASE_URL=postgres://…@127.0.0.1:…/… pnpm test -- blog-comments.integration`.
const DATABASE_URL = process.env.COMMENTS_IT_DATABASE_URL;

const MODERATED_AT = '2026-11-21T12:00:00.000Z';

type RawComment = Readonly<Record<string, string | number | null>>;

function constraintOf(error: unknown): string {
  if (typeof error === 'object' && error !== null) {
    if ('constraint_name' in error && typeof error.constraint_name === 'string')
      return error.constraint_name;
    if ('cause' in error) return constraintOf(error.cause);
  }
  return `no constraint: ${String(error)}`;
}

(DATABASE_URL ? describe : describe.skip)('blog comments on Postgres', () => {
  let client: ReturnType<typeof postgres>;
  let db: Database;
  let store: DrizzleCommentStore;
  let harness: CommentHarness;

  let opening: Promise<CommentHarness> | undefined;

  const connect = async (): Promise<CommentHarness> => {
    client = postgres(DATABASE_URL ?? '', { max: 20, onnotice: () => {} });
    db = drizzle(client, { schema, casing: 'snake_case' });
    await migrate(db, {
      migrationsFolder: resolve(__dirname, '../../drizzle'),
    });
    store = new DrizzleCommentStore(db);
    harness = {
      store,
      async seedPost(seed) {
        const post = seedPostRow(seed);
        await db.insert(blogPosts).values({
          ...post,
          excerpt: 'Résumé',
          contentMarkdown: '# Corps',
          publishedAt: post.status === 'published' ? new Date() : null,
        });
        return { id: post.id, slug: post.slug, title: post.title };
      },
      async seedComment(seed) {
        const row = seedCommentRow(seed);
        await db.insert(blogComments).values(row);
        return row;
      },
      comments: () =>
        db.select().from(blogComments).orderBy(asc(blogComments.createdAt)),
      async reset() {
        await db.delete(blogComments);
        await db.delete(blogPosts);
      },
    };
    return harness;
  };
  // Une seule connexion et une seule migration pour tout le fichier.
  const open = () => (opening ??= connect());

  describe('guarantees held by the database itself', () => {
    let postId: string;

    const visitor = (overrides: RawComment = {}): RawComment => ({
      id: randomUUID(),
      post_id: postId,
      author_kind: 'visitor',
      author_name: 'Camille',
      author_email: 'camille@example.test',
      body: 'Un commentaire',
      ...overrides,
    });
    const reply = (parentId: string, overrides: RawComment = {}) =>
      visitor({
        parent_id: parentId,
        depth: 1,
        parent_depth: 0,
        ...overrides,
      });
    // Nom de la contrainte qui refuse la ligne, ou `accepted`.
    const insert = async (row: RawComment): Promise<string> => {
      try {
        await client`insert into blog_comment ${client(row)}`;
        return 'accepted';
      } catch (error) {
        return constraintOf(error);
      }
    };
    const inserted = async (row: RawComment): Promise<string> => {
      expect(await insert(row)).toBe('accepted');
      return String(row.id);
    };
    const ids = async (): Promise<string[]> =>
      (await harness.comments()).map((c) => c.id);

    beforeAll(open);
    beforeEach(async () => {
      await harness.reset();
      postId = (await harness.seedPost({ slug: 'usinage' })).id;
    });

    it('Given a comment and a reply written in plain SQL, When they are inserted, Then the database accepts them', async () => {
      const parent = await inserted(visitor());

      expect(await insert(reply(parent))).toBe('accepted');
    });

    it('Given a reply, When a reply to it is inserted in plain SQL, Then the database refuses it', async () => {
      const parent = await inserted(visitor());
      const first = await inserted(reply(parent));

      expect(await insert(reply(first))).toBe('blog_comment_parent_fk');
    });

    it.each([
      [
        'a depth of 2',
        { depth: 2, parent_depth: 0 },
        'blog_comment_depth_check',
      ],
      [
        'a parent declared at depth 1',
        { depth: 1, parent_depth: 1 },
        'blog_comment_parent_depth_check',
      ],
      [
        'a depth of 0 under a parent',
        { depth: 0, parent_depth: 0 },
        'blog_comment_depth_parent_check',
      ],
      [
        'no declared parent depth',
        { depth: 1, parent_depth: null },
        'blog_comment_parent_depth_parent_check',
      ],
    ])(
      'Given a reply with %s, When it is inserted in plain SQL, Then the database refuses it',
      async (_, overrides, constraint) => {
        const parent = await inserted(visitor());

        expect(await insert(reply(parent, overrides))).toBe(constraint);
      },
    );

    it('Given a comment of another post, When a reply is attached to it from this post, Then the database refuses it', async () => {
      const other = await harness.seedPost({ slug: 'tournage' });
      const parent = await inserted(visitor({ post_id: other.id }));

      expect(await insert(reply(parent))).toBe('blog_comment_parent_fk');
    });

    it.each([
      ['no name', { author_name: null }, 'blog_comment_author_identity_check'],
      [
        'no e-mail',
        { author_email: null },
        'blog_comment_author_identity_check',
      ],
      [
        'a one-letter name',
        { author_name: 'C' },
        'blog_comment_author_name_check',
      ],
      [
        'an 81-character name',
        { author_name: 'x'.repeat(81) },
        'blog_comment_author_name_check',
      ],
      ['a one-character body', { body: 'x' }, 'blog_comment_body_check'],
      [
        'a 2 001-character body',
        { body: 'x'.repeat(2001) },
        'blog_comment_body_check',
      ],
      [
        'an unknown status',
        { status: 'spam', moderated_at: MODERATED_AT },
        'blog_comment_status_check',
      ],
      [
        'an unknown kind of author',
        {
          author_kind: 'robot',
          author_name: null,
          author_email: null,
          status: 'published',
          moderated_at: MODERATED_AT,
        },
        'blog_comment_author_kind_check',
      ],
      [
        'a pending status with a moderation date',
        { status: 'pending', moderated_at: MODERATED_AT },
        'blog_comment_moderated_check',
      ],
      [
        'a published status without moderation date',
        { status: 'published', moderated_at: null },
        'blog_comment_moderated_check',
      ],
      [
        'a refused status without moderation date',
        { status: 'refused' },
        'blog_comment_moderated_check',
      ],
    ])(
      'Given a visitor comment with %s, When it is inserted in plain SQL, Then the database refuses it',
      async (_, overrides, constraint) => {
        expect(await insert(visitor(overrides))).toBe(constraint);
      },
    );

    it.each([
      [
        'a name',
        { author_name: 'Julien', author_email: null },
        'blog_comment_owner_anonymous_check',
      ],
      [
        'a sender fingerprint',
        { author_name: null, author_email: null, sender_hash: 'a'.repeat(64) },
        'blog_comment_owner_anonymous_check',
      ],
      [
        'a pending status',
        {
          author_name: null,
          author_email: null,
          status: 'pending',
          moderated_at: null,
        },
        'blog_comment_owner_published_check',
      ],
    ])(
      'Given an owner reply with %s, When it is inserted in plain SQL, Then the database refuses it',
      async (_, overrides, constraint) => {
        const parent = await inserted(visitor());
        const owner = reply(parent, {
          author_kind: 'owner',
          status: 'published',
          moderated_at: MODERATED_AT,
          ...overrides,
        });

        expect(await insert(owner)).toBe(constraint);
      },
    );

    it('Given a post with comments and replies, When the post is deleted, Then its comments go with it and the other posts keep theirs', async () => {
      const other = await harness.seedPost({ slug: 'tournage' });
      const kept = await inserted(visitor({ post_id: other.id }));
      const parent = await inserted(visitor());
      await inserted(reply(parent));

      await client`delete from blog_post where id = ${postId}`;

      expect(await ids()).toEqual([kept]);
    });

    it('Given a comment with replies, When the comment is deleted, Then its replies go with it and the other comments stay', async () => {
      const kept = await inserted(visitor());
      const parent = await inserted(visitor());
      await inserted(reply(parent));
      await inserted(reply(parent));

      await client`delete from blog_comment where id = ${parent}`;

      expect(await ids()).toEqual([kept]);
    });
  });

  describe('pending caps under concurrency', () => {
    const CAPS = { perSender: 3, total: 100 };
    const pendingFrom = (postId: string, senderHash: string) =>
      store.insertPending(
        {
          postId,
          parentId: null,
          name: 'Camille',
          email: 'camille@example.test',
          senderHash,
          body: 'Un commentaire',
        },
        CAPS,
      );

    beforeAll(open);
    beforeEach(() => harness.reset());

    it('Given one sender, When it sends 10 comments at once, Then exactly 3 are stored', async () => {
      const post = await harness.seedPost({ slug: 'usinage' });

      const results = await Promise.all(
        Array.from({ length: 10 }, () => pendingFrom(post.id, 'b'.repeat(64))),
      );

      expect(results.filter((r) => r.kind === 'inserted')).toHaveLength(3);
      expect(results.filter((r) => r.kind === 'sender-cap')).toHaveLength(7);
      expect(await harness.comments()).toHaveLength(3);
    });

    it('Given 98 pending comments, When 10 senders send one at once, Then exactly 2 are stored: the queue never exceeds 100', async () => {
      const post = await harness.seedPost({ slug: 'usinage' });
      for (let i = 0; i < 98; i += 1)
        await harness.seedComment({
          postId: post.id,
          status: 'pending',
          senderHash: String(i).padStart(64, '0'),
        });

      const results = await Promise.all(
        Array.from({ length: 10 }, (_, i) =>
          pendingFrom(post.id, `c${String(i).padStart(63, '0')}`),
        ),
      );

      expect(results.filter((r) => r.kind === 'inserted')).toHaveLength(2);
      expect(results.filter((r) => r.kind === 'total-cap')).toHaveLength(8);
      expect(await harness.comments()).toHaveLength(100);
    });

    it('Given a post or a parent deleted in the meantime, When the comment is inserted, Then the store reports the target gone instead of failing', async () => {
      const post = await harness.seedPost({ slug: 'usinage' });

      const noPost = await pendingFrom(randomUUID(), 'd'.repeat(64));
      const noParent = await store.insertPending(
        {
          postId: post.id,
          parentId: randomUUID(),
          name: 'Camille',
          email: 'camille@example.test',
          senderHash: 'd'.repeat(64),
          body: 'Une réponse',
        },
        CAPS,
      );

      expect([noPost.kind, noParent.kind]).toEqual([
        'target-gone',
        'target-gone',
      ]);
      expect(await harness.comments()).toEqual([]);
    });
  });

  describe('owner reply to a comment deleted in the meantime', () => {
    beforeAll(open);
    beforeEach(() => harness.reset());

    it('Given a parent that no longer exists, When the reply is inserted, Then the store reports it instead of failing', async () => {
      const post = await harness.seedPost({ slug: 'usinage' });

      const row = await store.insertOwnerReply({
        postId: post.id,
        parentId: randomUUID(),
        body: 'Merci',
        publishedAt: new Date(),
      });

      expect(row).toBeUndefined();
      expect(await harness.comments()).toEqual([]);
    });
  });

  describe('what the public query reads', () => {
    beforeAll(open);
    beforeEach(() => harness.reset());

    it('Given published comments with an e-mail and a fingerprint, When the public threads are read, Then the rows carry neither column', async () => {
      const post = await harness.seedPost({ slug: 'usinage' });
      const comment = await harness.seedComment({ postId: post.id });
      await harness.seedComment({ postId: post.id, parentId: comment.id });

      const threads = await store.findPublishedThreads(post.id, {
        page: 1,
        limit: 10,
        offset: 0,
      });

      const columns = [
        'authorKind',
        'authorName',
        'body',
        'createdAt',
        'id',
        'parentId',
      ];
      expect(threads.comments.map((row) => Object.keys(row).sort())).toEqual([
        columns,
      ]);
      expect(threads.replies.map((row) => Object.keys(row).sort())).toEqual([
        columns,
      ]);
    });
  });

  describeCommentRoutes('on Postgres', open, () => client.end());
});
