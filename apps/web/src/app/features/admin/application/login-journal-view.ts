import type { LoginEvent, LoginEventKind } from '@features/auth/domain/models/login-event.model';
import { counted } from '@shared/format/counted';
import { withFirstOfMonth } from '@shared/format/with-first-of-month';
import { pager } from './pager';

export const LOGIN_JOURNAL_PAGE_SIZE = 25;

export type LoginJournalRow = {
  readonly id: string;
  readonly step: string;
  readonly outcome: string;
  readonly rejected: boolean;
  readonly origin: string;
  readonly note: string;
  readonly at: string;
  readonly createdAt: string;
};

const PASSWORD = 'Mot de passe';
const TWO_FACTOR = 'Code de double authentification';

const ACCEPTED = { outcome: 'Accepté', rejected: false } as const;
const REJECTED = { outcome: 'Refusé', rejected: true } as const;

type Step = { readonly step: string; readonly outcome: string; readonly rejected: boolean };

const STEPS: Record<LoginEventKind, Step> = {
  password_accepted: { step: PASSWORD, ...ACCEPTED },
  password_rejected: { step: PASSWORD, ...REJECTED },
  two_factor_accepted: { step: TWO_FACTOR, ...ACCEPTED },
  two_factor_rejected: { step: TWO_FACTOR, ...REJECTED },
  unknown: { step: 'Étape inconnue', outcome: 'Résultat inconnu', rejected: false },
};

// L'API ne rattache pas de compte quand elle n'a pas pu en identifier un.
const UNIDENTIFIED: Partial<Record<LoginEventKind, string>> = {
  password_rejected: 'Compte inconnu',
  two_factor_rejected: 'Jeton de challenge invalide',
};

const COUNTRY_CODE = /^[A-Z]{2}$/;
const COUNTRY_NAMES = new Intl.DisplayNames(['fr'], { type: 'region' });

// `Intl.DisplayNames.of` lève sur un code mal formé : il est alors affiché tel quel.
const countryName = (code: string): string =>
  COUNTRY_CODE.test(code) ? (COUNTRY_NAMES.of(code) ?? code) : code;

function origin(event: LoginEvent): string {
  const parts = [event.browser, event.os, event.country && countryName(event.country)].filter(
    (part): part is string => Boolean(part),
  );
  return parts.length > 0 ? parts.join(' · ') : 'Origine inconnue';
}

// Date et heure formatées séparément : la jonction (« à », virgule) varie selon la version d'ICU.
function occurredAt(createdAt: string, timeZone: string | undefined): string {
  const date = new Date(createdAt);
  const day = new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone,
  });
  const time = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone });
  return `${withFirstOfMonth(day, date)} à ${time.format(date)}`;
}

// `timeZone` absent : le fuseau du navigateur, celui dans lequel l'admin reconnaît ses connexions.
export function toLoginJournalRows(
  events: readonly LoginEvent[],
  timeZone?: string,
): readonly LoginJournalRow[] {
  return events.map((event) => {
    return {
      id: event.id,
      ...STEPS[event.kind],
      origin: origin(event),
      note: event.userId === null ? (UNIDENTIFIED[event.kind] ?? '') : '',
      at: occurredAt(event.createdAt, timeZone),
      createdAt: event.createdAt,
    };
  });
}

export const loginJournalPager = (total: number, page: number): ReturnType<typeof pager> =>
  pager(total, page, LOGIN_JOURNAL_PAGE_SIZE);

export function loginJournalSummary(total: number): string {
  return `${counted(total, 'étape', 'étapes')} sur les 90 derniers jours`;
}
