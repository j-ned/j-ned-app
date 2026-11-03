import { MailerService } from './mailer.service';
import { AppConfigService } from '../config/app-config.service';

const TEMPLATE = { id: 'tpl', variables: {} };

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

  it('retry une fois si la première tentative échoue, puis succès', async () => {
    fetchFn
      .mockRejectedValueOnce(new Error('transient'))
      .mockResolvedValueOnce(ok());
    jest.useFakeTimers();
    const promise = service.sendMail({
      to: 'x@y.com',
      subject: 's',
      template: TEMPLATE,
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
      template: TEMPLATE,
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
    await service.sendMail({ to: 'x@y.com', subject: 's', template: TEMPLATE });
    await service.sendMail({ to: 'x@y.com', subject: 's', template: TEMPLATE });
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
      template: TEMPLATE,
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
    expect((result as Error).message).toBe(
      'Failed to send email to x***@y.com after 3 attempts: persistent',
    );
    expect(fetchFn).toHaveBeenCalledTimes(3);
  });

  it('Given une réponse HTTP non 2xx, When les tentatives s’épuisent, Then l’erreur cite le statut', async () => {
    fetchFn.mockImplementation(() =>
      Promise.resolve(failure(422, '{"message":"Invalid `from` field"}')),
    );
    jest.useFakeTimers();
    const caught = service
      .sendMail({ to: 'x@y.com', subject: 's', template: TEMPLATE })
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
    await service.sendMail({ to: 'x@y.com', subject: 's', template: TEMPLATE });
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });

  it('Given des variables issues du formulaire, When le mail part, Then elles sont échappées pour le HTML', async () => {
    fetchFn.mockResolvedValueOnce(ok());
    await service.sendMail({
      to: 'x@y.com',
      subject: 's',
      template: {
        id: 'tpl',
        variables: {
          NAME: '<a href="https://evil">Voir</a>',
          MESSAGE: "it's & co",
        },
      },
    });
    expect(bodyAt(0).template).toEqual({
      id: 'tpl',
      variables: {
        NAME: '&lt;a href=&quot;https://evil&quot;&gt;Voir&lt;/a&gt;',
        MESSAGE: 'it&#39;s &amp; co',
      },
    });
  });

  it('Given un replyTo, When le mail part, Then il est transmis en reply_to', async () => {
    fetchFn.mockResolvedValueOnce(ok());
    await service.sendMail({
      to: 'x@y.com',
      subject: 's',
      template: TEMPLATE,
      replyTo: 'visitor@example.com',
    });
    expect(bodyAt(0).reply_to).toBe('visitor@example.com');
  });

  it('Given aucun replyTo, Then aucun champ reply_to n’est envoyé', async () => {
    fetchFn.mockResolvedValueOnce(ok());
    await service.sendMail({ to: 'x@y.com', subject: 's', template: TEMPLATE });
    expect(bodyAt(0)).not.toHaveProperty('reply_to');
  });

  it('Given trois échecs, When l’erreur remonte, Then destinataire et replyTo y sont masqués, réponse de Resend comprise', async () => {
    fetchFn.mockImplementation(() =>
      Promise.resolve(
        failure(
          422,
          '{"message":"Invalid `reply_to` field: dominique@visiteur.fr (to: camille@example.com)"}',
        ),
      ),
    );
    jest.useFakeTimers();
    const caught = service
      .sendMail({
        to: 'camille@example.com',
        subject: 's',
        template: TEMPLATE,
        replyTo: 'dominique@visiteur.fr',
      })
      .catch((e: unknown) => e);
    await jest.advanceTimersByTimeAsync(3000);
    const result = await caught;
    jest.useRealTimers();

    const thrown = JSON.stringify({
      message: (result as Error).message,
      stack: (result as Error).stack,
    });
    expect(thrown).not.toContain('camille@example.com');
    expect(thrown).not.toContain('dominique@visiteur.fr');
    expect(thrown).toContain('c***@example.com');
    expect(thrown).toContain('d***@visiteur.fr');
  });
});
