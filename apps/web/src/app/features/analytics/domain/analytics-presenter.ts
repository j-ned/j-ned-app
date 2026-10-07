import type { ChartData, ChartDataset } from 'chart.js';
import type {
  StatsOverview,
  DailyChartPoint,
  MetricEntry,
  EntityStat,
} from './models/analytics.types';

export type DateRangeKey = '7d' | '30d' | '90d' | 'all';

export type RangeParams = { startDate?: string; endDate?: string };

const DAY_MS = 24 * 60 * 60 * 1000;

export function dateRangeToParams(key: DateRangeKey, now: Date): RangeParams {
  if (key === 'all') return { startDate: undefined, endDate: undefined };
  const days = key === '7d' ? 7 : key === '30d' ? 30 : 90;
  const start = new Date(now.getTime() - days * DAY_MS);
  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: now.toISOString().slice(0, 10),
  };
}

const ONE_DECIMAL = new Intl.NumberFormat('fr-FR', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
  useGrouping: false,
});
const AT_MOST_ONE_DECIMAL = new Intl.NumberFormat('fr-FR', {
  maximumFractionDigits: 1,
  useGrouping: false,
});
// Les jours de l'API sont des dates calendaires (`YYYY-MM-DD`) que `Date` lit à minuit UTC.
const CHART_DAY = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'short',
  timeZone: 'UTC',
});

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}\u00a0min ${s.toString().padStart(2, '0')}\u00a0s` : `${s}\u00a0s`;
}

function sessionRatio(overview: StatsOverview | undefined): number {
  return !overview || overview.sessions === 0 ? 0 : overview.pageviews / overview.sessions;
}

export function pagesPerSession(overview: StatsOverview | undefined): string {
  if (!overview || overview.sessions === 0) return '0';
  return ONE_DECIMAL.format(sessionRatio(overview));
}

export function pagesPerSessionLabel(overview: StatsOverview | undefined): string {
  const shown = Math.round(sessionRatio(overview) * 10) / 10;
  return `${pagesPerSession(overview)} ${shown < 2 ? 'page' : 'pages'} par session`;
}

export function formatPercent(value: number): string {
  return `${AT_MOST_ONE_DECIMAL.format(value)}\u00a0%`;
}

export function formatChartDay(day: string): string {
  const parts = CHART_DAY.formatToParts(new Date(day));
  const part = (type: Intl.DateTimeFormatPartTypes): string =>
    parts.find((p) => p.type === type)?.value ?? '';
  return `${part('day')} ${part('month')}`;
}

export function barWidth(value: number, max: number): number {
  return max > 0 ? (value / max) * 100 : 0;
}

export function alpha(color: string, pct: number): string {
  return `color-mix(in srgb, ${color} ${pct}%, transparent)`;
}

export type LinePalette = { readonly primary: string; readonly foreground: string };

const dayLabels = (rows: readonly DailyChartPoint[]): string[] =>
  rows.map((r) => formatChartDay(r.date));

function visitorsDataset(
  rows: readonly DailyChartPoint[],
  palette: LinePalette,
): ChartDataset<'line'> {
  return {
    label: 'Visiteurs',
    data: rows.map((r) => r.visitors),
    borderColor: palette.primary,
    backgroundColor: alpha(palette.primary, 12),
    borderWidth: 2,
    tension: 0,
    fill: true,
    pointRadius: 0,
    pointHoverRadius: 4,
  };
}

export function buildVisitorsChartData(
  rows: readonly DailyChartPoint[],
  palette: LinePalette,
): ChartData<'line'> {
  return {
    labels: dayLabels(rows),
    datasets: [
      visitorsDataset(rows, palette),
      {
        label: 'Pages vues',
        data: rows.map((r) => r.pageviews),
        borderColor: alpha(palette.foreground, 55),
        borderWidth: 1.5,
        borderDash: [4, 4],
        tension: 0,
        fill: false,
        pointRadius: 0,
        pointHoverRadius: 4,
      },
    ],
  };
}

export function buildVisitorsOnlyChartData(
  rows: readonly DailyChartPoint[],
  palette: LinePalette,
): ChartData<'line'> {
  return { labels: dayLabels(rows), datasets: [visitorsDataset(rows, palette)] };
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type -- le type officiel `ChartOptions<'line'>` est DeepPartial et perd la forme concrète vérifiée par les tests ; on garde l'inférence.
export function buildLineChartOptions(foreground: string, background: string) {
  const muted40 = alpha(foreground, 40);
  const grid = alpha(foreground, 6);
  return {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { intersect: false, mode: 'index' as const },
    scales: {
      x: {
        ticks: { color: muted40, maxTicksLimit: 8 },
        grid: { color: grid },
      },
      y: {
        beginAtZero: true,
        ticks: { color: muted40, precision: 0 },
        grid: { color: grid },
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: alpha(background, 95),
        borderColor: alpha(foreground, 10),
        borderWidth: 1,
      },
    },
  };
}

export function buildDonutChartData(
  entries: readonly MetricEntry[],
  palette: readonly string[],
): ChartData<'doughnut'> {
  return {
    labels: entries.map((r) => r.name || 'Inconnu'),
    datasets: [
      {
        data: entries.map((r) => r.count),
        backgroundColor: palette,
        borderWidth: 0,
      },
    ],
  };
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type -- le type officiel `ChartOptions<'doughnut'>` est DeepPartial et perd la forme concrète vérifiée par les tests ; on garde l'inférence.
export function buildDonutOptions(foreground: string, background: string) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '60%',
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: alpha(foreground, 70),
          boxWidth: 12,
          padding: 12,
          font: { size: 11 },
        },
      },
      tooltip: {
        backgroundColor: alpha(background, 95),
        borderColor: alpha(foreground, 10),
        borderWidth: 1,
      },
    },
  };
}

export function buildPalette(colors: {
  primary: string;
  accent: string;
  success: string;
  warn: string;
}): string[] {
  return [
    colors.primary,
    colors.accent,
    alpha(colors.primary, 70),
    alpha(colors.accent, 70),
    colors.success,
    colors.warn,
    alpha(colors.primary, 40),
  ];
}

export type AnalyticsCsvSections = {
  overview: StatsOverview | undefined;
  topPages: readonly MetricEntry[];
  topReferrers: readonly MetricEntry[];
  browsers: readonly MetricEntry[];
  osList: readonly MetricEntry[];
  countries: readonly MetricEntry[];
  topProjects: readonly EntityStat[];
  topArticles: readonly EntityStat[];
  topArticlesRead: readonly EntityStat[];
};

export function escapeCsv(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function buildAnalyticsCsv(s: AnalyticsCsvSections): string {
  const rows: string[] = ['Section,Label,Count'];
  const o = s.overview;
  if (o) {
    rows.push(`KPI,Visiteurs,${o.visitors}`);
    rows.push(`KPI,Sessions,${o.sessions}`);
    rows.push(`KPI,Pages vues,${o.pageviews}`);
    rows.push(`KPI,Rebonds,${o.bounces}`);
    rows.push(`KPI,Taux de rebond (%),${o.bounceRate.toFixed(2)}`);
    rows.push(`KPI,Durée moyenne (s),${o.avgDuration}`);
    rows.push(`KPI,Clics projets,${o.projectClicks}`);
    rows.push(`KPI,Vues articles,${o.articleViews}`);
    rows.push(`KPI,Téléchargements CV,${o.cvDownloads}`);
  }
  for (const r of s.topPages) rows.push(`Page,${escapeCsv(r.name)},${r.count}`);
  for (const r of s.topReferrers) rows.push(`Referrer,${escapeCsv(r.name || 'Direct')},${r.count}`);
  for (const r of s.browsers) rows.push(`Navigateur,${escapeCsv(r.name)},${r.count}`);
  for (const r of s.osList) rows.push(`OS,${escapeCsv(r.name)},${r.count}`);
  for (const r of s.countries) rows.push(`Pays,${escapeCsv(r.name || 'Inconnu')},${r.count}`);
  for (const r of s.topProjects) rows.push(`Projet,${escapeCsv(r.entityTitle)},${r.count}`);
  for (const r of s.topArticles) rows.push(`Article,${escapeCsv(r.entityTitle)},${r.count}`);
  for (const r of s.topArticlesRead) rows.push(`Article lu,${escapeCsv(r.entityTitle)},${r.count}`);
  return rows.join('\n');
}
