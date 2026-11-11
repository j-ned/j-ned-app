import type { ErrorEvent } from '@sentry/node';
import { SENSITIVE_BODY_FIELDS } from './log-redact';
import {
  isUntracedIncomingRequest,
  sentryBeforeSend,
} from './sentry-before-send';

const API_ORIGIN = 'https://api.nedellec-julien.fr';

const CONTACT_BODY = {
  startsAt: '2026-11-04T10:00:00.000Z',
  format: 'phone',
  name: 'Camille Martin',
  email: 'camille@example.com',
  phone: '+33 6 12 34 56 78',
  company: 'Société Exemple',
  message: 'Refonte de notre application Angular.',
  website: 'https://spam.test',
  token: 'secret-cancel-token',
};

const PERSONAL_VALUES = [
  CONTACT_BODY.name,
  CONTACT_BODY.email,
  CONTACT_BODY.phone,
  CONTACT_BODY.company,
  CONTACT_BODY.message,
  CONTACT_BODY.website,
  CONTACT_BODY.token,
];

const eventWithData = (data: unknown): ErrorEvent => ({
  type: undefined,
  request: { url: '/api/contact', method: 'POST', data },
});

describe('sentryBeforeSend', () => {
  it.each([
    'name',
    'email',
    'phone',
    'company',
    'message',
    'token',
    'website',
    'password',
    'newPassword',
    'currentPassword',
    'code',
    'refreshToken',
    'jwt',
  ])('la liste partagée des champs sensibles contient %s', (field) => {
    expect(SENSITIVE_BODY_FIELDS).toContain(field);
  });

  it('Given un corps objet porteur de données personnelles, Then chaque champ sensible est filtré et les autres restent lisibles', () => {
    const result = sentryBeforeSend(eventWithData({ ...CONTACT_BODY }));

    expect(result.request?.data).toEqual({
      startsAt: CONTACT_BODY.startsAt,
      format: 'phone',
      name: '[Filtered]',
      email: '[Filtered]',
      phone: '[Filtered]',
      company: '[Filtered]',
      message: '[Filtered]',
      website: '[Filtered]',
      token: '[Filtered]',
    });
  });

  it('Given un corps objet imbriqué, Then les champs sensibles sont filtrés à toute profondeur', () => {
    const result = sentryBeforeSend(
      eventWithData({
        contact: { email: 'camille@example.com' },
        items: [{ phone: '0612345678' }],
      }),
    );

    expect(result.request?.data).toEqual({
      contact: { email: '[Filtered]' },
      items: [{ phone: '[Filtered]' }],
    });
  });

  it('Given un corps en chaîne JSON, Then il reste une chaîne JSON, champs sensibles filtrés', () => {
    const result = sentryBeforeSend(
      eventWithData(JSON.stringify(CONTACT_BODY)),
    );

    const data = result.request?.data;
    expect(typeof data).toBe('string');
    for (const value of PERSONAL_VALUES) {
      expect(data).not.toContain(value);
    }
    expect(JSON.parse(data as string)).toEqual(
      expect.objectContaining({ format: 'phone', email: '[Filtered]' }),
    );
  });

  it('Given un corps en chaîne non JSON, Then il est filtré en entier', () => {
    const result = sentryBeforeSend(
      eventWithData(
        'name=Camille&email=camille%40example.com&phone=0612345678',
      ),
    );

    expect(result.request?.data).toBe('[Filtered]');
  });

  it('Given un événement sans requête, Then il est rendu tel quel', () => {
    const event: ErrorEvent = { type: undefined, message: 'boom' };

    expect(sentryBeforeSend(event)).toEqual({
      type: undefined,
      message: 'boom',
    });
  });

  it('Given une requête avec cookies et en-têtes d’authentification, Then ils sont retirés, les autres en-têtes gardés', () => {
    const result = sentryBeforeSend({
      type: undefined,
      request: {
        cookies: { session: 'secret-cookie' },
        headers: {
          authorization: 'Bearer secret-jwt',
          cookie: 'session=secret-cookie',
          'user-agent': 'jest',
        },
      },
    });

    expect(result.request?.cookies).toBeUndefined();
    expect(result.request?.headers).toEqual({ 'user-agent': 'jest' });
  });

  it.each([
    [
      `${API_ORIGIN}/api/blog?q=camille%40example.com`,
      `${API_ORIGIN}/api/blog`,
    ],
    [`${API_ORIGIN}/api/blog#section`, `${API_ORIGIN}/api/blog`],
    [`${API_ORIGIN}/api/blog?a=1#b`, `${API_ORIGIN}/api/blog`],
    ['/api/blog?token=x', '/api/blog'],
    [`${API_ORIGIN}/api/blog`, `${API_ORIGIN}/api/blog`],
  ])(
    'Given request.url %s, Then elle part sans query string ni fragment : %s',
    (url, expected) => {
      const result = sentryBeforeSend({
        type: undefined,
        request: { url, query_string: 'q=camille%40example.com' },
      });

      expect(result.request?.url).toBe(expected);
      expect(result.request).not.toHaveProperty('query_string');
    },
  );

  it('Given des en-têtes d’authentification et de cookies en casse quelconque, Then ils sont tous retirés', () => {
    const result = sentryBeforeSend({
      type: undefined,
      request: {
        headers: {
          Authorization: 'Bearer secret-jwt',
          COOKIE: 'session=secret-cookie',
          'Set-Cookie': 'session=secret-cookie',
          'Proxy-Authorization': 'Basic secret',
          'User-Agent': 'jest',
        },
      },
    });

    expect(result.request?.headers).toEqual({ 'User-Agent': 'jest' });
  });

  it('Given une adresse IP sur l’utilisateur, Then elle est retirée, le reste de l’utilisateur gardé', () => {
    const result = sentryBeforeSend({
      type: undefined,
      user: { id: 'admin', ip_address: '203.0.113.7' },
    });

    expect(result.user).toEqual({ id: 'admin' });
  });

  it('Given une erreur de requête Drizzle, Then ses paramètres liés (valeurs saisies) sont retirés du message, la requête gardée', () => {
    const query =
      'insert into "contact_message" ("name", "email") values ($1, $2)';
    const result = sentryBeforeSend({
      type: undefined,
      exception: {
        values: [
          { type: 'PostgresError', value: 'relation "x" does not exist' },
          {
            type: 'Error',
            value: `Failed query: ${query}\nparams: Camille Martin,camille@example.com`,
          },
        ],
      },
    });

    expect(result.exception?.values?.map((v) => v.value)).toEqual([
      'relation "x" does not exist',
      `Failed query: ${query}\nparams: [Filtered]`,
    ]);
  });

  it('Given un événement, Then l’original n’est pas modifié', () => {
    const event = eventWithData({ ...CONTACT_BODY });

    sentryBeforeSend(event);

    expect(event.request?.data).toEqual(CONTACT_BODY);
  });
});

describe('sentryBeforeSend sur l’URL de la requête', () => {
  it('Given une route à query string, Then la transaction reste lisible, query string et fragment retirés de l’URL', () => {
    const result = sentryBeforeSend({
      type: undefined,
      transaction: 'GET /api/projects',
      request: {
        url: `${API_ORIGIN}/api/projects?from=2026-10-01#top`,
        method: 'GET',
        query_string: 'from=2026-10-01',
      },
    });

    expect(result.transaction).toBe('GET /api/projects');
    expect(result.request?.url).toBe(`${API_ORIGIN}/api/projects`);
    expect(result.request).not.toHaveProperty('query_string');
  });
});

describe('isUntracedIncomingRequest', () => {
  it.each([
    ['/api/health', true],
    ['/api/projects', false],
  ])('Given %s, Then %s', (url, untraced) => {
    expect(isUntracedIncomingRequest(url)).toBe(untraced);
  });
});
