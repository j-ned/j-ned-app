import type { StatsOverview, DailyChartPoint, MetricEntry, EntityStat } from './models/analytics.types';

export type DateRangeKey = '7d' | '30d' | '90d' | 'all';

export type RangeParams = { startDate?: string; endDate?: string };

const DAY_MS = 24 * 60 * 60 * 1000;

/** Convertit une plage ('7d'/'30d'/'90d'/'all') en bornes ISO (YYYY-MM-DD) relatives à `now`. */
export function dateRangeToParams(key: DateRangeKey, now: Date): RangeParams {
  if (key === 'all') return { startDate: undefined, endDate: undefined };
  const days = key === '7d' ? 7 : key === '30d' ? 30 : 90;
  const start = new Date(now.getTime() - days * DAY_MS);
  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: now.toISOString().slice(0, 10),
  };
}

/** Durée moyenne : secondes → « Xm YYs » (ou « Ys » sous la minute). */
export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s.toString().padStart(2, '0')}s` : `${s}s`;
}

/** Pages par session, formaté à une décimale ; « 0 » si pas de session. */
export function pagesPerSession(overview: StatsOverview | undefined): string {
  if (!overview || overview.sessions === 0) return '0';
  return (overview.pageviews / overview.sessions).toFixed(1);
}

/** Largeur de barre en % (value/max), bornée à 0 si max ≤ 0. */
export function barWidth(value: number, max: number): number {
  return max > 0 ? (value / max) * 100 : 0;
}

/** Couleur translucide via color-mix (alpha en %). */
export function alpha(color: string, pct: number): string {
  return `color-mix(in srgb, ${color} ${pct}%, transparent)`;
}

/** Dataset Chart.js de la courbe Visiteurs / Pages vues. */
export function buildVisitorsChartData(
  rows: readonly DailyChartPoint[],
  primary: string,
  accent: string,
) {
  return {
    labels: rows.map((r) => r.date),
    datasets: [
      {
        label: 'Visiteurs',
        data: rows.map((r) => r.visitors),
        borderColor: primary,
        backgroundColor: alpha(primary, 10),
        tension: 0.35,
        fill: true,
        pointRadius: 0,
        pointHoverRadius: 4,
      },
      {
        label: 'Pages vues',
        data: rows.map((r) => r.pageviews),
        borderColor: accent,
        backgroundColor: alpha(accent, 5),
        tension: 0.35,
        fill: true,
        pointRadius: 0,
        pointHoverRadius: 4,
      },
    ],
  };
}

/** Options Chart.js de la courbe principale. */
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

/** Dataset Chart.js d'un donut (navigateurs / OS). « Inconnu » si nom vide. */
export function buildDonutChartData(entries: readonly MetricEntry[], palette: readonly string[]) {
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

/** Options Chart.js des donuts. */
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

/** Palette dérivée des tokens du design system (One Indigo Rule). */
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
};

/** Échappe une valeur CSV (guillemets / virgules / sauts de ligne). */
export function escapeCsv(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/** Construit le contenu CSV de l'export analytics (sans BOM). */
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
  return rows.join('\n');
}
