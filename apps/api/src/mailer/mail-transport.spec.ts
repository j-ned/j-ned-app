import { Logger } from '../common/logger';
import { LogMailer, createMailer } from './mail-transport';
import { MailerService } from './mailer.service';

const MAIL = {
  to: 'camille@example.com',
  subject: 'Nouveau message de contact: Bonjour',
  replyTo: 'dominique@visiteur.fr',
  template: {
    id: 'contact-notification',
    variables: {
      MESSAGE: 'Votre code : 123456, lien https://example.com/secret',
    },
  },
};

describe('createMailer', () => {
  it('Given the log transport, When a mail is sent, Then nothing leaves the process', async () => {
    const fetchFn = jest.fn();
    const mailer = createMailer({ kind: 'log' }, fetchFn);

    await mailer.sendMail(MAIL);

    expect(mailer).toBeInstanceOf(LogMailer);
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it('Given the resend transport, When a mail is sent, Then it goes through Resend', async () => {
    const fetchFn = jest
      .fn()
      .mockResolvedValue(new Response('{"id":"e"}', { status: 200 }));
    const mailer = createMailer(
      { kind: 'resend', apiKey: 're_key', from: 'noreply@test.local' },
      fetchFn,
    );

    await mailer.sendMail(MAIL);

    expect(mailer).toBeInstanceOf(MailerService);
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });
});

describe('LogMailer', () => {
  let log: jest.SpyInstance;

  beforeEach(() => {
    log = jest.spyOn(Logger.prototype, 'log').mockImplementation(() => {});
  });
  afterEach(() => log.mockRestore());

  it('Given a mail, When it is "sent", Then only the masked recipient and the subject are logged', async () => {
    await new LogMailer().sendMail(MAIL);

    expect(log).toHaveBeenCalledTimes(1);
    expect(log).toHaveBeenCalledWith(
      { to: 'c***@example.com', subject: MAIL.subject },
      'Mail not sent (log transport)',
    );
  });

  it('Given a mail, When it is logged, Then neither the content, the reply address nor the clear recipient appear', async () => {
    await new LogMailer().sendMail(MAIL);

    const logged = JSON.stringify(log.mock.calls);
    expect(logged).not.toContain('camille@example.com');
    expect(logged).not.toContain('dominique');
    expect(logged).not.toContain('123456');
    expect(logged).not.toContain('https://example.com/secret');
    expect(logged).not.toContain('contact-notification');
  });
});
