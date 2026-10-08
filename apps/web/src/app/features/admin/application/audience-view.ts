import type { MetricEntry, StatsOverview } from '@features/analytics/domain/models/analytics.types';
import { counted } from '@shared/format/counted';
import { groupedNumber } from '@shared/format/grouped-number';
import { pluralize } from '@shared/format/pluralize';

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

export function audienceLead(overview: StatsOverview | null, referrer: MetricEntry | null): string {
  if (overview === null) return '';
  const { visitors, bounceRate } = overview;
  if (visitors === 0) return 'Aucun visiteur sur la période.';
  const source =
    referrer && referrer.name !== ''
      ? `, dont ${counted(referrer.count, 'venu', 'venus')} de ${referrer.name}`
      : '';
  const tenths = Math.round(bounceRate / 10);
  const bounce =
    tenths > 0
      ? ` ${tenths} sur 10 ${pluralize(tenths, 'repart', 'repartent')} après une page.`
      : '';
  return `${counted(visitors, 'visiteur', 'visiteurs')}${source}.${bounce}`;
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
