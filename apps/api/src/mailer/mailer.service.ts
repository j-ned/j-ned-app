import { randomUUID } from 'node:crypto';
import { AppConfigService } from '../config/app-config.service';
import { escapeHtml, maskEmail } from './mailer.utils';

const MAX_RETRIES = 3;
const RESEND_EMAILS_URL = 'https://api.resend.com/emails';

/** Template publié dans Resend, désigné par son alias, et ses variables (`{{{KEY}}}` dans le HTML). */
export type MailTemplate = {
  id: string;
  variables: Record<string, string>;
};

export type SendMailOptions = {
  to: string;
  subject: string;
  template: MailTemplate;
  replyTo?: string;
};

/** Envoi par l'API HTTP de Resend : pas de connexion SMTP à ouvrir ni à fermer (fonction Vercel). */
export class MailerService {
  constructor(
    private readonly cfg: AppConfigService,
    private readonly fetchFn: typeof fetch = fetch,
  ) {}

  async sendMail({
    to,
    subject,
    template,
    replyTo,
  }: SendMailOptions): Promise<void> {
    // Resend insère les variables `{{{KEY}}}` telles quelles : elles viennent du formulaire public,
    // sans échappement un visiteur injecte un lien de phishing ou un pixel de tracking dans le mail.
    const variables = Object.fromEntries(
      Object.entries(template.variables).map(([key, value]) => [
        key,
        escapeHtml(value),
      ]),
    );
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
          body: JSON.stringify({
            from: this.cfg.mailFrom,
            to,
            subject,
            ...(replyTo && { reply_to: replyTo }),
            template: { id: template.id, variables },
          }),
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
    // L'appelant journalise l'erreur, qui remonte à Sentry : ni le destinataire ni l'adresse du
    // visiteur (`replyTo`) en clair, y compris dans la réponse de Resend qui peut les citer.
    const reason =
      lastError instanceof Error ? lastError.message : String(lastError);
    const message = [to, replyTo]
      .filter((address): address is string => !!address)
      .reduce(
        (text, address) => text.replaceAll(address, maskEmail(address)),
        `Failed to send email to ${to} after ${MAX_RETRIES} attempts: ${reason}`,
      );
    throw new Error(message);
  }
}
