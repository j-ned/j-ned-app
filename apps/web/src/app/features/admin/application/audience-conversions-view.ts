import type {
  EventCount,
  MetricEntry,
  OutboundChannel,
  RetiredOutboundChannel,
  StatsOverview,
} from '@features/analytics/domain/models/analytics.types';
import { calendarDay } from './calendar-day';

// Téléphone et Malt retirés du site (spec 029) : leurs clics passés restent lisibles.
const CHANNEL_LABELS: Readonly<Record<OutboundChannel | RetiredOutboundChannel, string>> = {
  email: 'E-mail',
  phone: 'Téléphone (retiré)',
  malt: 'Malt (retiré)',
  discord: 'Discord',
  linkedin: 'LinkedIn',
  github: 'GitHub',
  demo: 'Démos',
};

const PLACEMENT_LABELS: ReadonlyMap<string, string> = new Map([
  ['home', 'Accueil'],
  ['booking', 'Prise de rendez-vous (retirée)'],
]);

const isChannel = (entityId: string): entityId is keyof typeof CHANNEL_LABELS =>
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
  if (measuredSince === null) return 'Actions non mesurées sur la période.';
  return measuredSince > periodStart
    ? `Mesurées depuis le ${calendarDay(measuredSince, true)}.`
    : '';
}

// Pages d'offre retirées (spec 029) : leurs envois passés restent comptés sous un libellé honnête.
const RETIRED_OFFER_PREFIX = 'offer_';

export function placementLabel(entityId: string): string {
  const known = PLACEMENT_LABELS.get(entityId);
  if (known) return known;
  return entityId.startsWith(RETIRED_OFFER_PREFIX)
    ? `Page d'offre retirée (${entityId.slice(RETIRED_OFFER_PREFIX.length)})`
    : `Emplacement inconnu (${entityId})`;
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
