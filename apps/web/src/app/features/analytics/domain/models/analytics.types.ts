import type { OfferSlug } from '@features/offer/domain/models/offer.model';

export type OutboundChannel =
  | 'email'
  | 'phone'
  | 'malt'
  | 'discord'
  | 'linkedin'
  | 'github'
  | 'demo';

export type ContactPlacement = 'home' | `offer_${OfferSlug}`;

export type SectionId = 'home_contact';

export type EventCountType = 'contact_submit' | 'outbound_click';

export type EventCount = {
  readonly entityId: string;
  readonly count: number;
};

export type EngagementOverview = {
  readonly measuredSince: string | null;
  readonly measuredSessions: number;
  readonly engagedSessions: number;
  readonly realBounces: number;
  readonly realBounceRate: number;
  readonly engagementRate: number;
  readonly thresholdSeconds: number;
};

export type ConversionsOverview = {
  readonly measuredSince: string | null;
  readonly contactSubmits: number;
  readonly contactClicks: number;
  readonly profileClicks: number;
  readonly demoClicks: number;
  readonly contactSectionViews: number;
};

export type StatsOverview = {
  visitors: number;
  pageviews: number;
  sessions: number;
  bounces: number;
  bounceRate: number;
  avgDuration: number;
  projectClicks: number;
  articleViews: number;
  cvDownloads: number;
  ctaClicks: number;
  readonly durationCoverage: number;
  readonly detailSince: string;
  readonly engagement: EngagementOverview;
  readonly conversions: ConversionsOverview;
};

export type MetricEntry = {
  name: string;
  count: number;
};

export type DailyChartPoint = {
  date: string;
  visitors: number;
  pageviews: number;
};

export type EntityStat = {
  entityId: string;
  entityTitle: string;
  count: number;
};

export type ActiveVisitors = {
  count: number;
};

export type TrackPayload =
  | { readonly type: 'page_view'; readonly url: string; readonly referrer?: string }
  | { readonly type: 'page_duration'; readonly url: string; readonly duration: number }
  | {
      readonly type: 'project_click' | 'article_view' | 'article_read' | 'cta_click';
      readonly entityId: string;
      readonly entityTitle: string;
    }
  | { readonly type: 'cv_download' }
  | { readonly type: 'contact_submit'; readonly entityId: ContactPlacement }
  | {
      readonly type: 'outbound_click';
      readonly entityId: OutboundChannel;
      readonly entityTitle: string;
    }
  | { readonly type: 'section_view'; readonly entityId: SectionId; readonly entityTitle: string };
