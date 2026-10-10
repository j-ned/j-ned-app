import { withFirstOfMonth } from './with-first-of-month';

const LONG_DAY = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'long',
  timeZone: 'UTC',
});
const LONG_DATE = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

// Les jours de l'API sont des dates calendaires (`YYYY-MM-DD`) que `Date` lit à minuit UTC.
export function calendarDay(date: string, withYear: boolean): string {
  return withFirstOfMonth(withYear ? LONG_DATE : LONG_DAY, new Date(date));
}
