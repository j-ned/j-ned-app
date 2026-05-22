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

export type TrackPayload = {
  type: 'page_view' | 'project_click' | 'article_view' | 'cv_download' | 'page_duration';
  url?: string;
  referrer?: string;
  entityId?: string;
  entityTitle?: string;
  duration?: number;
};
