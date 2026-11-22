import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { expectApiError } from './api-error';
import { newVisitor, type ApiResponse } from './client';
import { adminSession } from './session';

const STALE = /^Une version plus récente de (cet article|ce projet) a été enregistrée ailleurs/;
const MALFORMED =
  'En-tête If-Match invalide : une seule version attendue, entre guillemets (par exemple "3").';

type Json = Readonly<Record<string, unknown>>;
const isJson = (value: unknown): value is Json =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const field = (response: ApiResponse, key: string): unknown =>
  isJson(response.body) ? response.body[key] : undefined;
const records = (response: ApiResponse): Json[] =>
  (Array.isArray(response.body) ? response.body : []).filter(isJson);

// Écriture conditionnelle des articles et des projets : version entière exposée, ETag fort,
// `If-Match: "<version>"` facultatif, 412 sur une version périmée, 409 réservé au slug déjà pris.
describe.each([
  {
    label: 'blog post',
    collection: '/api/blog/posts',
    create: () => ({
      title: `Parité version ${randomUUID()}`,
      excerpt: 'Article de la suite de parité',
      contentMarkdown: '# Corps',
      status: 'published',
    }),
    patch: (text: string) => ({ excerpt: text }),
    publicRead: (created: ApiResponse) => `/api/blog/posts/${String(field(created, 'slug'))}`,
    lists: ['/api/blog/posts', '/api/blog/posts/admin'],
    // Le slug d'un article publié est figé : seul un brouillon prend le slug de son nouveau titre.
    renamable: { status: 'draft' },
  },
  {
    label: 'project',
    collection: '/api/projects',
    create: () => ({
      title: `Parité version ${randomUUID()}`,
      category: 'Web',
      description: 'Projet de la suite de parité',
    }),
    patch: (text: string) => ({ description: text }),
    publicRead: (created: ApiResponse) => `/api/projects/${String(field(created, 'id'))}`,
    lists: ['/api/projects'],
    renamable: {},
  },
])('$label version', ({ collection, create, patch, publicRead, lists, renamable }) => {
  let session = '';
  let created: ApiResponse;
  let path = '';

  const admin = (method: string, url: string, json?: unknown, ifMatch?: string) =>
    newVisitor().request(method, url, {
      session,
      ...(json === undefined ? {} : { json }),
      ...(ifMatch === undefined ? {} : { headers: { 'if-match': ifMatch } }),
    });

  beforeAll(async () => {
    session = await adminSession();
    created = await admin('POST', collection, create());
    expect(created.status, created.text).toBe(201);
    path = `${collection}/${String(field(created, 'id'))}`;
  });

  afterAll(async () => {
    if (path) await admin('DELETE', path);
  });

  it('Given a creation, When answered, Then the entity starts at version 1 with the strong ETag "1"', () => {
    expect(field(created, 'version')).toBe(1);
    expect(created.headers.get('etag')).toBe('"1"');
  });

  it('Given an entity, When read publicly and listed, Then its version is exposed and the read carries its ETag', async () => {
    const read = await newVisitor().request('GET', publicRead(created));

    expect(read.status, read.text).toBe(200);
    expect(read.headers.get('etag')).toBe(`"${String(field(read, 'version'))}"`);
    for (const list of lists) {
      const listed = records(await admin('GET', list)).find(
        (entity) => entity['id'] === field(created, 'id'),
      );
      expect(listed?.['version'], list).toBe(field(read, 'version'));
    }
  });

  it('Given the current version in If-Match, When patched, Then 200, version + 1 and the new ETag', async () => {
    const current = Number(
      field(await newVisitor().request('GET', publicRead(created)), 'version'),
    );

    const response = await admin('PATCH', path, patch('Version courante'), `"${current}"`);

    expect(response.status, response.text).toBe(200);
    expect(field(response, 'version')).toBe(current + 1);
    expect(response.headers.get('etag')).toBe(`"${current + 1}"`);
  });

  it('Given a stale version in If-Match, When patched, Then 412 in the API error format and nothing is written', async () => {
    const before = await newVisitor().request('GET', publicRead(created));
    const stale = Number(field(before, 'version')) - 1;

    const response = await admin('PATCH', path, patch('Brouillon périmé'), `"${stale}"`);

    expectApiError(response, 412, path);
    expect(field(response, 'error')).toBe('Precondition Failed');
    expect(field(response, 'message')).toMatch(STALE);
    const after = await newVisitor().request('GET', publicRead(created));
    expect(after.body).toEqual(before.body);
  });

  it.each(['3', 'W/"1"', '*', '"1", "2"', '"0"', '"abc"'])(
    'Given the malformed If-Match %j, When patched, Then 400 in the API error format',
    async (header) => {
      const response = await admin('PATCH', path, patch('Jamais écrit'), header);

      expectApiError(response, 400, path);
      expect(field(response, 'message')).toBe(MALFORMED);
    },
  );

  it('Given no If-Match, When patched, Then the write is unconditional, as for a client that ignores versions', async () => {
    const current = Number(
      field(await newVisitor().request('GET', publicRead(created)), 'version'),
    );

    const response = await admin('PATCH', path, patch('Sans condition'));

    expect(response.status, response.text).toBe(200);
    expect(field(response, 'version')).toBe(current + 1);
  });

  it('Given the title of another entity and the current If-Match, When patched, Then 409 for the slug, not 412, and nothing is written', async () => {
    const other = await admin('POST', collection, { ...create(), ...renamable });
    const otherPath = `${collection}/${String(field(other, 'id'))}`;
    const before = await newVisitor().request('GET', publicRead(created));

    const response = await admin(
      'PATCH',
      otherPath,
      { title: String(field(created, 'title')) },
      `"${String(field(other, 'version'))}"`,
    );
    await admin('DELETE', otherPath);

    expectApiError(response, 409, otherPath);
    const after = await newVisitor().request('GET', publicRead(created));
    expect(after.body).toEqual(before.body);
  });

  it('Given a deleted entity, When patched with If-Match, Then 404, not 412', async () => {
    const other = await admin('POST', collection, create());
    const otherPath = `${collection}/${String(field(other, 'id'))}`;
    await admin('DELETE', otherPath);

    expectApiError(await admin('PATCH', otherPath, patch('Trop tard'), '"1"'), 404, otherPath);
  });
});
