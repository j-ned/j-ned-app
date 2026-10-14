import { withFirstOfMonth } from '@shared/format/with-first-of-month';

const PARIS_TIME_ZONE = 'Europe/Paris';

const DATE_KEY = new Intl.DateTimeFormat('fr-FR', {
  timeZone: PARIS_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

// `hourCycle: 'h23'` : `hour12: false` peut rendre minuit en « 24:00 » selon le moteur.
const TIME = new Intl.DateTimeFormat('fr-FR', {
  timeZone: PARIS_TIME_ZONE,
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

const LONG_DATE = new Intl.DateTimeFormat('fr-FR', {
  timeZone: PARIS_TIME_ZONE,
  dateStyle: 'full',
});

const DAY_LABEL = new Intl.DateTimeFormat('fr-FR', {
  timeZone: PARIS_TIME_ZONE,
  weekday: 'long',
  day: 'numeric',
  month: 'long',
});

const DAY_SHORT_LABEL = new Intl.DateTimeFormat('fr-FR', {
  timeZone: PARIS_TIME_ZONE,
  weekday: 'short',
  day: 'numeric',
});

const MONTH_YEAR = new Intl.DateTimeFormat('fr-FR', {
  timeZone: PARIS_TIME_ZONE,
  month: 'long',
  year: 'numeric',
});

const DAY_MONTH = new Intl.DateTimeFormat('fr-FR', {
  timeZone: PARIS_TIME_ZONE,
  day: 'numeric',
  month: 'long',
});

// Midi UTC tombe le même jour à Paris quel que soit le décalage : la date de Paris reste celle de la clé.
const fromDateKey = (dateKey: string): Date => new Date(`${dateKey}T12:00:00Z`);

export function toParisDateKey(instant: string): string {
  const parts = Object.fromEntries(
    DATE_KEY.formatToParts(new Date(instant)).map(({ type, value }) => [type, value]),
  );
  return `${parts['year']}-${parts['month']}-${parts['day']}`;
}

export function formatParisTime(instant: string): string {
  return TIME.format(new Date(instant));
}

export function formatParisDateTime(instant: string): string {
  const date = new Date(instant);
  return `${withFirstOfMonth(LONG_DATE, date)} à ${TIME.format(date)}`;
}

export function formatDayLabel(dateKey: string): string {
  return withFirstOfMonth(DAY_LABEL, fromDateKey(dateKey));
}

export function formatDayShortLabel(dateKey: string): string {
  return withFirstOfMonth(DAY_SHORT_LABEL, fromDateKey(dateKey));
}

export function formatWeekLabel(mondayKey: string): string {
  return `Semaine du ${withFirstOfMonth(DAY_MONTH, fromDateKey(mondayKey))}`;
}

export function formatLongDate(dateKey: string): string {
  return withFirstOfMonth(LONG_DATE, fromDateKey(dateKey));
}

export function formatMonthLabel(month: string): string {
  return MONTH_YEAR.format(fromDateKey(`${month}-15`));
}
