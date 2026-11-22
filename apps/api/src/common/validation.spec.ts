import * as z from 'zod';
import { trackEventSchema } from '../analytics/dto/track-event.dto';
import { createBlogPostSchema } from '../blog/dto/create-blog-post.dto';
import { BadRequestException } from './http-errors';
import { paginationSchema } from './pagination';
import { formatIssues, NOT_AN_OBJECT_MESSAGE, validateDto } from './validation';

// Échoue si le corps est accepté.
function messagesOf(schema: z.ZodType, body: unknown): string[] {
  try {
    validateDto(schema, body);
  } catch (error) {
    expect(error).toBeInstanceOf(BadRequestException);
    return (error as BadRequestException).messages as string[];
  }
  throw new Error('body accepted');
}

const sectionSchema = z.strictObject({ name: z.string().max(5) });
const parentSchema = z.strictObject({
  title: z.string(),
  section: sectionSchema,
  items: z.array(sectionSchema).optional(),
});
const valid = { title: 'T', section: { name: 'N' } };

describe('validateDto', () => {
  it('Given a valid body, When validated, Then the parsed value is returned', () => {
    expect(validateDto(parentSchema, valid)).toEqual(valid);
  });

  it('Given an unknown top-level key, When validated, Then it is refused with the zod (French) message', () => {
    expect(messagesOf(parentSchema, { ...valid, isAdmin: true })).toEqual([
      'Clé non reconnue : "isAdmin"',
    ]);
  });

  it('Given unknown keys in a nested object and a list item, When validated, Then each is refused under its parent path', () => {
    expect(
      messagesOf(parentSchema, {
        ...valid,
        section: { name: 'N', extra: 1 },
        items: [{ name: 'N' }, { name: 'N', other: 2 }],
      }),
    ).toEqual([
      'section: Clé non reconnue : "extra"',
      'items.1: Clé non reconnue : "other"',
    ]);
  });

  it('Given an invalid nested field, When validated, Then the message is prefixed with its dotted path', () => {
    const messages = messagesOf(parentSchema, {
      ...valid,
      items: [{ name: 'N' }, { name: 'toolong' }],
    });

    expect(messages).toHaveLength(1);
    expect(messages[0]).toMatch(/^items\.1\.name: /);
  });

  it('Given a number for a string field of a JSON body, When validated, Then it is refused (no implicit conversion)', () => {
    expect(messagesOf(parentSchema, { ...valid, title: 42 })).toEqual([
      expect.stringMatching(/^title: /) as string,
    ]);
  });

  it.each([[[]], [[valid]], ['texte'], [42], [true]])(
    'Given the non-object body %p, When validated, Then it is refused first, then validated as {}',
    (body) => {
      const messages = messagesOf(parentSchema, body);

      expect(messages[0]).toBe(NOT_AN_OBJECT_MESSAGE);
      expect(messages.slice(1).map((m) => m.split(':')[0])).toEqual([
        'title',
        'section',
      ]);
    },
  );

  it('Given a null body, When validated, Then it is validated as {} without the JSON object message', () => {
    expect(messagesOf(parentSchema, null).map((m) => m.split(':')[0])).toEqual([
      'title',
      'section',
    ]);
  });

  it('Given a non-object body and a schema that requires nothing, When validated, Then it is still refused', () => {
    expect(messagesOf(paginationSchema, ['x'])).toEqual([
      NOT_AN_OBJECT_MESSAGE,
    ]);
  });

  it('Given __proto__ keys at any depth, When validated, Then they are dropped without error', () => {
    const body = JSON.parse(
      '{"title":"T","__proto__":{"isAdmin":true},"section":{"name":"N","__proto__":{"x":1}}}',
    ) as unknown;

    const dto = validateDto(parentSchema, body);

    expect(dto).toEqual(valid);
    expect(Object.getPrototypeOf(dto)).toBe(Object.prototype);
    expect((dto as Record<string, unknown>).isAdmin).toBeUndefined();
  });

  it.each(['constructor', 'toString', 'hasOwnProperty'])(
    'Given the unknown key %s, When validated, Then it is refused (400, never a 500)',
    (key) => {
      expect(
        messagesOf(
          parentSchema,
          JSON.parse(`{"title":"T","section":{"name":"N"},"${key}":1}`),
        ),
      ).toEqual([`Clé non reconnue : "${key}"`]);
    },
  );

  it('Given a constructor key in a free object, When validated, Then it is accepted as data (was a 500)', () => {
    const body = {
      type: 'project_click',
      metadata: { constructor: 'x' },
    };

    expect(validateDto(trackEventSchema, body)).toEqual(body);
  });

  it('Given a constructor key nested in a free object, When validated, Then it is a 400, metadata being flat (was a 500)', () => {
    expect(
      messagesOf(trackEventSchema, {
        type: 'project_click',
        metadata: { a: { constructor: 'x' } },
      }),
    ).toEqual([expect.stringMatching(/^metadata/) as string]);
  });

  it('Given an object with a non-callable toString for a text field, When validated, Then it is a 400 (was a 500)', () => {
    expect(
      messagesOf(createBlogPostSchema, {
        title: { toString: 1 },
        excerpt: 'E',
        contentMarkdown: 'C',
      }),
    ).toEqual([expect.stringMatching(/^title: /) as string]);
  });
});

describe('validateDto - deeply nested JSON', () => {
  // 40 000 niveaux tiennent dans 80 ko : sous la limite de 100 ko d'un corps JSON.
  const DEPTH = 40_000;
  const nestedArrays = `${'['.repeat(DEPTH)}${']'.repeat(DEPTH)}`;

  it('Given an unknown key holding 40 000 nested lists, When validated, Then a 400 names the key (was a stack overflow, 500)', () => {
    const body: unknown = JSON.parse(
      `{"title":"T","section":{"name":"N"},"x":${nestedArrays}}`,
    );

    expect(messagesOf(parentSchema, body)).toEqual(['Clé non reconnue : "x"']);
  });

  it('Given a known text field holding 40 000 nested lists, When validated, Then a 400 on that field', () => {
    const body: unknown = JSON.parse(
      `{"title":${nestedArrays},"section":{"name":"N"}}`,
    );

    expect(messagesOf(parentSchema, body)).toEqual([
      expect.stringMatching(/^title: /) as string,
    ]);
  });

  it('Given a __proto__ key 40 000 objects deep, When validated, Then it is dropped there too', () => {
    const body: unknown = JSON.parse(
      `{"deep":${'{"a":'.repeat(DEPTH)}{"__proto__":{"isAdmin":true},"leaf":1}${'}'.repeat(DEPTH)}}`,
    );

    const dto = validateDto(z.strictObject({ deep: z.unknown() }), body);

    let node: unknown = dto.deep;
    for (let level = 0; level < DEPTH; level += 1) {
      node =
        typeof node === 'object' && node !== null && 'a' in node
          ? node.a
          : undefined;
    }
    expect(node).toEqual({ leaf: 1 });
    expect(
      typeof node === 'object' && node !== null && Object.keys(node),
    ).toEqual(['leaf']);
  });
});

describe('validateDto - query string conversion', () => {
  it.each([
    [
      { page: '2', limit: '20' },
      { page: 2, limit: 20 },
    ],
    [{}, {}],
  ])('Given %p, When validated, Then numbers are converted', (query, dto) => {
    expect(validateDto(paginationSchema, query)).toEqual(dto);
  });

  it.each([
    [{ page: 'abc' }, 'page'],
    [{ page: '' }, 'page'],
    [{ page: '0' }, 'page'],
    [{ limit: '1.5' }, 'limit'],
    [{ limit: '101' }, 'limit'],
    [{ limit: ['1', '2'] }, 'limit'],
  ])('Given %p, When validated, Then %s is refused', (query, field) => {
    expect(
      messagesOf(paginationSchema, query).map((m) => m.split(':')[0]),
    ).toEqual([field]);
  });
});

describe('formatIssues', () => {
  it('Given issues at the root and nested, When formatted, Then one line per issue, in order, path first', () => {
    expect(
      formatIssues([
        { path: [], message: 'Clé non reconnue : "x"' },
        { path: ['list', 0, 'id'], message: 'UUID invalide' },
        { path: ['other'], message: 'Entrée invalide' },
      ]),
    ).toEqual([
      'Clé non reconnue : "x"',
      'list.0.id: UUID invalide',
      'other: Entrée invalide',
    ]);
  });

  it('Given the French locale, When a schema fails, Then zod messages are in French', () => {
    const result = z.strictObject({ n: z.int() }).safeParse({ n: 'x' });

    expect(formatIssues(result.error?.issues ?? [])).toEqual([
      'n: Entrée invalide : nombre attendu, chaîne de caractères reçu',
    ]);
  });
});
