import {
  dateRangeToParams,
  formatDuration,
  pagesPerSession,
  barWidth,
  alpha,
  buildVisitorsChartData,
  buildLineChartOptions,
  buildDonutChartData,
  buildDonutOptions,
  buildPalette,
  escapeCsv,
  buildAnalyticsCsv,
} from './analytics-presenter';
import type { StatsOverview, DailyChartPoint, MetricEntry, EntityStat } from './models/analytics.types';

const overview = (p: Partial<StatsOverview> = {}): StatsOverview => ({
  visitors: 100,
  pageviews: 250,
  sessions: 50,
  bounces: 20,
  bounceRate: 40,
  avgDuration: 75,
  projectClicks: 12,
  articleViews: 8,
  cvDownloads: 3,
  ...p,
});

describe('analytics-presenter', () => {
  describe('dateRangeToParams', () => {
    const now = new Date('2026-06-06T12:00:00Z');

    it('renvoie des bornes vides pour « all »', () => {
      expect(dateRangeToParams('all', now)).toEqual({ startDate: undefined, endDate: undefined });
    });

    it.each([
      ['7d', '2026-05-30'],
      ['30d', '2026-05-07'],
      ['90d', '2026-03-08'],
    ] as const)('calcule la borne de début pour %s', (key, expectedStart) => {
      const { startDate, endDate } = dateRangeToParams(key, now);
      expect(startDate).toBe(expectedStart);
      expect(endDate).toBe('2026-06-06');
    });
  });

  describe('formatDuration', () => {
    it.each([
      [0, '0s'],
      [45, '45s'],
      [75, '1m 15s'],
      [600, '10m 00s'],
    ] as const)('formate %i secondes en %s', (sec, expected) => {
      expect(formatDuration(sec)).toBe(expected);
    });
  });

  describe('pagesPerSession', () => {
    it('renvoie « 0 » sans overview ou sans session', () => {
      expect(pagesPerSession(undefined)).toBe('0');
      expect(pagesPerSession(overview({ sessions: 0 }))).toBe('0');
    });

    it('calcule pageviews/sessions à une décimale', () => {
      expect(pagesPerSession(overview({ pageviews: 250, sessions: 50 }))).toBe('5.0');
      expect(pagesPerSession(overview({ pageviews: 10, sessions: 3 }))).toBe('3.3');
    });
  });

  describe('barWidth', () => {
    it('renvoie le pourcentage value/max, 0 si max ≤ 0', () => {
      expect(barWidth(5, 10)).toBe(50);
      expect(barWidth(10, 10)).toBe(100);
      expect(barWidth(5, 0)).toBe(0);
    });
  });

  describe('alpha', () => {
    it('produit une couleur color-mix translucide', () => {
      expect(alpha('red', 40)).toBe('color-mix(in srgb, red 40%, transparent)');
    });
  });

  describe('buildVisitorsChartData', () => {
    const rows: DailyChartPoint[] = [
      { date: '2026-06-01', visitors: 10, pageviews: 30 },
      { date: '2026-06-02', visitors: 20, pageviews: 40 },
    ];

    it('mappe labels et deux datasets (visiteurs, pages vues)', () => {
      const data = buildVisitorsChartData(rows, '#primary', '#accent');
      expect(data.labels).toEqual(['2026-06-01', '2026-06-02']);
      expect(data.datasets).toHaveLength(2);
      expect(data.datasets[0]).toMatchObject({ label: 'Visiteurs', data: [10, 20], borderColor: '#primary' });
      expect(data.datasets[1]).toMatchObject({ label: 'Pages vues', data: [30, 40], borderColor: '#accent' });
    });
  });

  describe('buildLineChartOptions', () => {
    it('produit des options non-responsive-aspect avec axes et tooltip', () => {
      const opts = buildLineChartOptions('#fg', '#bg');
      expect(opts.maintainAspectRatio).toBe(false);
      expect(opts.scales.y.beginAtZero).toBe(true);
      expect(opts.plugins.legend.display).toBe(false);
      expect(opts.plugins.tooltip.backgroundColor).toBe('color-mix(in srgb, #bg 95%, transparent)');
    });
  });

  describe('buildDonutChartData', () => {
    it('mappe les noms (« Inconnu » si vide) et applique la palette', () => {
      const entries: MetricEntry[] = [
        { name: 'Chrome', count: 5 },
        { name: '', count: 2 },
      ];
      const data = buildDonutChartData(entries, ['#a', '#b']);
      expect(data.labels).toEqual(['Chrome', 'Inconnu']);
      expect(data.datasets[0].data).toEqual([5, 2]);
      expect(data.datasets[0].backgroundColor).toEqual(['#a', '#b']);
    });
  });

  describe('buildDonutOptions', () => {
    it('utilise un cutout 60% et une légende en bas', () => {
      const opts = buildDonutOptions('#fg', '#bg');
      expect(opts.cutout).toBe('60%');
      expect(opts.plugins.legend.position).toBe('bottom');
    });
  });

  describe('buildPalette', () => {
    it('produit 7 entrées dérivées des tokens', () => {
      const palette = buildPalette({ primary: '#p', accent: '#a', success: '#s', warn: '#w' });
      expect(palette).toHaveLength(7);
      expect(palette[0]).toBe('#p');
      expect(palette[4]).toBe('#s');
      expect(palette[2]).toBe('color-mix(in srgb, #p 70%, transparent)');
    });
  });

  describe('escapeCsv', () => {
    it('laisse une valeur simple intacte', () => {
      expect(escapeCsv('Chrome')).toBe('Chrome');
    });

    it('entoure de guillemets et double les guillemets internes', () => {
      expect(escapeCsv('a,b')).toBe('"a,b"');
      expect(escapeCsv('say "hi"')).toBe('"say ""hi"""');
    });
  });

  describe('buildAnalyticsCsv', () => {
    const sections = {
      overview: overview({ visitors: 100, bounceRate: 40.5 }),
      topPages: [{ name: '/home', count: 80 }] as MetricEntry[],
      topReferrers: [{ name: '', count: 5 }] as MetricEntry[],
      browsers: [{ name: 'Chrome', count: 60 }] as MetricEntry[],
      osList: [{ name: 'Linux', count: 30 }] as MetricEntry[],
      countries: [{ name: '', count: 10 }] as MetricEntry[],
      topProjects: [{ entityId: 'p1', entityTitle: 'Projet, X', count: 7 }] as EntityStat[],
      topArticles: [{ entityId: 'a1', entityTitle: 'Article', count: 4 }] as EntityStat[],
    };

    it('démarre par l’en-tête et liste les KPIs', () => {
      const csv = buildAnalyticsCsv(sections).split('\n');
      expect(csv[0]).toBe('Section,Label,Count');
      expect(csv).toContain('KPI,Visiteurs,100');
      expect(csv).toContain('KPI,Taux de rebond (%),40.50');
    });

    it('libelle les referrers vides « Direct » et les pays vides « Inconnu »', () => {
      const csv = buildAnalyticsCsv(sections);
      expect(csv).toContain('Referrer,Direct,5');
      expect(csv).toContain('Pays,Inconnu,10');
    });

    it('échappe les valeurs contenant une virgule', () => {
      const csv = buildAnalyticsCsv(sections);
      expect(csv).toContain('Projet,"Projet, X",7');
    });

    it('omet les KPIs si overview est absent', () => {
      const csv = buildAnalyticsCsv({ ...sections, overview: undefined });
      expect(csv).not.toContain('KPI,Visiteurs');
      expect(csv.split('\n')[0]).toBe('Section,Label,Count');
    });
  });
});
