import { Logger } from '../common/logger';
import type { MailTransport } from '../config/app-config.service';
import { MailerService, type SendMailOptions } from './mailer.service';
import { maskEmail } from './mailer.utils';

/** Ce dont un service a besoin pour envoyer un mail, quel que soit le transport. */
export type MailSender = {
  sendMail(options: SendMailOptions): Promise<void>;
};

/**
 * Transport des previews et des postes sans clé Resend : rien ne part. Seuls le destinataire masqué
 * et le sujet sont journalisés, jamais le contenu (variables du template), l'adresse de réponse ni
 * le template.
 */
export class LogMailer implements MailSender {
  private readonly logger = new Logger('Mailer');

  sendMail({ to, subject }: SendMailOptions): Promise<void> {
    this.logger.log(
      { to: maskEmail(to), subject },
      'Mail not sent (log transport)',
    );
    return Promise.resolve();
  }
}

export function createMailer(
  transport: MailTransport,
  fetchFn: typeof fetch = fetch,
): MailSender {
  return transport.kind === 'resend'
    ? new MailerService(transport, fetchFn)
    : new LogMailer();
}
