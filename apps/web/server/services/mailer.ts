import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { env } from '../lib/env.js';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const transporter: Transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_SECURE,
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
});

function loadTemplate(name: string): string {
  const path = resolve(__dirname, '..', 'mail-templates', `${name}.html`);
  return readFileSync(path, 'utf-8');
}

function replaceVariables(template: string, variables: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replaceAll(`{{${key}}}`, value);
  }
  return result;
}

type SendMailOptions = {
  to: string;
  subject: string;
  template: string;
  variables: Record<string, string>;
};

const MAX_RETRIES = 3;

export async function sendMail({ to, subject, template, variables }: SendMailOptions): Promise<void> {
  const html = replaceVariables(loadTemplate(template), variables);

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      await transporter.sendMail({
        from: env.SMTP_FROM,
        to,
        subject,
        html,
      });
      return;
    } catch (error) {
      if (attempt === MAX_RETRIES) {
        console.error(`Failed to send email after ${MAX_RETRIES} attempts:`, error);
        throw error;
      }
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
}

export async function sendContactNotification(data: {
  name: string;
  email: string;
  subject: string;
  message: string;
}): Promise<void> {
  await sendMail({
    to: env.CONTACT_EMAIL,
    subject: `Nouveau message de contact: ${data.subject}`,
    template: 'contact-notification',
    variables: {
      name: data.name,
      email: data.email,
      subject: data.subject,
      message: data.message,
    },
  });
}

export async function sendContactConfirmation(data: {
  name: string;
  email: string;
  subject: string;
}): Promise<void> {
  await sendMail({
    to: data.email,
    subject: 'Confirmation de votre message',
    template: 'contact-confirmation',
    variables: {
      name: data.name,
      subject: data.subject,
    },
  });
}

export async function sendBookingNotification(data: {
  name: string;
  email: string;
  phone: string;
  date: string;
  startTime: string;
  duration: string;
  subject: string;
  message: string;
}): Promise<void> {
  await sendMail({
    to: env.CONTACT_EMAIL,
    subject: `Nouvelle demande de rendez-vous: ${data.subject}`,
    template: 'booking-notification',
    variables: data,
  });
}

export async function sendBookingConfirmation(data: {
  name: string;
  email: string;
  date: string;
  startTime: string;
  duration: string;
  subject: string;
}): Promise<void> {
  await sendMail({
    to: data.email,
    subject: 'Confirmation de votre demande de rendez-vous',
    template: 'booking-confirmation',
    variables: data,
  });
}

export async function sendCommentNotification(data: {
  author: string;
  content: string;
  articleTitle: string;
  email: string;
}): Promise<void> {
  await sendMail({
    to: env.CONTACT_EMAIL,
    subject: `Nouveau commentaire sur: ${data.articleTitle}`,
    template: 'comment-notification',
    variables: data,
  });
}
