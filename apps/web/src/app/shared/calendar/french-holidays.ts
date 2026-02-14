/**
 * Calcul des jours fériés français (fixes + mobiles via Pâques).
 * Purement client-side, aucun appel réseau.
 */

function computeEasterSunday(year: number): Date {
  // Algorithme de Meeus/Jones/Butcher
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function toISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getFrenchHolidays(year: number): Map<string, string> {
  const easter = computeEasterSunday(year);
  const easterMonday = addDays(easter, 1);
  const ascension = addDays(easter, 39);
  const whitMonday = addDays(easter, 50);

  const holidays = new Map<string, string>();
  holidays.set(`${year}-01-01`, 'Jour de l\u2019An');
  holidays.set(toISO(easterMonday), 'Lundi de Pâques');
  holidays.set(`${year}-05-01`, 'Fête du Travail');
  holidays.set(`${year}-05-08`, 'Victoire 1945');
  holidays.set(toISO(ascension), 'Ascension');
  holidays.set(toISO(whitMonday), 'Lundi de Pentecôte');
  holidays.set(`${year}-07-14`, 'Fête nationale');
  holidays.set(`${year}-08-15`, 'Assomption');
  holidays.set(`${year}-11-01`, 'Toussaint');
  holidays.set(`${year}-11-11`, 'Armistice 1918');
  holidays.set(`${year}-12-25`, 'Noël');

  return holidays;
}

export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

export function getUnavailableReason(date: Date, holidays: Map<string, string>): string | null {
  const iso = toISO(date);
  const holiday = holidays.get(iso);
  if (holiday) return holiday;
  if (isWeekend(date)) return 'Weekend';
  return null;
}
