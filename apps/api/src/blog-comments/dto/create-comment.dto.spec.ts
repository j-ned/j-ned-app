import { invalidProperties } from '../../testing/dto-testing';
import { commentBodySchema, createCommentSchema } from './create-comment.dto';

const VALID = {
  name: 'Camille',
  email: 'camille@example.test',
  body: 'Merci pour cet article.',
};

const invalid = (body: unknown) => invalidProperties(createCommentSchema, body);

describe('createCommentSchema', () => {
  it('Given a name, an e-mail and a message, When validated, Then the comment is accepted as sent', () => {
    expect(createCommentSchema.parse(VALID)).toEqual(VALID);
  });

  it('Given a reply and an empty trap field, When validated, Then both optional fields are accepted', () => {
    const body = {
      ...VALID,
      parentId: '11111111-1111-4111-8111-111111111111',
      website: '',
    };

    expect(createCommentSchema.parse(body)).toEqual(body);
  });

  it.each(['name', 'email', 'body'])(
    'Given no %s, When validated, Then that field is refused',
    (field) => {
      const body: Record<string, unknown> = { ...VALID };
      delete body[field];

      expect(invalid(body)).toEqual([field]);
    },
  );

  it('Given an unknown field, When validated, Then it is refused', () => {
    expect(invalid({ ...VALID, notify: true })).toEqual(['notify']);
  });

  it.each([
    ['a', false],
    ['ab', true],
    ['x'.repeat(80), true],
    ['x'.repeat(81), false],
    ['  a  ', false],
  ])('Given the name %j, When validated, Then accepted = %s', (name, ok) => {
    expect(invalid({ ...VALID, name })).toEqual(ok ? [] : ['name']);
  });

  it('Given a name with spaces around it, When validated, Then it is trimmed', () => {
    expect(
      createCommentSchema.parse({ ...VALID, name: '  Camille ' }).name,
    ).toBe('Camille');
  });

  it.each([
    ['a tab', 'Ca\tmille'],
    ['a line break', 'Ca\nmille'],
    ['a NUL', 'Ca\u0000mille'],
    ['a right-to-left override', 'Camille‮ellimac'],
    ['a directional isolate', 'Camille⁦x⁩'],
  ])('Given a name with %s, When validated, Then it is refused', (_, name) => {
    expect(invalid({ ...VALID, name })).toEqual(['name']);
  });

  it.each(['pas-une-adresse', 'a@', `${'x'.repeat(320)}@example.test`, ''])(
    'Given the e-mail %j, When validated, Then it is refused',
    (email) => {
      expect(invalid({ ...VALID, email })).toEqual(['email']);
    },
  );

  it.each([
    ['a', false],
    ['ab', true],
    ['x'.repeat(2000), true],
    ['x'.repeat(2001), false],
    ['   ', false],
    [' a ', false],
  ])('Given a body of %j, When validated, Then accepted = %s', (body, ok) => {
    expect(invalid({ ...VALID, body })).toEqual(ok ? [] : ['body']);
  });

  it('Given a body of a single emoji, When validated, Then it is refused: the database counts characters, not UTF-16 units', () => {
    expect(invalid({ ...VALID, body: '😀' })).toEqual(['body']);
  });

  it('Given a body of 2 000 emojis, When validated, Then it is accepted: 2 000 characters for the database', () => {
    expect(invalid({ ...VALID, body: '😀'.repeat(2000) })).toEqual([]);
  });

  it('Given Windows and old Mac line endings and spaces around, When validated, Then the body is stored with plain line feeds, trimmed', () => {
    expect(commentBodySchema.parse('  ligne 1\r\nligne 2\rligne 3\n ')).toBe(
      'ligne 1\nligne 2\nligne 3',
    );
  });

  it('Given tabs and line feeds, When validated, Then the body keeps them', () => {
    expect(commentBodySchema.parse('a\n\tb')).toBe('a\n\tb');
  });

  it.each([
    ['a NUL', 'texte\u0000'],
    ['an escape', 'texte\u001B[31m'],
    ['a C1 control', 'texte\u0085suite'],
    ['a right-to-left override', 'texte‮etxet'],
    ['a directional isolate', 'texte⁧x⁩'],
  ])('Given a body with %s, When validated, Then it is refused', (_, body) => {
    expect(invalid({ ...VALID, body })).toEqual(['body']);
  });

  it('Given markup in the body, When validated, Then it is kept as written: a developer quotes <app-root>', () => {
    const body = '<app-root> & <img src=x onerror=alert(1)>';

    expect(createCommentSchema.parse({ ...VALID, body }).body).toBe(body);
  });

  it.each(['pas-un-uuid', '', 42])(
    'Given the parent %j, When validated, Then it is refused',
    (parentId) => {
      expect(invalid({ ...VALID, parentId })).toEqual(['parentId']);
    },
  );

  it('Given a trap field longer than 200 characters, When validated, Then it is refused', () => {
    expect(invalid({ ...VALID, website: 'x'.repeat(201) })).toEqual([
      'website',
    ]);
  });

  it('Given a refused comment, When the messages are read, Then they are in French and never repeat what was typed', () => {
    const result = createCommentSchema.safeParse({
      name: 'x',
      email: 'secret-address',
      body: 'y',
    });

    const messages = result.success
      ? []
      : result.error.issues.map((issue) => issue.message);
    expect(messages).toEqual([
      'Ton nom doit compter entre 2 et 80 caractères.',
      'Ton adresse e-mail n’est pas valide.',
      'Ton message doit compter entre 2 et 2 000 caractères.',
    ]);
  });
});
