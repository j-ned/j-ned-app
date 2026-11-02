import { Logger } from '../common/logger';
import { MailerService } from './mailer.service';
import { AppConfigService } from '../config/app-config.service';

describe('MailerService', () => {
  let service: MailerService;
  let fetchFn: jest.Mock;
  let cfg: { resendApiKey: string; mailFrom: string };

  const ok = () => new Response('{"id":"email-id"}', { status: 200 });
  const failure = (status: number, body: string) =>
    new Response(body, { status });
  const requestAt = (index: number) =>
    fetchFn.mock.calls[index] as [string, RequestInit];
  const bodyAt = (index: number) =>
    JSON.parse(requestAt(index)[1].body as string) as Record<string, unknown>;
  const headersAt = (index: number) =>
    requestAt(index)[1].headers as Record<string, string>;

  beforeEach(() => {
    fetchFn = jest.fn();
    cfg = { resendApiKey: 're_test_key', mailFrom: 'noreply@test.local' };

    service = new MailerService(cfg as unknown as AppConfigService, fetchFn);
  });

  it('envoie le mail à l’API Resend avec les bons paramètres', async () => {
    fetchFn.mockResolvedValueOnce(ok());
    await service.sendMail({
      to: 'visitor@example.com',
      subject: 'Hello',
      html: '<p>hi</p>',
    });
    expect(fetchFn).toHaveBeenCalledTimes(1);
    const [url, init] = requestAt(0);
    expect(url).toBe('https://api.resend.com/emails');
    expect(init.method).toBe('POST');
    expect(bodyAt(0)).toEqual({
      from: 'noreply@test.local',
      to: 'visitor@example.com',
      subject: 'Hello',
      html: '<p>hi</p>',
    });
  });

  it('s’authentifie avec la clé API en Bearer', async () => {
    fetchFn.mockResolvedValueOnce(ok());
    await service.sendMail({ to: 'x@y.com', subject: 's', html: 'h' });
    expect(headersAt(0).Authorization).toBe('Bearer re_test_key');
    expect(headersAt(0)['Content-Type']).toBe('application/json');
  });

  it('retry une fois si la première tentative échoue, puis succès', async () => {
    fetchFn
      .mockRejectedValueOnce(new Error('transient'))
      .mockResolvedValueOnce(ok());
    jest.useFakeTimers();
    const promise = service.sendMail({
      to: 'x@y.com',
      subject: 's',
      html: 'h',
    });
    await Promise.resolve();
    await jest.advanceTimersByTimeAsync(1000);
    await promise;
    jest.useRealTimers();
    expect(fetchFn).toHaveBeenCalledTimes(2);
  });

  it('Given un retry, When la requête repart, Then la même clé d’idempotence évite un doublon', async () => {
    fetchFn
      .mockResolvedValueOnce(failure(500, 'oops'))
      .mockResolvedValueOnce(ok());
    jest.useFakeTimers();
    const promise = service.sendMail({
      to: 'x@y.com',
      subject: 's',
      html: 'h',
    });
    await jest.advanceTimersByTimeAsync(1000);
    await promise;
    jest.useRealTimers();
    expect(headersAt(0)['Idempotency-Key']).toBeTruthy();
    expect(headersAt(1)['Idempotency-Key']).toBe(
      headersAt(0)['Idempotency-Key'],
    );
  });

  it('Given deux mails distincts, Then leurs clés d’idempotence diffèrent', async () => {
    fetchFn.mockResolvedValue(ok());
    await service.sendMail({ to: 'x@y.com', subject: 's', html: 'h' });
    await service.sendMail({ to: 'x@y.com', subject: 's', html: 'h' });
    expect(headersAt(1)['Idempotency-Key']).not.toBe(
      headersAt(0)['Idempotency-Key'],
    );
  });

  it('throw après 3 tentatives échouées', async () => {
    const err = new Error('persistent');
    fetchFn.mockRejectedValue(err);
    jest.useFakeTimers();
    const promise = service.sendMail({
      to: 'x@y.com',
      subject: 's',
      html: 'h',
    });
    // Attach catch early to prevent unhandled rejection warnings in Node 24 / Jest 30
    const caught = promise.catch((e: unknown) => e);
    await Promise.resolve();
    await jest.advanceTimersByTimeAsync(1000);
    await Promise.resolve();
    await jest.advanceTimersByTimeAsync(2000);
    await Promise.resolve();
    const result = await caught;
    jest.useRealTimers();
    expect(result).toBe(err);
    expect(fetchFn).toHaveBeenCalledTimes(3);
  });

  it('Given une réponse HTTP non 2xx, When les tentatives s’épuisent, Then l’erreur cite le statut', async () => {
    fetchFn.mockImplementation(() =>
      Promise.resolve(failure(422, '{"message":"Invalid `from` field"}')),
    );
    jest.useFakeTimers();
    const caught = service
      .sendMail({ to: 'x@y.com', subject: 's', html: 'h' })
      .catch((e: unknown) => e);
    await jest.advanceTimersByTimeAsync(3000);
    const result = await caught;
    jest.useRealTimers();
    expect(result).toBeInstanceOf(Error);
    expect((result as Error).message).toContain('422');
    expect(fetchFn).toHaveBeenCalledTimes(3);
  });

  it('ne retry pas si la première tentative réussit', async () => {
    fetchFn.mockResolvedValueOnce(ok());
    await service.sendMail({ to: 'x@y.com', subject: 's', html: 'h' });
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });

  it('passe le sujet et le HTML tels quels (pas de transformation)', async () => {
    fetchFn.mockResolvedValueOnce(ok());
    const html = '<html><body><h1>Hello {{name}}</h1></body></html>';
    await service.sendMail({
      to: 'x@y.com',
      subject: 'Sujet avec accents éàç',
      html,
    });
    expect(bodyAt(0)).toEqual(
      expect.objectContaining({
        subject: 'Sujet avec accents éàç',
        html,
      }),
    );
  });

  it('Given trois échecs, When l’erreur est journalisée, Then l’adresse du destinataire est masquée, message et trace compris', async () => {
    const errorLog = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => {});
    fetchFn.mockImplementation(() =>
      Promise.resolve(
        failure(
          422,
          '{"message":"Invalid `to` field: camille@example.com is not valid"}',
        ),
      ),
    );
    jest.useFakeTimers();
    const caught = service
      .sendMail({ to: 'camille@example.com', subject: 's', html: 'h' })
      .catch((e: unknown) => e);
    await jest.advanceTimersByTimeAsync(3000);
    await caught;
    jest.useRealTimers();

    const logged = JSON.stringify(errorLog.mock.calls);
    expect(logged).not.toContain('camille@example.com');
    expect(logged).toContain('c***@example.com');
    errorLog.mockRestore();
  });
});
