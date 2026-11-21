import type { RequireAuth } from '../auth/require-auth';
import { blogCommentsRoutes } from '../blog-comments/blog-comments.routes';
import { BlogCommentsService } from '../blog-comments/blog-comments.service';
import { Logger } from '../common/logger';
import { senderHasher } from '../common/sender-hash';
import type { SendMailOptions } from '../mailer/mailer.service';
import type { CommentHarness } from './comment-harness';
import { defined } from './defined';
import { denyAll, passThrough } from './require-auth';
import { testApp } from './test-app';

const NOW = new Date('2026-11-21T12:00:00.000Z');
const EMAIL = 'camille@example.test';
const COMMENT = {
  name: 'Camille',
  email: EMAIL,
  body: 'Merci pour cet article.',
};
const UNKNOWN_ID = '00000000-0000-4000-8000-000000000000';

type CallInit = {
  readonly method?: string;
  readonly json?: unknown;
  readonly ip?: string;
};

// Scénarios HTTP des commentaires, rejoués sur la doublure en mémoire et sur un vrai Postgres.
export function describeCommentRoutes(
  label: string,
  openHarness: () => Promise<CommentHarness>,
  closeHarness: () => Promise<void> = () => Promise.resolve(),
): void {
  describe(`blog comment routes (${label})`, () => {
    let harness: CommentHarness;
    let sendMail: jest.Mock<Promise<void>, [SendMailOptions]>;
    let logError: jest.SpyInstance;
    let logWarn: jest.SpyInstance;
    let app: ReturnType<typeof testApp>;
    let ipCounter = 0;
    const hashSender = senderHasher(
      'test-jwt-secret-of-32-characters!',
      'comments',
    );

    const build = (auth: RequireAuth) =>
      testApp(
        '/api/blog',
        blogCommentsRoutes(
          new BlogCommentsService(
            harness.store,
            { sendMail },
            hashSender,
            () => NOW,
          ),
          auth,
        ),
      );

    // Une IP par requête, sauf demande : les quotas ne doivent pas fausser les cas fonctionnels.
    const call = (path: string, init: CallInit = {}, target = app) => {
      ipCounter += 1;
      const headers: Record<string, string> = {
        'x-forwarded-for':
          init.ip ?? `198.51.${Math.floor(ipCounter / 250)}.${ipCounter % 250}`,
      };
      const method = init.method ?? 'GET';
      // Une lecture n'a pas de corps : `Request` le refuse.
      const json = method === 'GET' ? undefined : init.json;
      if (json !== undefined) headers['content-type'] = 'application/json';
      return target.request(`/api/blog${path}`, {
        method,
        headers,
        ...(json !== undefined ? { body: JSON.stringify(json) } : {}),
      });
    };
    const post = (slug: string, json: unknown, ip?: string) =>
      call(`/posts/${slug}/comments`, {
        method: 'POST',
        json,
        ...(ip === undefined ? {} : { ip }),
      });
    const flushMails = () => new Promise((resolve) => setImmediate(resolve));
    const errorMessage = async (res: Response): Promise<unknown> => {
      const body: unknown = await res.json();
      return typeof body === 'object' && body !== null && 'message' in body
        ? body.message
        : undefined;
    };

    beforeAll(async () => {
      harness = await openHarness();
    });
    afterAll(() => closeHarness());

    beforeEach(async () => {
      await harness.reset();
      sendMail = jest
        .fn<Promise<void>, [SendMailOptions]>()
        .mockResolvedValue(undefined);
      logError = jest.spyOn(Logger.prototype, 'error').mockImplementation();
      logWarn = jest.spyOn(Logger.prototype, 'warn').mockImplementation();
      app = build(passThrough);
    });
    afterEach(() => {
      logError.mockRestore();
      logWarn.mockRestore();
    });

    describe('a visitor leaves a comment', () => {
      it('Given a published post, When a visitor comments, Then 202 without body and the comment waits for moderation', async () => {
        const article = await harness.seedPost({ slug: 'usinage' });

        const res = await post('usinage', COMMENT, '203.0.113.7');

        expect(res.status).toBe(202);
        expect(await res.text()).toBe('');
        const [row] = await harness.comments();
        expect(row).toMatchObject({
          postId: article.id,
          parentId: null,
          depth: 0,
          status: 'pending',
          moderatedAt: null,
          authorKind: 'visitor',
          authorName: 'Camille',
          authorEmail: EMAIL,
          body: 'Merci pour cet article.',
        });
        expect(defined(row).senderHash).toMatch(/^[0-9a-f]{64}$/);
        expect(JSON.stringify(row)).not.toContain('203.0.113.7');
      });

      it('Given a comment with Windows line endings and markup, When it is stored, Then line endings are normalised and the markup is kept as text', async () => {
        await harness.seedPost({ slug: 'usinage' });

        await post('usinage', {
          ...COMMENT,
          body: '  <app-root>\r\nligne 2  ',
        });

        expect((await harness.comments()).map((c) => c.body)).toEqual([
          '<app-root>\nligne 2',
        ]);
      });

      it('Given a pending comment, When it is stored, Then the owner alone is notified, with a reply-to to the visitor', async () => {
        await harness.seedPost({ slug: 'usinage', title: 'Usinage 5 axes' });

        await post('usinage', COMMENT);
        await flushMails();

        expect(sendMail).toHaveBeenCalledTimes(1);
        expect(sendMail).toHaveBeenCalledWith({
          to: 'contact@nedellec-julien.fr',
          subject: 'Commentaire en attente : Usinage 5 axes',
          replyTo: EMAIL,
          template: {
            id: 'comment-notification',
            variables: {
              NAME: 'Camille',
              SENDER_EMAIL: EMAIL,
              POST_TITLE: 'Usinage 5 axes',
              POST_SLUG: 'usinage',
              PARENT_NAME: '',
              MESSAGE: 'Merci pour cet article.',
              YEAR: '2026',
            },
          },
        });
      });

      it('Given the mail provider fails, When a visitor comments, Then 202, the comment is kept and the failure is logged without the address', async () => {
        await harness.seedPost({ slug: 'usinage' });
        sendMail.mockRejectedValue(new Error('Resend responded 500'));

        const res = await post('usinage', COMMENT);
        await flushMails();

        expect(res.status).toBe(202);
        expect(await harness.comments()).toHaveLength(1);
        expect(logError).toHaveBeenCalledTimes(1);
        expect(JSON.stringify(logError.mock.calls)).not.toContain(EMAIL);
        expect(JSON.stringify(logError.mock.calls)).not.toContain('Camille');
      });

      it('Given a filled trap field, When the comment arrives, Then 202 like an accepted one, nothing stored, nothing sent', async () => {
        await harness.seedPost({ slug: 'usinage' });

        const res = await post('usinage', {
          ...COMMENT,
          website: 'https://spam.test',
        });
        await flushMails();

        expect(res.status).toBe(202);
        expect(await res.text()).toBe('');
        expect(await harness.comments()).toEqual([]);
        expect(sendMail).not.toHaveBeenCalled();
      });

      it.each([
        ['an unknown field', { ...COMMENT, notify: true }],
        ['an invalid e-mail', { ...COMMENT, email: 'not-an-address' }],
        ['a one-letter name', { ...COMMENT, name: 'C' }],
        ['a control character', { ...COMMENT, body: 'texte\u0000' }],
        ['a parent that is not a UUID', { ...COMMENT, parentId: 'x' }],
        ['a list instead of an object', [COMMENT]],
      ])(
        'Given %s, When the comment arrives, Then 400 and nothing is stored',
        async (_, json) => {
          await harness.seedPost({ slug: 'usinage' });

          const res = await post('usinage', json);

          expect(res.status).toBe(400);
          expect(await harness.comments()).toEqual([]);
          expect(sendMail).not.toHaveBeenCalled();
        },
      );

      it('Given a refused comment, When the error is read, Then it never repeats the address that was typed', async () => {
        await harness.seedPost({ slug: 'usinage' });

        const res = await post('usinage', {
          ...COMMENT,
          email: 'private.person@',
          name: 'C',
        });

        expect(res.status).toBe(400);
        expect(await res.text()).not.toContain('private.person');
      });

      it('Given a body over 100 kB, When the comment arrives, Then 413', async () => {
        await harness.seedPost({ slug: 'usinage' });

        const res = await post('usinage', {
          ...COMMENT,
          body: 'x'.repeat(110_000),
        });

        expect(res.status).toBe(413);
      });

      it.each([
        ['an unknown post', 'inconnu'],
        ['a draft', 'brouillon'],
        ['a slug longer than any real one', 'x'.repeat(300)],
        ['a slug with a NUL byte', 'usinage%00'],
        ['a slug with characters no slug has', 'Usinage_5'],
      ])(
        'Given %s, When a visitor comments, Then 404 and nothing is stored',
        async (_, slug) => {
          await harness.seedPost({ slug: 'brouillon', status: 'draft' });

          const res = await post(slug, COMMENT);
          const read = await call(`/posts/${slug}/comments`);

          expect(read.status).toBe(404);
          expect(res.status).toBe(404);
          expect(await errorMessage(res)).toBe('Article introuvable.');
          expect(await harness.comments()).toEqual([]);
          expect(sendMail).not.toHaveBeenCalled();
        },
      );

      it('Given a published comment, When a visitor replies to it, Then the reply waits for moderation under it and the notification names the parent', async () => {
        const article = await harness.seedPost({ slug: 'usinage' });
        const parent = await harness.seedComment({
          postId: article.id,
          name: 'Dominique',
        });

        const res = await post('usinage', { ...COMMENT, parentId: parent.id });
        await flushMails();

        expect(res.status).toBe(202);
        const reply = (await harness.comments()).find(
          (c) => c.id !== parent.id,
        );
        expect(reply).toMatchObject({
          parentId: parent.id,
          postId: article.id,
          depth: 1,
          parentDepth: 0,
          status: 'pending',
        });
        expect(
          defined(sendMail.mock.calls[0])[0].template.variables.PARENT_NAME,
        ).toBe('Dominique');
      });

      it.each(['pending', 'refused'] as const)(
        'Given a %s comment, When a visitor replies to it, Then 404 exactly like an unknown comment: its existence does not leak',
        async (status) => {
          const article = await harness.seedPost({ slug: 'usinage' });
          const parent = await harness.seedComment({
            postId: article.id,
            status,
          });

          const hidden = await post('usinage', {
            ...COMMENT,
            parentId: parent.id,
          });
          const unknown = await post('usinage', {
            ...COMMENT,
            parentId: UNKNOWN_ID,
          });

          expect(hidden.status).toBe(404);
          expect(unknown.status).toBe(404);
          expect(await errorMessage(hidden)).toBe(await errorMessage(unknown));
          expect(await harness.comments()).toHaveLength(1);
        },
      );

      it('Given a published comment of another post, When a visitor replies to it from this post, Then 404', async () => {
        await harness.seedPost({ slug: 'usinage' });
        const other = await harness.seedPost({ slug: 'tournage' });
        const parent = await harness.seedComment({ postId: other.id });

        const res = await post('usinage', { ...COMMENT, parentId: parent.id });

        expect(res.status).toBe(404);
        expect(await errorMessage(res)).toBe('Commentaire introuvable.');
        expect(await harness.comments()).toHaveLength(1);
      });

      it('Given a published reply, When a visitor replies to it, Then 409: one level only', async () => {
        const article = await harness.seedPost({ slug: 'usinage' });
        const parent = await harness.seedComment({ postId: article.id });
        const reply = await harness.seedComment({
          postId: article.id,
          parentId: parent.id,
        });

        const res = await post('usinage', { ...COMMENT, parentId: reply.id });

        expect(res.status).toBe(409);
        expect(await errorMessage(res)).toBe(
          'Tu ne peux pas répondre à une réponse.',
        );
        expect(await harness.comments()).toHaveLength(2);
      });

      it('Given 3 pending comments from one sender, When it sends a 4th, Then 429 and nothing stored; another sender still passes', async () => {
        await harness.seedPost({ slug: 'usinage' });
        const statuses: number[] = [];
        for (let i = 0; i < 3; i += 1)
          statuses.push(
            (await post('usinage', COMMENT, '203.0.113.20')).status,
          );

        const fourth = await post('usinage', COMMENT, '203.0.113.20');
        const other = await post('usinage', COMMENT, '203.0.113.21');

        expect(statuses).toEqual([202, 202, 202]);
        expect(fourth.status).toBe(429);
        expect(await errorMessage(fourth)).toBe(
          'Tu as déjà plusieurs commentaires en attente de relecture. Réessaie plus tard.',
        );
        expect(other.status).toBe(202);
        expect(await harness.comments()).toHaveLength(4);
      });

      it('Given 3 comments from one sender, already moderated, When it sends another, Then 202: only pending ones count', async () => {
        const article = await harness.seedPost({ slug: 'usinage' });
        const senderHash = hashSender('203.0.113.22');
        for (const status of ['published', 'refused', 'published'] as const)
          await harness.seedComment({ postId: article.id, status, senderHash });

        const res = await post('usinage', COMMENT, '203.0.113.22');

        expect(res.status).toBe(202);
      });

      it('Given 100 pending comments, When any visitor sends one, Then 503: the moderation queue is closed', async () => {
        const article = await harness.seedPost({ slug: 'usinage' });
        for (let i = 0; i < 100; i += 1)
          await harness.seedComment({
            postId: article.id,
            status: 'pending',
            senderHash: String(i).padStart(64, '0'),
          });

        const res = await post('usinage', COMMENT);

        expect(res.status).toBe(503);
        expect(await errorMessage(res)).toBe(
          'Les commentaires sont momentanément fermés. Réessaie plus tard.',
        );
        expect(await harness.comments()).toHaveLength(100);
        expect(sendMail).not.toHaveBeenCalled();
      });

      it('Given a visitor, When it sends a 6th comment within the hour, Then 429 with Retry-After, invalid bodies included', async () => {
        await harness.seedPost({ slug: 'usinage' });
        const statuses: number[] = [];
        for (let i = 0; i < 5; i += 1)
          statuses.push((await post('usinage', {}, '203.0.113.30')).status);

        const sixth = await post('usinage', COMMENT, '203.0.113.30');

        expect(statuses).toEqual([400, 400, 400, 400, 400]);
        expect(sixth.status).toBe(429);
        expect(Number(sixth.headers.get('retry-after'))).toBeGreaterThan(0);
        expect(await harness.comments()).toEqual([]);
      });
    });

    describe('the published comments of a post are read', () => {
      const SECRET_EMAIL = 'do-not-leak@example.test';
      const SECRET_HASH = 'f'.repeat(64);
      const read = (slug: string, query = '') =>
        call(`/posts/${slug}/comments${query}`);
      const expectNoPersonalData = (text: string) => {
        expect(text).not.toContain(SECRET_EMAIL);
        expect(text).not.toContain(SECRET_HASH);
        expect(text).not.toMatch(/e-?mail|sender|hash/i);
      };

      it('Given a published post without comment, When its comments are read, Then an empty first page', async () => {
        await harness.seedPost({ slug: 'usinage' });

        const res = await read('usinage');

        expect(res.status).toBe(200);
        expect(await res.json()).toEqual({
          data: [],
          total: 0,
          page: 1,
          limit: 10,
        });
      });

      it('Given published comments and replies, When they are read, Then comments go from oldest to newest, each with its replies in the same order', async () => {
        const article = await harness.seedPost({ slug: 'usinage' });
        const at = (minute: number) =>
          new Date(Date.UTC(2026, 10, 2, 9, minute));
        const second = await harness.seedComment({
          postId: article.id,
          name: 'Dominique',
          body: 'Deuxième',
          createdAt: at(20),
        });
        const first = await harness.seedComment({
          postId: article.id,
          name: 'Camille',
          body: 'Premier',
          createdAt: at(10),
        });
        const late = await harness.seedComment({
          postId: article.id,
          parentId: first.id,
          owner: true,
          body: 'Réponse tardive',
          createdAt: at(40),
        });
        const early = await harness.seedComment({
          postId: article.id,
          parentId: first.id,
          name: 'Sacha',
          body: 'Réponse rapide',
          createdAt: at(30),
        });

        const res = await read('usinage');

        expect(res.status).toBe(200);
        expect(await res.json()).toEqual({
          data: [
            {
              id: first.id,
              author: { kind: 'visitor', name: 'Camille' },
              body: 'Premier',
              createdAt: '2026-11-02T09:10:00.000Z',
              replies: [
                {
                  id: early.id,
                  author: { kind: 'visitor', name: 'Sacha' },
                  body: 'Réponse rapide',
                  createdAt: '2026-11-02T09:30:00.000Z',
                },
                {
                  id: late.id,
                  author: { kind: 'owner' },
                  body: 'Réponse tardive',
                  createdAt: '2026-11-02T09:40:00.000Z',
                },
              ],
            },
            {
              id: second.id,
              author: { kind: 'visitor', name: 'Dominique' },
              body: 'Deuxième',
              createdAt: '2026-11-02T09:20:00.000Z',
              replies: [],
            },
          ],
          total: 2,
          page: 1,
          limit: 10,
        });
      });

      it('Given comments that are pending, refused or of another post, When the post is read, Then only its published comments and published replies appear', async () => {
        const article = await harness.seedPost({ slug: 'usinage' });
        const other = await harness.seedPost({ slug: 'tournage' });
        const visible = await harness.seedComment({ postId: article.id });
        const visibleReply = await harness.seedComment({
          postId: article.id,
          parentId: visible.id,
        });
        await harness.seedComment({
          postId: article.id,
          parentId: visible.id,
          status: 'pending',
        });
        await harness.seedComment({
          postId: article.id,
          parentId: visible.id,
          status: 'refused',
        });
        await harness.seedComment({ postId: article.id, status: 'pending' });
        await harness.seedComment({ postId: other.id });

        const body: unknown = await (await read('usinage')).json();

        expect(body).toMatchObject({
          total: 1,
          data: [{ id: visible.id, replies: [{ id: visibleReply.id }] }],
        });
      });

      it('Given a refused comment with a published reply, When the post is read, Then neither appears', async () => {
        const article = await harness.seedPost({ slug: 'usinage' });
        const refused = await harness.seedComment({
          postId: article.id,
          status: 'refused',
        });
        await harness.seedComment({
          postId: article.id,
          parentId: refused.id,
          owner: true,
        });

        const res = await read('usinage');

        expect(await res.json()).toMatchObject({ data: [], total: 0 });
      });

      it('Given 3 published comments with replies, When they are read 2 per page, Then the total counts comments only and each page carries its own replies', async () => {
        const article = await harness.seedPost({ slug: 'usinage' });
        const ids: string[] = [];
        const replyIds: string[] = [];
        for (let i = 0; i < 3; i += 1) {
          const comment = await harness.seedComment({ postId: article.id });
          const reply = await harness.seedComment({
            postId: article.id,
            parentId: comment.id,
          });
          ids.push(comment.id);
          replyIds.push(reply.id);
        }

        const first: unknown = await (await read('usinage', '?limit=2')).json();
        const second: unknown = await (
          await read('usinage', '?limit=2&page=2')
        ).json();

        expect(first).toMatchObject({
          data: [
            { id: ids[0], replies: [{ id: replyIds[0] }] },
            { id: ids[1], replies: [{ id: replyIds[1] }] },
          ],
          total: 3,
          page: 1,
          limit: 2,
        });
        expect(second).toMatchObject({
          data: [{ id: ids[2], replies: [{ id: replyIds[2] }] }],
          total: 3,
          page: 2,
          limit: 2,
        });
      });

      it.each([
        ['an unknown post', 'inconnu'],
        ['a draft', 'brouillon'],
      ])(
        'Given %s while a draft has comments in the database, When its comments are read, Then 404 without any of them',
        async (_, slug) => {
          const draft = await harness.seedPost({
            slug: 'brouillon',
            status: 'draft',
          });
          await harness.seedComment({
            postId: draft.id,
            email: SECRET_EMAIL,
            senderHash: SECRET_HASH,
          });

          const res = await read(slug);

          expect(res.status).toBe(404);
          const text = await res.text();
          expect(text).toContain('Article introuvable.');
          expectNoPersonalData(text);
        },
      );

      it('Given comments and replies whose rows carry an e-mail and a sender fingerprint, When they are read by the public, Then neither the values nor any such key leave the API', async () => {
        const article = await harness.seedPost({ slug: 'usinage' });
        const comment = await harness.seedComment({
          postId: article.id,
          email: SECRET_EMAIL,
          senderHash: SECRET_HASH,
        });
        await harness.seedComment({
          postId: article.id,
          parentId: comment.id,
          email: SECRET_EMAIL,
          senderHash: SECRET_HASH,
        });

        const res = await read('usinage');
        const text = await res.text();

        expect(res.status).toBe(200);
        expectNoPersonalData(text);
        const page = JSON.parse(text) as {
          data: (Record<string, unknown> & {
            author: Record<string, unknown>;
            replies: (Record<string, unknown> & {
              author: Record<string, unknown>;
            })[];
          })[];
        };
        const first = defined(page.data[0]);
        const reply = defined(first.replies[0]);
        expect(Object.keys(first).sort()).toEqual([
          'author',
          'body',
          'createdAt',
          'id',
          'replies',
        ]);
        expect(Object.keys(first.author).sort()).toEqual(['kind', 'name']);
        expect(Object.keys(reply).sort()).toEqual([
          'author',
          'body',
          'createdAt',
          'id',
        ]);
        expect(Object.keys(reply.author).sort()).toEqual(['kind', 'name']);
      });

      it.each([
        '?limit=0',
        '?limit=101',
        '?page=0',
        '?page=x',
        '?status=pending',
      ])(
        'Given the query %s, When the comments are read, Then 400 without any personal data',
        async (query) => {
          const article = await harness.seedPost({ slug: 'usinage' });
          await harness.seedComment({
            postId: article.id,
            email: SECRET_EMAIL,
            senderHash: SECRET_HASH,
          });

          const res = await read('usinage', query);

          expect(res.status).toBe(400);
          expectNoPersonalData(await res.text());
        },
      );

      it('Given a comment with markup, When it is read, Then the body is the text as written, served as JSON', async () => {
        const article = await harness.seedPost({ slug: 'usinage' });
        const body = '<img src=x onerror=alert(1)> & <app-root>';
        await harness.seedComment({ postId: article.id, body });

        const res = await read('usinage');

        expect(res.headers.get('content-type')).toMatch(/^application\/json/);
        expect(await res.json()).toMatchObject({ data: [{ body }] });
      });

      it('Given a visitor, When it reads comments 121 times in a minute, Then only the 121st gets 429', async () => {
        await harness.seedPost({ slug: 'usinage' });
        const statuses = new Set<number>();
        for (let i = 0; i < 120; i += 1)
          statuses.add(
            (await call('/posts/usinage/comments', { ip: '203.0.113.40' }))
              .status,
          );

        const last = await call('/posts/usinage/comments', {
          ip: '203.0.113.40',
        });

        expect([...statuses]).toEqual([200]);
        expect(last.status).toBe(429);
      });
    });

    describe('the owner lists, counts and moderates', () => {
      const list = (query = '') => call(`/comments${query}`);
      const moderate = (id: string, json: unknown, target = app) =>
        call(`/comments/${id}`, { method: 'PATCH', json }, target);
      const statusOf = async (id: string) =>
        (await harness.comments()).find((c) => c.id === id)?.status;

      it.each([
        ['GET', '/comments'],
        ['GET', '/comments/pending-count'],
        ['PATCH', `/comments/${UNKNOWN_ID}`],
      ])(
        'Given no session, When %s %s is called, Then 401',
        async (method, path) => {
          const res = await call(
            path,
            { method, json: { status: 'published' } },
            build(denyAll),
          );

          expect(res.status).toBe(401);
        },
      );

      it('Given no session, When a pending comment is moderated, Then 401 and it stays pending', async () => {
        const article = await harness.seedPost({ slug: 'usinage' });
        const comment = await harness.seedComment({
          postId: article.id,
          status: 'pending',
        });

        const res = await moderate(
          comment.id,
          { status: 'published' },
          build(denyAll),
        );

        expect(res.status).toBe(401);
        expect(await statusOf(comment.id)).toBe('pending');
      });

      it('Given comments on several posts, drafts included, When the owner lists them, Then newest first, with the post, the author and its e-mail, the parent and the number of replies', async () => {
        const article = await harness.seedPost({
          slug: 'usinage',
          title: 'Usinage 5 axes',
        });
        const draft = await harness.seedPost({
          slug: 'brouillon',
          title: 'Brouillon',
          status: 'draft',
        });
        const at = (minute: number) =>
          new Date(Date.UTC(2026, 10, 2, 9, minute));
        const parent = await harness.seedComment({
          postId: article.id,
          name: 'Camille',
          email: 'camille@example.test',
          body: 'Premier',
          createdAt: at(10),
          moderatedAt: at(15),
        });
        const ownerReply = await harness.seedComment({
          postId: article.id,
          parentId: parent.id,
          owner: true,
          body: 'Merci',
          createdAt: at(20),
        });
        const pendingReply = await harness.seedComment({
          postId: article.id,
          parentId: parent.id,
          status: 'pending',
          name: 'Sacha',
          email: 'sacha@example.test',
          body: 'Moi aussi',
          createdAt: at(30),
        });
        const onDraft = await harness.seedComment({
          postId: draft.id,
          status: 'refused',
          name: 'Dominique',
          email: 'dominique@example.test',
          body: 'Ancien',
          createdAt: at(5),
          moderatedAt: at(6),
        });

        const res = await list();

        const post = {
          id: article.id,
          slug: 'usinage',
          title: 'Usinage 5 axes',
        };
        const parentRef = {
          id: parent.id,
          author: { kind: 'visitor', name: 'Camille' },
          excerpt: 'Premier',
        };
        expect(res.status).toBe(200);
        expect(await res.json()).toEqual({
          data: [
            {
              id: pendingReply.id,
              post,
              parent: parentRef,
              author: {
                kind: 'visitor',
                name: 'Sacha',
                email: 'sacha@example.test',
              },
              body: 'Moi aussi',
              status: 'pending',
              createdAt: '2026-11-02T09:30:00.000Z',
              moderatedAt: null,
              replyCount: 0,
            },
            {
              id: ownerReply.id,
              post,
              parent: parentRef,
              author: { kind: 'owner' },
              body: 'Merci',
              status: 'published',
              createdAt: '2026-11-02T09:20:00.000Z',
              moderatedAt: '2026-11-02T09:20:00.000Z',
              replyCount: 0,
            },
            {
              id: parent.id,
              post,
              parent: null,
              author: {
                kind: 'visitor',
                name: 'Camille',
                email: 'camille@example.test',
              },
              body: 'Premier',
              status: 'published',
              createdAt: '2026-11-02T09:10:00.000Z',
              moderatedAt: '2026-11-02T09:15:00.000Z',
              replyCount: 2,
            },
            {
              id: onDraft.id,
              post: { id: draft.id, slug: 'brouillon', title: 'Brouillon' },
              parent: null,
              author: {
                kind: 'visitor',
                name: 'Dominique',
                email: 'dominique@example.test',
              },
              body: 'Ancien',
              status: 'refused',
              createdAt: '2026-11-02T09:05:00.000Z',
              moderatedAt: '2026-11-02T09:06:00.000Z',
              replyCount: 0,
            },
          ],
          total: 4,
          page: 1,
          limit: 10,
        });
      });

      it('Given a reply to a long comment, When the owner lists it, Then the parent is quoted by its first 140 characters', async () => {
        const article = await harness.seedPost({ slug: 'usinage' });
        const parent = await harness.seedComment({
          postId: article.id,
          body: `${'é'.repeat(139)}😀${'x'.repeat(60)}`,
        });
        await harness.seedComment({ postId: article.id, parentId: parent.id });

        const res = await list('?limit=1');

        expect(await res.json()).toMatchObject({
          data: [{ parent: { excerpt: `${'é'.repeat(139)}😀…` } }],
        });
      });

      it.each(['pending', 'published', 'refused'] as const)(
        'Given comments in every status, When the owner filters on %s, Then only those are listed and counted',
        async (status) => {
          const article = await harness.seedPost({ slug: 'usinage' });
          const ids: Record<string, string> = {};
          for (const each of ['pending', 'published', 'refused'] as const)
            ids[each] = (
              await harness.seedComment({ postId: article.id, status: each })
            ).id;

          const res = await list(`?status=${status}`);

          expect(await res.json()).toMatchObject({
            data: [{ id: ids[status], status }],
            total: 1,
          });
        },
      );

      it('Given 3 comments, When the owner reads them 2 per page, Then the second page holds the oldest and the total stays 3', async () => {
        const article = await harness.seedPost({ slug: 'usinage' });
        const ids: string[] = [];
        for (let i = 0; i < 3; i += 1)
          ids.push((await harness.seedComment({ postId: article.id })).id);

        const first = await list('?limit=2');
        const second = await list('?limit=2&page=2');

        expect(await first.json()).toMatchObject({
          data: [{ id: ids[2] }, { id: ids[1] }],
          total: 3,
          page: 1,
          limit: 2,
        });
        expect(await second.json()).toMatchObject({
          data: [{ id: ids[0] }],
          total: 3,
          page: 2,
          limit: 2,
        });
      });

      it.each(['?status=spam', '?limit=101', '?page=0', '?sort=asc'])(
        'Given the query %s, When the owner lists comments, Then 400',
        async (query) => {
          expect((await list(query)).status).toBe(400);
        },
      );

      it('Given 2 pending comments among others, When the owner reads the pending count, Then 2', async () => {
        const article = await harness.seedPost({ slug: 'usinage' });
        for (const status of [
          'pending',
          'pending',
          'published',
          'refused',
        ] as const)
          await harness.seedComment({ postId: article.id, status });

        const res = await call('/comments/pending-count');

        expect(res.status).toBe(200);
        expect(await res.json()).toEqual({ count: 2 });
      });

      it('Given a pending comment, When the owner publishes it, Then 200 with the moderated comment and the public thread shows it', async () => {
        const article = await harness.seedPost({ slug: 'usinage' });
        const comment = await harness.seedComment({
          postId: article.id,
          status: 'pending',
        });

        const res = await moderate(comment.id, { status: 'published' });
        const thread = await call('/posts/usinage/comments');

        expect(res.status).toBe(200);
        expect(await res.json()).toMatchObject({
          id: comment.id,
          status: 'published',
          moderatedAt: NOW.toISOString(),
          post: { slug: 'usinage' },
          author: { kind: 'visitor', email: 'camille@example.test' },
        });
        expect(await thread.json()).toMatchObject({
          data: [{ id: comment.id }],
        });
      });

      it.each([
        ['pending', 'refused'],
        ['published', 'refused'],
      ] as const)(
        'Given a %s comment, When the owner sets it to %s, Then 200 and the public thread does not show it',
        async (from, to) => {
          const article = await harness.seedPost({ slug: 'usinage' });
          const comment = await harness.seedComment({
            postId: article.id,
            status: from,
          });

          const res = await moderate(comment.id, { status: to });
          const thread = await call('/posts/usinage/comments');

          expect(res.status).toBe(200);
          expect(await res.json()).toMatchObject({
            status: to,
            moderatedAt: NOW.toISOString(),
          });
          expect(await thread.json()).toMatchObject({ data: [], total: 0 });
        },
      );

      it.each([
        ['published', 'published'],
        ['refused', 'refused'],
        ['refused', 'published'],
      ] as const)(
        'Given a %s comment, When the owner sets it to %s, Then 409 and nothing changes',
        async (from, to) => {
          const article = await harness.seedPost({ slug: 'usinage' });
          const comment = await harness.seedComment({
            postId: article.id,
            status: from,
          });

          const res = await moderate(comment.id, { status: to });

          expect(res.status).toBe(409);
          expect(await errorMessage(res)).toBe(
            'Ce commentaire ne peut pas passer à ce statut.',
          );
          expect((await harness.comments())[0]).toEqual(comment);
        },
      );

      it.each(['pending', 'refused'] as const)(
        'Given a pending reply under a %s comment, When the owner publishes the reply, Then 409: the parent comes first',
        async (parentStatus) => {
          const article = await harness.seedPost({ slug: 'usinage' });
          const parent = await harness.seedComment({
            postId: article.id,
            status: parentStatus,
          });
          const reply = await harness.seedComment({
            postId: article.id,
            parentId: parent.id,
            status: 'pending',
          });

          const res = await moderate(reply.id, { status: 'published' });

          expect(res.status).toBe(409);
          expect(await errorMessage(res)).toBe(
            'Publie d’abord le commentaire auquel cette réponse est rattachée.',
          );
          expect(await statusOf(reply.id)).toBe('pending');
        },
      );

      it('Given a pending reply under a published comment, When the owner publishes it, Then it appears under its parent', async () => {
        const article = await harness.seedPost({ slug: 'usinage' });
        const parent = await harness.seedComment({ postId: article.id });
        const reply = await harness.seedComment({
          postId: article.id,
          parentId: parent.id,
          status: 'pending',
        });

        const res = await moderate(reply.id, { status: 'published' });
        const thread = await call('/posts/usinage/comments');

        expect(res.status).toBe(200);
        expect(await thread.json()).toMatchObject({
          data: [{ id: parent.id, replies: [{ id: reply.id }] }],
        });
      });

      it('Given an unknown comment, When the owner moderates it, Then 404', async () => {
        const res = await moderate(UNKNOWN_ID, { status: 'published' });

        expect(res.status).toBe(404);
        expect(await errorMessage(res)).toBe('Commentaire introuvable.');
      });

      it.each([
        ['an id that is not a UUID', 'not-a-uuid', { status: 'published' }],
        ['the pending status', UNKNOWN_ID, { status: 'pending' }],
        ['an unknown status', UNKNOWN_ID, { status: 'spam' }],
        ['no status', UNKNOWN_ID, {}],
        ['an unknown field', UNKNOWN_ID, { status: 'refused', body: 'x' }],
      ])(
        'Given %s, When the owner moderates, Then 400',
        async (_, id, json) => {
          expect((await moderate(id, json)).status).toBe(400);
        },
      );

      it('Given a moderation session, When the owner moderates 61 times in a minute, Then only the 61st gets 429', async () => {
        const statuses = new Set<number>();
        const patch = () =>
          call(`/comments/${UNKNOWN_ID}`, {
            method: 'PATCH',
            json: { status: 'refused' },
            ip: '203.0.113.50',
          });
        for (let i = 0; i < 60; i += 1) statuses.add((await patch()).status);

        expect([...statuses]).toEqual([404]);
        expect((await patch()).status).toBe(429);
      });
    });

    describe('the owner deletes and replies', () => {
      const remove = (id: string, target = app) =>
        call(`/comments/${id}`, { method: 'DELETE' }, target);
      const answer = (id: string, json: unknown, target = app) =>
        call(`/comments/${id}/replies`, { method: 'POST', json }, target);
      const ids = async () => (await harness.comments()).map((c) => c.id);

      it('Given no session, When a comment is deleted or answered, Then 401 and nothing changes', async () => {
        const article = await harness.seedPost({ slug: 'usinage' });
        const comment = await harness.seedComment({ postId: article.id });
        const closed = build(denyAll);

        const deleted = await remove(comment.id, closed);
        const answered = await answer(comment.id, { body: 'Merci' }, closed);

        expect([deleted.status, answered.status]).toEqual([401, 401]);
        expect(await ids()).toEqual([comment.id]);
      });

      it('Given a comment with replies, When the owner deletes it, Then 204 without body, its replies go with it and the others stay', async () => {
        const article = await harness.seedPost({ slug: 'usinage' });
        const kept = await harness.seedComment({ postId: article.id });
        const comment = await harness.seedComment({ postId: article.id });
        await harness.seedComment({ postId: article.id, parentId: comment.id });
        await harness.seedComment({
          postId: article.id,
          parentId: comment.id,
          owner: true,
        });

        const res = await remove(comment.id);
        const thread = await call('/posts/usinage/comments');

        expect(res.status).toBe(204);
        expect(await res.text()).toBe('');
        expect(await ids()).toEqual([kept.id]);
        expect(await thread.json()).toMatchObject({
          data: [{ id: kept.id, replies: [] }],
          total: 1,
        });
      });

      it('Given a reply, When the owner deletes it, Then its parent and the other replies stay', async () => {
        const article = await harness.seedPost({ slug: 'usinage' });
        const parent = await harness.seedComment({ postId: article.id });
        const reply = await harness.seedComment({
          postId: article.id,
          parentId: parent.id,
        });
        const other = await harness.seedComment({
          postId: article.id,
          parentId: parent.id,
        });

        const res = await remove(reply.id);

        expect(res.status).toBe(204);
        expect(await ids()).toEqual([parent.id, other.id]);
      });

      it('Given a comment already deleted, When the owner deletes it again, Then 404', async () => {
        const article = await harness.seedPost({ slug: 'usinage' });
        const comment = await harness.seedComment({ postId: article.id });
        await remove(comment.id);

        const res = await remove(comment.id);

        expect(res.status).toBe(404);
        expect(await errorMessage(res)).toBe('Commentaire introuvable.');
      });

      it('Given an id that is not a UUID, When the owner deletes or answers, Then 400', async () => {
        const deleted = await remove('not-a-uuid');
        const answered = await answer('not-a-uuid', { body: 'Merci' });

        expect([deleted.status, answered.status]).toEqual([400, 400]);
      });

      it('Given a published comment, When the owner answers it, Then 201 with a reply published at once, signed by the owner, without notification', async () => {
        const article = await harness.seedPost({ slug: 'usinage' });
        const parent = await harness.seedComment({
          postId: article.id,
          name: 'Camille',
          body: 'Une question',
        });

        const res = await answer(parent.id, { body: '  Avec plaisir.\r\n ' });
        await flushMails();
        const thread = await call('/posts/usinage/comments');

        expect(res.status).toBe(201);
        const created = (await harness.comments()).find(
          (c) => c.id !== parent.id,
        );
        expect(created).toMatchObject({
          postId: article.id,
          parentId: parent.id,
          depth: 1,
          status: 'published',
          moderatedAt: NOW,
          authorKind: 'owner',
          authorName: null,
          authorEmail: null,
          senderHash: null,
          body: 'Avec plaisir.',
        });
        expect(await res.json()).toMatchObject({
          id: defined(created).id,
          post: { id: article.id, slug: 'usinage' },
          parent: {
            id: parent.id,
            author: { kind: 'visitor', name: 'Camille' },
            excerpt: 'Une question',
          },
          author: { kind: 'owner' },
          body: 'Avec plaisir.',
          status: 'published',
          moderatedAt: NOW.toISOString(),
          replyCount: 0,
        });
        expect(await thread.json()).toMatchObject({
          data: [
            {
              id: parent.id,
              replies: [{ author: { kind: 'owner' }, body: 'Avec plaisir.' }],
            },
          ],
        });
        expect(sendMail).not.toHaveBeenCalled();
      });

      it.each(['pending', 'refused'] as const)(
        'Given a %s comment, When the owner answers it, Then 409: publish first, and nothing is stored',
        async (status) => {
          const article = await harness.seedPost({ slug: 'usinage' });
          const parent = await harness.seedComment({
            postId: article.id,
            status,
          });

          const res = await answer(parent.id, { body: 'Merci' });

          expect(res.status).toBe(409);
          expect(await errorMessage(res)).toBe(
            'Publie d’abord ce commentaire avant d’y répondre.',
          );
          expect(await ids()).toEqual([parent.id]);
        },
      );

      it('Given a reply, When the owner answers it, Then 409: one level only', async () => {
        const article = await harness.seedPost({ slug: 'usinage' });
        const parent = await harness.seedComment({ postId: article.id });
        const reply = await harness.seedComment({
          postId: article.id,
          parentId: parent.id,
        });

        const res = await answer(reply.id, { body: 'Merci' });

        expect(res.status).toBe(409);
        expect(await errorMessage(res)).toBe(
          'Tu ne peux pas répondre à une réponse.',
        );
        expect(await ids()).toEqual([parent.id, reply.id]);
      });

      it('Given an unknown comment, When the owner answers it, Then 404', async () => {
        const res = await answer(UNKNOWN_ID, { body: 'Merci' });

        expect(res.status).toBe(404);
        expect(await errorMessage(res)).toBe('Commentaire introuvable.');
      });

      it.each([
        ['a one-letter body', { body: 'x' }],
        ['a body over 2 000 characters', { body: 'x'.repeat(2001) }],
        ['a control character', { body: 'texte\u0000' }],
        ['no body', {}],
        ['an unknown field', { body: 'Merci', name: 'Julien' }],
      ])(
        'Given %s, When the owner answers, Then 400 and nothing is stored',
        async (_, json) => {
          const article = await harness.seedPost({ slug: 'usinage' });
          const parent = await harness.seedComment({ postId: article.id });

          const res = await answer(parent.id, json);

          expect(res.status).toBe(400);
          expect(await ids()).toEqual([parent.id]);
        },
      );
    });

    describe('refused comments expire', () => {
      const DAY_MS = 86_400_000;
      const daysAgo = (days: number) => new Date(NOW.getTime() - days * DAY_MS);
      const purge = () =>
        new BlogCommentsService(
          harness.store,
          { sendMail },
          hashSender,
          () => NOW,
        ).purgeExpired();
      const ids = async () => (await harness.comments()).map((c) => c.id);

      it('Given comments refused 31, 30 and 29 days ago, When the daily purge runs, Then only the one refused more than 30 days ago is deleted', async () => {
        const article = await harness.seedPost({ slug: 'usinage' });
        const refused = (days: number, minute: number) =>
          harness.seedComment({
            postId: article.id,
            status: 'refused',
            createdAt: new Date(Date.UTC(2026, 8, 1, 8, minute)),
            moderatedAt: daysAgo(days),
          });
        await refused(31, 1);
        const onTheDay = await refused(30, 2);
        const recent = await refused(29, 3);

        await purge();

        expect(await ids()).toEqual([onTheDay.id, recent.id]);
      });

      it('Given old published and pending comments, When the daily purge runs, Then they are kept: only refusals expire', async () => {
        const article = await harness.seedPost({ slug: 'usinage' });
        const old = new Date(Date.UTC(2026, 5, 1, 8, 0));
        const published = await harness.seedComment({
          postId: article.id,
          createdAt: old,
          moderatedAt: daysAgo(90),
        });
        const pending = await harness.seedComment({
          postId: article.id,
          status: 'pending',
          createdAt: new Date(old.getTime() + 60_000),
        });

        await purge();

        expect(await ids()).toEqual([published.id, pending.id]);
      });

      it('Given an expired refusal with replies, When the daily purge runs, Then its replies go with it', async () => {
        const article = await harness.seedPost({ slug: 'usinage' });
        const refused = await harness.seedComment({
          postId: article.id,
          status: 'refused',
          moderatedAt: daysAgo(40),
        });
        await harness.seedComment({
          postId: article.id,
          parentId: refused.id,
          owner: true,
        });

        await purge();

        expect(await ids()).toEqual([]);
      });
    });
  });
}
