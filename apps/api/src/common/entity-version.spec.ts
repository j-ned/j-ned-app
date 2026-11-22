import { Hono } from 'hono';
import { BadRequestException, ConflictException } from './http-errors';
import {
  assertVersion,
  entityTag,
  ifMatchVersion,
  replyVersioned,
} from './entity-version';
import { testApp } from '../testing/test-app';
import type { AppEnv } from './http';

// L'en-tête lu par une route de test : la version attendue, ou `null` sans en-tête.
const app = testApp(
  '/t',
  new Hono<AppEnv>()
    .patch('/', (c) => c.json({ expected: ifMatchVersion(c) ?? null }))
    .get('/', (c) => replyVersioned(c, { id: 'a', version: 7 }))
    .post('/', (c) => replyVersioned(c, { id: 'a', version: 1 }, 201)),
);

const patch = (ifMatch?: string) =>
  app.request('/t', {
    method: 'PATCH',
    headers: ifMatch === undefined ? {} : { 'if-match': ifMatch },
  });

describe('If-Match version', () => {
  it('Given no If-Match header, When read, Then no version is expected', async () => {
    const res = await patch();

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ expected: null });
  });

  it.each([
    ['"1"', 1],
    ['"42"', 42],
    ['"2147483647"', 2147483647],
  ])(
    'Given If-Match %s, When read, Then version %d is expected',
    async (header, version) => {
      const res = await patch(header);

      expect(await res.json()).toEqual({ expected: version });
    },
  );

  it.each([
    ['3'],
    ['W/"3"'],
    ['"0"'],
    ['"03"'],
    ['"-1"'],
    ['"abc"'],
    ['"1.5"'],
    ['*'],
    ['"1", "2"'],
    ['"2147483648"'],
    [''],
  ])(
    'Given the malformed If-Match %j, When read, Then 400 in the API error format',
    async (header) => {
      const res = await patch(header);

      expect(res.status).toBe(400);
      expect(await res.json()).toMatchObject({
        statusCode: 400,
        message:
          'En-tête If-Match invalide : une seule version attendue, entre guillemets (par exemple "3").',
      });
    },
  );
});

describe('versioned reply', () => {
  it('Given an entity, When replied, Then its version is the strong ETag of the response', async () => {
    const res = await app.request('/t');

    expect(res.status).toBe(200);
    expect(res.headers.get('etag')).toBe('"7"');
    expect(await res.json()).toEqual({ id: 'a', version: 7 });
  });

  it('Given a creation, When replied with 201, Then the ETag is set too', async () => {
    const res = await app.request('/t', { method: 'POST' });

    expect(res.status).toBe(201);
    expect(res.headers.get('etag')).toBe('"1"');
  });

  it('Given a version, When tagged, Then the tag is the version between double quotes', () => {
    expect(entityTag(12)).toBe('"12"');
  });
});

describe('assertVersion', () => {
  it('Given no expected version, When asserted, Then nothing is thrown', () => {
    expect(() =>
      assertVersion({ version: 3 }, undefined, 'périmé'),
    ).not.toThrow();
  });

  it('Given the current version, When asserted, Then nothing is thrown', () => {
    expect(() => assertVersion({ version: 3 }, 3, 'périmé')).not.toThrow();
  });

  it('Given another version, When asserted, Then 409 with the given message', () => {
    expect(() => assertVersion({ version: 4 }, 3, 'périmé')).toThrow(
      new ConflictException('périmé'),
    );
  });

  it('Given a malformed header, When parsed, Then the error is a BadRequestException', async () => {
    const thrown = await new Hono<AppEnv>()
      .onError((error, c) =>
        c.json({ badRequest: error instanceof BadRequestException }, 400),
      )
      .patch('/', (c) => c.json(ifMatchVersion(c) ?? null))
      .request('/', { method: 'PATCH', headers: { 'if-match': 'x' } });

    expect(await thrown.json()).toEqual({ badRequest: true });
  });
});
