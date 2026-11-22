import type {
  AnalyticsType,
  OutboundChannel,
  RETIRED_OUTBOUND_CHANNELS,
} from './dto/track-event.dto';

// Temps visible cumulé à partir duquel une visite d'une page est engagée.
export const ENGAGED_DURATION_SECONDS = 30;

// `article_view` et `page_duration` sont automatiques : ils ne rendent pas une visite engagée.
export const ENGAGEMENT_EVENT_TYPES = [
  'cta_click',
  'project_click',
  'article_read',
  'cv_download',
  'contact_submit',
  'outbound_click',
  'section_view',
] as const satisfies readonly AnalyticsType[];

// Tant qu'aucun de ces événements n'a été vu, les conversions ne sont pas mesurées.
export const V2_EVENT_TYPES = [
  'contact_submit',
  'outbound_click',
  'section_view',
] as const satisfies readonly AnalyticsType[];

type CountedChannel =
  OutboundChannel | (typeof RETIRED_OUTBOUND_CHANNELS)[number];

// Les canaux retirés restent dans `contact` : un rattrapage d'un jour ancien les compte encore.
export const OUTBOUND_GROUPS = {
  contact: ['email', 'discord', 'phone', 'malt'],
  profile: ['linkedin', 'github'],
  demo: ['demo'],
} as const satisfies Record<string, readonly CountedChannel[]>;
