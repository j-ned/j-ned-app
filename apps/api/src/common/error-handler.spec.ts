import { Hono } from 'hono';
import { handleError, handleNotFound } from './error-handler';
import { NotFoundException, TooManyRequestsException } from './http-errors';
import { Logger } from './logger';

const FEED_TOKEN = 'XYJXH9MoGdppkZYT0jI3g2rP-qFcqKBWL0budyMj488';
const FEED_URL = `/api/booking/feed/${FEED_TOKEN}.ics?x=1`;
const REDACTED_FEED_URL = '/api/booking/feed/[Filtered]';

/** Application dont toute route lève l'erreur donnée. */
const throwing = (error: unknown) =>
  new Hono()
    .all('*', () => {
      throw error;
    })
    .onError(handleError);

describe('handleError', () => {
  let logError: jest.SpyInstance;

  beforeEach(() => {
    logError = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);
  });

  afterEach(() => {
    logError.mockRestore();
  });

  it('Given un 404 sur le flux, Then le corps porte le chemin masqué', async () => {
    const res = await throwing(new NotFoundException('Not Found')).request(
      FEED_URL,
    );

    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({
      statusCode: 404,
      error: 'Not Found',
      message: 'Not Found',
      path: REDACTED_FEED_URL,
      timestamp: expect.any(String) as string,
    });
  });

  it('Given une erreur 500 sur le flux, Then le log porte le chemin masqué, dans l’objet comme dans le message', async () => {
    const boom = new Error('boom');

    const res = await throwing(boom).request(FEED_URL);

    expect(res.status).toBe(500);
    expect(logError).toHaveBeenCalledWith(
      { err: boom, path: REDACTED_FEED_URL, method: 'GET' },
      `Unhandled 500 on GET ${REDACTED_FEED_URL}`,
    );
    expect(JSON.stringify(logError.mock.calls)).not.toContain(FEED_TOKEN);
  });

  it('Given un 500, Then le corps ne dit rien de l’erreur', async () => {
    const res = await throwing(new Error('secret detail')).request('/api/x');

    expect(await res.json()).toMatchObject({
      statusCode: 500,
      error: 'Internal Server Error',
      message: 'Internal server error',
    });
  });

  it('Given un 500 sur une URL à query string, Then le log ne garde que le chemin', async () => {
    const boom = new Error('boom');

    await throwing(boom).request('/api/projects?email=a@b.c&token=xyz#top');

    expect(logError).toHaveBeenCalledWith(
      { err: boom, path: '/api/projects', method: 'GET' },
      'Unhandled 500 on GET /api/projects',
    );
    expect(JSON.stringify(logError.mock.calls)).not.toMatch(/a@b\.c|xyz/);
  });

  it('Given une autre route, Then le chemin reste lisible dans le corps', async () => {
    const res = await throwing(new NotFoundException('Not Found')).request(
      '/api/booking/slots?from=2026-10-01',
    );

    expect(await res.json()).toMatchObject({
      path: '/api/booking/slots?from=2026-10-01',
    });
  });

  it('Given une erreur HTTP, Then `error` est l’intitulé HTTP du statut et aucun log d’erreur', async () => {
    const res = await throwing(new TooManyRequestsException()).request(
      '/api/x',
    );

    expect(await res.json()).toMatchObject({
      statusCode: 429,
      error: 'Too Many Requests',
      message: 'Too Many Requests',
    });
    expect(logError).not.toHaveBeenCalled();
  });

  it.each([
    `/api/BOOKING/feed/${FEED_TOKEN}.ics`,
    `/api/booking/Feed/${FEED_TOKEN}.ics`,
    `/api/booking/feed/${FEED_TOKEN}.ICS`,
    `/api//booking/feed/${FEED_TOKEN}.ics`,
    `/api/booking/%66eed/${FEED_TOKEN}.ics`,
  ])(
    'Given %s, Then ni le corps 404 ni le log 500 ne portent le jeton',
    async (url) => {
      const notFound = await throwing(
        new NotFoundException('Not Found'),
      ).request(url);
      await throwing(new Error('boom')).request(url);

      expect(await notFound.text()).not.toContain(FEED_TOKEN);
      expect(JSON.stringify(logError.mock.calls)).not.toContain(FEED_TOKEN);
    },
  );
});

describe('handleNotFound', () => {
  it.each(['/api/nope?x=1', '/random', '/'])(
    'Given la route inconnue %s, Then le 404 est au format JSON de l’API',
    async (path) => {
      const res = await new Hono()
        .notFound(handleNotFound)
        .onError(handleError)
        .request(path);

      expect(res.status).toBe(404);
      expect(await res.json()).toMatchObject({
        statusCode: 404,
        error: 'Not Found',
        message: `Cannot GET ${path}`,
        path,
      });
    },
  );
});
