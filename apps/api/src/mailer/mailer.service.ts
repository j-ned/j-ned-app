import { randomUUID } from 'node:crypto';
import { Logger } from '../common/logger';
import { AppConfigService } from '../config/app-config.service';
import { maskEmail } from './mailer.utils';

const MAX_RETRIES = 3;
const RESEND_EMAILS_URL = 'https://api.resend.com/emails';

export type SendMailOptions = {
  to: string;
  subject: string;
  html: string;
};

const maskRecipientsIn = (text: string, recipients: string): string =>
  recipients
    .split(',')
    .map((address) => address.trim())
    .filter((address) => address !== '')
    .reduce(
      (masked, address) => masked.replaceAll(address, maskEmail(address)),
      text,
    );

/** Envoi par l'API HTTP de Resend : pas de connexion SMTP à ouvrir ni à fermer (fonction Vercel). */
export class MailerService {
  private readonly logger = new Logger(MailerService.name);

  constructor(
    private readonly cfg: AppConfigService,
    private readonly fetchFn: typeof fetch = fetch,
  ) {}

  async sendMail({ to, subject, html }: SendMailOptions): Promise<void> {
    // Même clé pour toutes les tentatives : une requête aboutie dont la réponse s'est perdue
    // n'envoie pas un second mail au retry.
    const idempotencyKey = randomUUID();
    let lastError: unknown;
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const response = await this.fetchFn(RESEND_EMAILS_URL, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.cfg.resendApiKey}`,
            'Content-Type': 'application/json',
            'Idempotency-Key': idempotencyKey,
          },
          body: JSON.stringify({ from: this.cfg.mailFrom, to, subject, html }),
        });
        if (!response.ok) {
          throw new Error(
            `Resend responded ${response.status}: ${await response.text()}`,
          );
        }
        return;
      } catch (err) {
        lastError = err;
        if (attempt < MAX_RETRIES) {
          await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
        }
      }
    }
    // Le log d'erreur remonte à Sentry : ni l'adresse en clair, ni la réponse de Resend qui la cite.
    const trace =
      lastError instanceof Error ? lastError.stack : String(lastError);
    this.logger.error(
      `Failed to send email to ${maskEmail(to)} after ${MAX_RETRIES} attempts`,
      trace && maskRecipientsIn(trace, to),
    );
    throw lastError;
  }
}
