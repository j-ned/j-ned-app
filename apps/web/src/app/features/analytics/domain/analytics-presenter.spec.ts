import {
  dateRangeToParams,
  formatDuration,
  formatPercent,
  formatChartDay,
  pagesPerSession,
  pagesPerSessionLabel,
  barWidth,
  alpha,
  buildVisitorsChartData,
  buildVisitorsOnlyChartData,
  buildLineChartOptions,
  buildDonutChartData,
  buildDonutOptions,
  buildPalette,
  escapeCsv,
  buildAnalyticsCsv,
} from './analytics-presenter';
import type {
  StatsOverview,
  DailyChartPoint,
  MetricEntry,
  EntityStat,
} from './models/analytics.types';

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
  ctaClicks: 6,
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
      [0, '0\u00a0s'],
      [22, '22\u00a0s'],
      [59, '59\u00a0s'],
      [60, '1\u00a0min 00\u00a0s'],
      [65, '1\u00a0min 05\u00a0s'],
      [600, '10\u00a0min 00\u00a0s'],
      [3600, '60\u00a0min 00\u00a0s'],
    ] as const)('formate %i secondes en %s', (sec, expected) => {
      expect(formatDuration(sec)).toBe(expected);
    });
  });

  describe('pagesPerSession', () => {
    it('renvoie « 0 » sans overview ou sans session', () => {
      expect(pagesPerSession(undefined)).toBe('0');
      expect(pagesPerSession(overview({ sessions: 0 }))).toBe('0');
    });

    it.each([
      [250, 50, '5,0'],
      [10, 3, '3,3'],
      [56, 42, '1,3'],
    ] as const)(
      'calcule %i pages vues / %i sessions à une décimale française : %s',
      (pageviews, sessions, expected) => {
        expect(pagesPerSession(overview({ pageviews, sessions }))).toBe(expected);
      },
    );
  });

  describe('pagesPerSessionLabel', () => {
    it.each([
      [0, 0, '0 page par session'],
      [56, 42, '1,3 page par session'],
      [194, 100, '1,9 page par session'],
      [196, 100, '2,0 pages par session'],
      [300, 100, '3,0 pages par session'],
    ] as const)(
      'accorde « page » sur le nombre affiché : %i vues / %i sessions → %s',
      (pageviews, sessions, expected) => {
        expect(pagesPerSessionLabel(overview({ pageviews, sessions }))).toBe(expected);
      },
    );
  });

  describe('formatPercent', () => {
    it.each([
      [0, '0\u00a0%'],
      [88.1, '88,1\u00a0%'],
      [12.34, '12,3\u00a0%'],
      [100, '100\u00a0%'],
    ] as const)('formate %f en %s', (value, expected) => {
      expect(formatPercent(value)).toBe(expected);
    });
  });

  describe('formatChartDay', () => {
    it.each([
      ['2026-09-07', '7 sept.'],
      ['2026-06-01', '1 juin'],
      ['2026-01-31', '31 janv.'],
    ] as const)('libelle le jour %s en %s, sans décalage de fuseau', (day, expected) => {
      expect(formatChartDay(day)).toBe(expected);
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

    const palette = { primary: '#primary', foreground: '#foreground' };

    it('mappe labels et deux datasets (visiteurs, pages vues) à traits droits', () => {
      const data = buildVisitorsChartData(rows, palette);
      expect(data.labels).toEqual(['1 juin', '2 juin']);
      expect(data.datasets).toHaveLength(2);
      expect(data.datasets[0]).toMatchObject({
        label: 'Visiteurs',
        data: [10, 20],
        borderColor: '#primary',
        tension: 0,
      });
      expect(data.datasets[1]).toMatchObject({
        label: 'Pages vues',
        data: [30, 40],
        borderColor: 'color-mix(in srgb, #foreground 55%, transparent)',
        borderDash: [4, 4],
        tension: 0,
      });
    });

    it('trace les visiteurs en plein et les pages vues en tirets', () => {
      const data = buildVisitorsChartData(rows, palette);
      expect(data.datasets.map((dataset) => dataset.borderDash)).toEqual([undefined, [4, 4]]);
    });

    it("ne tire chaque couleur que de l'indigo ou du texte du registre", () => {
      const colors = buildVisitorsChartData(rows, palette).datasets.flatMap((dataset) =>
        Object.entries(dataset)
          .filter(([key]) => key.endsWith('Color'))
          .map(([, value]) => String(value)),
      );
      expect(colors.length).toBeGreaterThan(0);
      expect(colors.filter((color) => !/#primary\b|#foreground\b/.test(color))).toEqual([]);
    });
  });

  describe('buildVisitorsOnlyChartData', () => {
    const rows: DailyChartPoint[] = [
      { date: '2026-06-01', visitors: 10, pageviews: 30 },
      { date: '2026-06-02', visitors: 20, pageviews: 40 },
    ];
    const palette = { primary: '#primary', foreground: '#foreground' };

    it('ne trace que la courbe des visiteurs, identique à celle de la courbe complète', () => {
      const data = buildVisitorsOnlyChartData(rows, palette);
      expect(data.labels).toEqual(['1 juin', '2 juin']);
      expect(data.datasets).toEqual([buildVisitorsChartData(rows, palette).datasets[0]]);
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
      topArticlesRead: [{ entityId: 'a1', entityTitle: 'Article', count: 2 }] as EntityStat[],
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

    it('liste les articles réellement lus (article_read) sous "Article lu"', () => {
      const csv = buildAnalyticsCsv(sections);
      expect(csv).toContain('Article lu,Article,2');
    });

    it('omet les KPIs si overview est absent', () => {
      const csv = buildAnalyticsCsv({ ...sections, overview: undefined });
      expect(csv).not.toContain('KPI,Visiteurs');
      expect(csv.split('\n')[0]).toBe('Section,Label,Count');
    });
  });
});
