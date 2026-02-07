export type SiteStats = {
  readonly totalVisits: number;
  readonly totalArticleClicks: number;
  readonly totalProjectClicks: number;
  readonly totalCvDownloads: number;
  readonly articleStats: readonly { articleId: number; title: string; clicks: number }[];
  readonly projectStats: readonly { projectId: string; title: string; clicks: number }[];
};
