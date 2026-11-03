import {
  dateRangeToParams,
  formatDuration,
  formatPercent,
  formatChartDay,
  pagesPerSession,
  pagesPerSessionLabel,
  buildVisitorsChartData,
  buildVisitorsOnlyChartData,
  escapeCsv,
  buildAnalyticsCsv,
} from './analytics-presenter';
import type {
  DailyChartPoint,
  MetricEntry,
  EntityStat,
  EventCount,
} from './models/analytics.types';
import { makeConversions, makeEventCount, makeStatsOverview } from '../testing/analytics-builders';

describe('analytics-presenter', () => {
  describe('dateRangeToParams', () => {
    const now = new Date('2026-06-06T12:00:00Z');

    it('borne « all » du premier jour de mesure à aujourd’hui', () => {
      expect(dateRangeToParams('all', now)).toEqual({
        startDate: '2026-04-26',
        endDate: '2026-06-06',
      });
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
      expect(pagesPerSession(makeStatsOverview({ sessions: 0 }))).toBe('0');
    });

    it.each([
      [250, 50, '5,0'],
      [10, 3, '3,3'],
      [56, 42, '1,3'],
    ] as const)(
      'calcule %i pages vues / %i sessions à une décimale française : %s',
      (pageviews, sessions, expected) => {
        expect(pagesPerSession(makeStatsOverview({ pageviews, sessions }))).toBe(expected);
      },
    );
  });

  describe('pagesPerSessionLabel', () => {
    it.each([
      [0, 0, '0 page par visite'],
      [56, 42, '1,3 page par visite'],
      [194, 100, '1,9 page par visite'],
      [196, 100, '2,0 pages par visite'],
      [300, 100, '3,0 pages par visite'],
    ] as const)(
      'accorde « page » sur le nombre affiché : %i vues / %i sessions → %s',
      (pageviews, sessions, expected) => {
        expect(pagesPerSessionLabel(makeStatsOverview({ pageviews, sessions }))).toBe(expected);
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

  describe('buildVisitorsChartData', () => {
    const rows: DailyChartPoint[] = [
      { date: '2026-06-01', visitors: 10, pageviews: 30 },
      { date: '2026-06-02', visitors: 20, pageviews: 40 },
    ];

    const palette = { primary: '#primary', foreground: '#foreground' };

    it('mappe labels et deux datasets (visites, pages vues)', () => {
      const data = buildVisitorsChartData(rows, palette);
      expect(data.labels).toEqual(['1 juin', '2 juin']);
      expect(data.datasets).toHaveLength(2);
      expect(data.datasets[0]).toMatchObject({ label: 'Visites', data: [10, 20] });
      expect(data.datasets[1]).toMatchObject({ label: 'Pages vues', data: [30, 40] });
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
      overview: makeStatsOverview({ visitors: 100, bounceRate: 40.5 }),
      topPages: [{ name: '/home', count: 80 }] as MetricEntry[],
      topReferrers: [{ name: '', count: 5 }] as MetricEntry[],
      browsers: [{ name: 'Chrome', count: 60 }] as MetricEntry[],
      osList: [{ name: 'Linux', count: 30 }] as MetricEntry[],
      countries: [{ name: '', count: 10 }] as MetricEntry[],
      topProjects: [{ entityId: 'p1', entityTitle: 'Projet, X', count: 7 }] as EntityStat[],
      topArticles: [{ entityId: 'a1', entityTitle: 'Article', count: 4 }] as EntityStat[],
      topArticlesRead: [{ entityId: 'a1', entityTitle: 'Article', count: 2 }] as EntityStat[],
      contactSubmits: [] as EventCount[],
      outboundClicks: [] as EventCount[],
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

    it('liste les conversions mesurées, puis les formulaires par emplacement et les liens par canal', () => {
      const withConversions = {
        ...sections,
        overview: makeStatsOverview({
          conversions: makeConversions({
            contactSubmits: 3,
            contactClicks: 4,
            profileClicks: 2,
            demoClicks: 1,
            contactSectionViews: 7,
          }),
        }),
        contactSubmits: [makeEventCount({ entityId: 'home', count: 3 })],
        outboundClicks: [makeEventCount({ entityId: 'linkedin', count: 2 })],
      };

      const csv = buildAnalyticsCsv(withConversions).split('\n');

      expect(
        csv.filter((line) =>
          /^KPI,(Formulaires|Contacts|Profils|Démos|Arrivées)|^(Formulaire|Lien),/.test(line),
        ),
      ).toEqual([
        'KPI,Formulaires envoyés,3',
        'KPI,Contacts directs,4',
        'KPI,Profils ouverts,2',
        'KPI,Démos ouvertes,1',
        "KPI,Arrivées sur le formulaire de l'accueil,7",
        'Formulaire,home,3',
        'Lien,linkedin,2',
      ]);
    });

    it('n’écrit aucun zéro de conversion sur une période non mesurée', () => {
      const csv = buildAnalyticsCsv({
        ...sections,
        overview: makeStatsOverview({ conversions: makeConversions({ measuredSince: null }) }),
      });

      expect(csv).not.toMatch(/^KPI,Formulaires envoyés,/m);
    });

    it('omet les KPIs si overview est absent', () => {
      const csv = buildAnalyticsCsv({ ...sections, overview: undefined });
      expect(csv).not.toContain('KPI,Visiteurs');
      expect(csv.split('\n')[0]).toBe('Section,Label,Count');
    });
  });
});
