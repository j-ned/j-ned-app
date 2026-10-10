import type {
  EngagementOverview,
  MetricEntry,
  StatsOverview,
} from '@features/analytics/domain/models/analytics.types';
import { counted } from '@shared/format/counted';
import { groupedNumber } from '@shared/format/grouped-number';
import { pluralize } from '@shared/format/pluralize';
import { calendarDay } from './calendar-day';

export type ShareRow = {
  readonly label: string;
  readonly count: number;
  readonly share: string;
  readonly width: number;
};

export type TallyRow = { readonly label: string; readonly value: string };

const NBSP = '\u00a0';

const percentOf = (count: number, total: number): number =>
  total > 0 ? Math.round((count / total) * 100) : 0;

export function toShareRows(
  entries: readonly MetricEntry[],
  total: number,
  limit: number,
  fallbackLabel: string,
): readonly ShareRow[] {
  const named = entries.map((entry) => ({
    label: entry.name || fallbackLabel,
    count: entry.count,
  }));
  const rest = named.slice(limit);
  const shown =
    rest.length === 0
      ? named
      : [
          ...named.slice(0, limit),
          { label: 'Autres', count: rest.reduce((sum, entry) => sum + entry.count, 0) },
        ];
  const max = Math.max(0, ...shown.map((entry) => entry.count));
  return shown.map((entry) => ({
    ...entry,
    share: `${percentOf(entry.count, total)}${NBSP}%`,
    width: percentOf(entry.count, max),
  }));
}

function realBounceSentence({
  measuredSince,
  realBounceRate,
  thresholdSeconds,
}: EngagementOverview): string {
  if (measuredSince === null) return '';
  const tenths = Math.round(realBounceRate / 10);
  if (tenths === 0) return '';
  return ` ${tenths} sur 10 ${pluralize(tenths, 'repart', 'repartent')} en moins de ${thresholdSeconds}${NBSP}s, sans autre page ni action.`;
}

export function audienceLead(overview: StatsOverview | null, referrer: MetricEntry | null): string {
  if (overview === null) return '';
  if (overview.sessions === 0) return 'Aucune visite sur la période.';
  const source =
    referrer && referrer.name !== ''
      ? `, dont ${counted(referrer.count, 'venue', 'venues')} de ${referrer.name}`
      : '';
  return `${counted(overview.sessions, 'visite', 'visites')}${source}.${realBounceSentence(overview.engagement)}`;
}

export function detailNote(overview: StatsOverview | null, periodStart: string): string {
  if (overview === null || overview.detailSince <= periodStart) return '';
  return `Pages, provenances, actions et conversions par emplacement${NBSP}: 30 derniers jours au plus, depuis le ${calendarDay(overview.detailSince, true)}.`;
}

export function toTallyRows(
  entries: readonly MetricEntry[],
  limit: number,
  fallbackLabel: string,
): readonly TallyRow[] {
  return entries
    .slice(0, limit)
    .map((entry) => ({ label: entry.name || fallbackLabel, value: groupedNumber(entry.count) }));
}
