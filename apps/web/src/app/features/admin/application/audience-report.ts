import { Injectable, computed, inject, signal, type ResourceRef } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import type { Observable } from 'rxjs';
import {
  buildAnalyticsCsv,
  dateRangeToParams,
  type DateRangeKey,
  type RangeParams,
} from '@features/analytics/domain/analytics-presenter';
import { AnalyticsGateway } from '@features/analytics/domain/gateways/analytics.gateway';
import type { EntityStat, MetricEntry } from '@features/analytics/domain/models/analytics.types';
import { audienceOverline } from './admin-page-copy';
import { audienceLead, toShareRows, toTallyRows, type TallyRow } from './audience-view';
import type { ReadoutItem } from './components/admin-readout';
import { groupedNumber, toAudienceReadout } from './overview-view';
import { pluralize } from './pluralize';

type TallyGroup = { readonly heading: string; readonly rows: readonly TallyRow[] };

const SHARE_LIMIT = 5;
const TALLY_LIMIT = 5;

// `value()` lève en état d'erreur : toute lecture de ressource passe par `hasValue()`.
const valueOr = <T, F>(source: ResourceRef<T | undefined>, fallback: F): T | F =>
  source.hasValue() ? (source.value() ?? fallback) : fallback;

const sum = (entries: readonly { readonly count: number }[]): number =>
  entries.reduce((total, entry) => total + entry.count, 0);

const asEntries = (stats: readonly EntityStat[]): readonly MetricEntry[] =>
  stats.map((stat) => ({ name: stat.entityTitle, count: stat.count }));

@Injectable()
export class AudienceReport {
  private readonly _analytics = inject(AnalyticsGateway);
  private readonly _now = new Date();

  readonly range = signal<DateRangeKey>('30d');
  private readonly _period = computed(() => dateRangeToParams(this.range(), this._now));

  private readonly _overview = this.periodic((p) =>
    this._analytics.getOverview(p.startDate, p.endDate),
  );
  private readonly _chart = this.periodic((p) => this._analytics.getChart(p.startDate, p.endDate));
  private readonly _pages = this.metric('url');
  private readonly _referrers = this.metric('referrer');
  private readonly _browsers = this.metric('browser');
  private readonly _systems = this.metric('os');
  private readonly _countries = this.metric('country');
  private readonly _projects = this.periodic((p) =>
    this._analytics.getProjectStats(p.startDate, p.endDate),
  );
  private readonly _articles = this.periodic((p) =>
    this._analytics.getArticleStats(p.startDate, p.endDate),
  );
  private readonly _articlesRead = this.periodic((p) =>
    this._analytics.getArticleReadStats(p.startDate, p.endDate),
  );
  private readonly _cta = this.periodic((p) => this._analytics.getCtaStats(p.startDate, p.endDate));

  private readonly _sources: readonly ResourceRef<unknown>[] = [
    this._overview,
    this._chart,
    this._pages,
    this._referrers,
    this._browsers,
    this._systems,
    this._countries,
    this._projects,
    this._articles,
    this._articlesRead,
    this._cta,
  ];
  private readonly _failed = computed(() =>
    this._sources.filter((source) => source.status() === 'error'),
  );

  readonly hasError = computed(() => this._failed().length > 0);
  readonly isLoading = computed(() => this._sources.some((source) => source.isLoading()));

  readonly overline = computed(() => audienceOverline(this.range(), this._now));
  readonly overview = computed(() => valueOr(this._overview, null));
  readonly chartPoints = computed(() => valueOr(this._chart, []));

  private readonly _pageEntries = computed(() => valueOr(this._pages, []));
  private readonly _referrerEntries = computed(() => valueOr(this._referrers, []));
  private readonly _articlesReadStats = computed(() => valueOr(this._articlesRead, []));

  readonly lead = computed(() =>
    audienceLead(
      this.overview(),
      this._referrerEntries().find((entry) => entry.name !== '') ?? null,
    ),
  );

  readonly readout = computed<readonly ReadoutItem[]>(() => {
    const overview = this.overview();
    if (overview === null) return [];
    const { visitors, sessions } = overview;
    return [
      {
        label: 'Visiteurs',
        value: groupedNumber(visitors),
        unit: '',
        detail: `${groupedNumber(sessions)} ${pluralize(sessions, 'session', 'sessions')}`,
      },
      ...toAudienceReadout(overview),
    ];
  });

  readonly pages = computed(() =>
    toShareRows(this._pageEntries(), sum(this._pageEntries()), SHARE_LIMIT, '/'),
  );
  readonly referrers = computed(() =>
    toShareRows(this._referrerEntries(), sum(this._referrerEntries()), SHARE_LIMIT, 'Accès direct'),
  );

  readonly events = computed<readonly TallyGroup[]>(() => {
    const overview = this.overview();
    const totals: readonly MetricEntry[] = overview
      ? [
          { name: 'Projets cliqués', count: overview.projectClicks },
          { name: 'Articles ouverts', count: overview.articleViews },
          { name: "Articles lus jusqu'au bout", count: sum(this._articlesReadStats()) },
          { name: 'CTA cliqués', count: overview.ctaClicks },
          { name: 'CV téléchargés', count: overview.cvDownloads },
        ]
      : [];
    const group = (heading: string, entries: readonly MetricEntry[]): TallyGroup => ({
      heading,
      rows: toTallyRows(entries, TALLY_LIMIT, 'Inconnu'),
    });
    return [
      group('Totaux', totals),
      group('Projets cliqués', asEntries(valueOr(this._projects, []))),
      group('Articles ouverts', asEntries(valueOr(this._articles, []))),
      group("Articles lus jusqu'au bout", asEntries(this._articlesReadStats())),
      group('CTA cliqués', asEntries(valueOr(this._cta, []))),
      group('Navigateurs', valueOr(this._browsers, [])),
      group('Systèmes', valueOr(this._systems, [])),
      group('Pays', valueOr(this._countries, [])),
    ];
  });

  readonly csv = computed(() =>
    buildAnalyticsCsv({
      overview: this.overview() ?? undefined,
      topPages: this._pageEntries(),
      topReferrers: this._referrerEntries(),
      browsers: valueOr(this._browsers, []),
      osList: valueOr(this._systems, []),
      countries: valueOr(this._countries, []),
      topProjects: valueOr(this._projects, []),
      topArticles: valueOr(this._articles, []),
      topArticlesRead: this._articlesReadStats(),
    }),
  );

  retry(): void {
    this._failed().forEach((source) => source.reload());
  }

  private metric(type: string): ResourceRef<MetricEntry[] | undefined> {
    return this.periodic((p) => this._analytics.getMetrics(type, p.startDate, p.endDate));
  }

  private periodic<T>(load: (period: RangeParams) => Observable<T>): ResourceRef<T | undefined> {
    return rxResource({ params: () => this._period(), stream: ({ params }) => load(params) });
  }
}
