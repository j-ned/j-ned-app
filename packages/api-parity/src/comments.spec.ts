import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { expectApiError } from './api-error';
import { newVisitor, type ApiResponse } from './client';
import { adminSession } from './session';

const EMAIL = 'lecteur.parite@parity.test';
const COMMENT = { name: 'Lecteur Parité', email: EMAIL, body: 'Merci <b>beaucoup</b> !' };

type Json = Record<string, unknown>;
const asObject = (value: unknown): Json => (value ?? {}) as Json;
const page = (response: ApiResponse): Json[] => (asObject(response.body)['data'] ?? []) as Json[];

describe('blog comments', () => {
  let session = '';
  let postId = '';
  let slug = '';

  const admin = (method: string, path: string, json?: unknown) =>
    newVisitor().request(method, path, { session, ...(json === undefined ? {} : { json }) });
  const publicThread = () => newVisitor().request('GET', `/api/blog/posts/${slug}/comments`);
  const pending = async (): Promise<Json[]> =>
    page(await admin('GET', '/api/blog/comments?status=pending&limit=100'));

  beforeAll(async () => {
    session = await adminSession();
    const created = await admin('POST', '/api/blog/posts', {
      title: `Parité commentaires ${Date.now()}`,
      excerpt: 'Article de la suite de parité',
      contentMarkdown: '# Corps',
      status: 'published',
    });
    expect(created.status, created.text).toBe(201);
    postId = String(asObject(created.body)['id']);
    slug = String(asObject(created.body)['slug']);
  });

  afterAll(async () => {
    if (postId) await admin('DELETE', `/api/blog/posts/${postId}`);
  });

  it('Given a published post without comment, When its comments are read, Then an empty page is served', async () => {
    const response = await publicThread();

    expect(response.status, response.text).toBe(200);
    expect(response.body).toEqual({ data: [], total: 0, page: 1, limit: 10 });
  });

  it('Given an unknown post, When its comments are read or written, Then 404 in the API error format', async () => {
    const path = '/api/blog/posts/parity-unknown-slug/comments';

    expectApiError(await newVisitor().request('GET', path), 404, path);
    expectApiError(await newVisitor().request('POST', path, { json: COMMENT }), 404, path);
  });

  it('Given a comment sent by a visitor, When the owner publishes it and answers, Then the public thread shows both and never the e-mail', async () => {
    const sent = await newVisitor().request('POST', `/api/blog/posts/${slug}/comments`, {
      json: COMMENT,
    });
    expect(sent.status, sent.text).toBe(202);
    expect(sent.text).toBe('');

    // En attente : visible du propriétaire avec l'adresse, invisible du public.
    const [waiting] = (await pending()).filter((row) => asObject(row['post'])['id'] === postId);
    expect(waiting?.['author']).toEqual({ kind: 'visitor', name: COMMENT.name, email: EMAIL });
    expect((await publicThread()).body).toMatchObject({ data: [], total: 0 });
    const id = String(waiting?.['id']);
    const count = await admin('GET', '/api/blog/comments/pending-count');
    expect(asObject(count.body)['count']).toBeGreaterThanOrEqual(1);

    const published = await admin('PATCH', `/api/blog/comments/${id}`, { status: 'published' });
    expect(published.status, published.text).toBe(200);
    expect(asObject(published.body)['status']).toBe('published');
    const again = await admin('PATCH', `/api/blog/comments/${id}`, { status: 'published' });
    expectApiError(again, 409, `/api/blog/comments/${id}`);

    const reply = await admin('POST', `/api/blog/comments/${id}/replies`, {
      body: 'Avec plaisir.',
    });
    expect(reply.status, reply.text).toBe(201);

    const thread = await publicThread();
    expect(thread.status, thread.text).toBe(200);
    const [comment] = page(thread);
    expect(Object.keys(comment ?? {}).sort()).toEqual([
      'author',
      'body',
      'createdAt',
      'id',
      'replies',
    ]);
    expect(comment).toMatchObject({
      id,
      author: { kind: 'visitor', name: COMMENT.name },
      body: COMMENT.body,
      replies: [{ author: { kind: 'owner' }, body: 'Avec plaisir.' }],
    });
    expect(thread.text).not.toContain(EMAIL);
    expect(thread.text).not.toMatch(/"(email|authorEmail|senderHash)"/i);

    const removed = await admin('DELETE', `/api/blog/comments/${id}`);
    expect(removed.status, removed.text).toBe(204);
    expect((await publicThread()).body).toMatchObject({ data: [], total: 0 });
    expectApiError(
      await admin('DELETE', `/api/blog/comments/${id}`),
      404,
      `/api/blog/comments/${id}`,
    );
  });

  it('Given a filled trap field, When the comment is sent, Then it is answered like an accepted one and the moderation queue does not change', async () => {
    const before = (await pending()).length;

    const sent = await newVisitor().request('POST', `/api/blog/posts/${slug}/comments`, {
      json: { ...COMMENT, website: 'https://spam.test' },
    });

    expect(sent.status, sent.text).toBe(202);
    expect(sent.text).toBe('');
    expect((await pending()).length).toBe(before);
  });

  it('Given an invalid comment, When it is refused, Then the error does not repeat the address', async () => {
    const response = await newVisitor().request('POST', `/api/blog/posts/${slug}/comments`, {
      json: { ...COMMENT, email: 'private.person@', notify: true },
    });

    expectApiError(response, 400);
    expect(response.text).not.toContain('private.person');
  });
});
