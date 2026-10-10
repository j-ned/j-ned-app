import type {
  EventCount,
  MetricEntry,
  OutboundChannel,
  StatsOverview,
} from '@features/analytics/domain/models/analytics.types';
import { OFFERS } from '@features/offer/domain/offer-catalog.static-data';
import { calendarDay } from './calendar-day';

const CHANNEL_LABELS: Readonly<Record<OutboundChannel, string>> = {
  email: 'E-mail',
  phone: 'Téléphone',
  malt: 'Malt',
  discord: 'Discord',
  linkedin: 'LinkedIn',
  github: 'GitHub',
  demo: 'Démos',
};

const PLACEMENT_LABELS: ReadonlyMap<string, string> = new Map([
  ['home', 'Accueil'],
  ...OFFERS.map((offer): [string, string] => [`offer_${offer.slug}`, `Offre ${offer.shortName}`]),
]);

const isChannel = (entityId: string): entityId is OutboundChannel =>
  Object.hasOwn(CHANNEL_LABELS, entityId);

export function conversionTotals(overview: StatsOverview): readonly MetricEntry[] {
  const { conversions } = overview;
  if (conversions.measuredSince === null) return [];
  return [
    { name: 'Formulaires envoyés', count: conversions.contactSubmits },
    { name: 'Contacts directs', count: conversions.contactClicks },
    { name: 'Profils ouverts', count: conversions.profileClicks },
    { name: 'CV téléchargés', count: overview.cvDownloads },
    { name: 'Démos ouvertes', count: conversions.demoClicks },
    { name: "Arrivées sur le formulaire de l'accueil", count: conversions.contactSectionViews },
  ];
}

export function conversionsNote(overview: StatsOverview | null, periodStart: string): string {
  if (overview === null) return '';
  const { measuredSince } = overview.conversions;
  if (measuredSince === null) return 'Conversions non mesurées sur la période.';
  return measuredSince > periodStart
    ? `Mesurées depuis le ${calendarDay(measuredSince, true)}.`
    : '';
}

export function placementLabel(entityId: string): string {
  return PLACEMENT_LABELS.get(entityId) ?? `Emplacement inconnu (${entityId})`;
}

export function channelLabel(entityId: string): string {
  return isChannel(entityId) ? CHANNEL_LABELS[entityId] : `Canal inconnu (${entityId})`;
}

export function toPlacementEntries(counts: readonly EventCount[]): readonly MetricEntry[] {
  return counts.map(({ entityId, count }) => ({ name: placementLabel(entityId), count }));
}

export function toChannelEntries(counts: readonly EventCount[]): readonly MetricEntry[] {
  return counts.map(({ entityId, count }) => ({ name: channelLabel(entityId), count }));
}
