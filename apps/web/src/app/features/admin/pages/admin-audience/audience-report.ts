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
import { groupedNumber } from '@shared/format/grouped-number';
import { audienceOverline } from '../../application/admin-page-copy';
import {
  conversionTotals,
  conversionsNote,
  toChannelEntries,
  toPlacementEntries,
} from '../../application/audience-conversions-view';
import {
  audienceLead,
  detailNote,
  toShareRows,
  toTallyRows,
  type TallyRow,
} from '../../application/audience-view';
import type { ReadoutItem } from '../../application/components/admin-readout';
import { toAudienceReadout } from '../../application/overview-view';

type TallyGroup = { readonly heading: string; readonly rows: readonly TallyRow[] };

const SHARE_LIMIT = 5;
const TALLY_LIMIT = 5;
// Conversions : peu de lignes possibles (emplacements, canaux), toutes comptent.
const ALL_ROWS = Number.POSITIVE_INFINITY;

// `value()` lève en état d'erreur : toute lecture de ressource passe par `hasValue()`.
const valueOr = <T, F>(source: ResourceRef<T | undefined>, fallback: F): T | F =>
  source.hasValue() ? (source.value() ?? fallback) : fallback;

const sum = (entries: readonly { readonly count: number }[]): number =>
  entries.reduce((total, entry) => total + entry.count, 0);

const asEntries = (stats: readonly EntityStat[]): readonly MetricEntry[] =>
  stats.map((stat) => ({ name: stat.entityTitle, count: stat.count }));

const tallyGroup = (
  heading: string,
  entries: readonly MetricEntry[],
  limit = TALLY_LIMIT,
): TallyGroup => ({ heading, rows: toTallyRows(entries, limit, 'Inconnu') });

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
  private readonly _contactSubmits = this.periodic((p) =>
    this._analytics.getEventCounts('contact_submit', p.startDate, p.endDate),
  );
  private readonly _outboundClicks = this.periodic((p) =>
    this._analytics.getEventCounts('outbound_click', p.startDate, p.endDate),
  );

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
    this._contactSubmits,
    this._outboundClicks,
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
  private readonly _contactSubmitCounts = computed(() => valueOr(this._contactSubmits, []));
  private readonly _outboundClickCounts = computed(() => valueOr(this._outboundClicks, []));

  readonly lead = computed(() =>
    audienceLead(
      this.overview(),
      this._referrerEntries().find((entry) => entry.name !== '') ?? null,
    ),
  );

  readonly readout = computed<readonly ReadoutItem[]>(() => {
    const overview = this.overview();
    if (overview === null) return [];
    return [
      {
        label: 'Visites',
        value: groupedNumber(overview.sessions),
        unit: '',
        detail: 'un appareil, une journée',
      },
      ...toAudienceReadout(overview, this._period().startDate),
    ];
  });

  readonly detailNote = computed(() => detailNote(this.overview(), this._period().startDate));
  readonly conversionsNote = computed(() =>
    conversionsNote(this.overview(), this._period().startDate),
  );

  readonly conversions = computed<readonly TallyGroup[]>(() => {
    const overview = this.overview();
    const totals = overview ? conversionTotals(overview) : [];
    if (totals.length === 0) return [];
    return [
      tallyGroup('Totaux', totals, ALL_ROWS),
      tallyGroup(
        'Formulaires par emplacement',
        toPlacementEntries(this._contactSubmitCounts()),
        ALL_ROWS,
      ),
      tallyGroup('Liens par canal', toChannelEntries(this._outboundClickCounts()), ALL_ROWS),
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
    return [
      tallyGroup('Totaux', totals),
      tallyGroup('Projets cliqués', asEntries(valueOr(this._projects, []))),
      tallyGroup('Articles ouverts', asEntries(valueOr(this._articles, []))),
      tallyGroup("Articles lus jusqu'au bout", asEntries(this._articlesReadStats())),
      tallyGroup('CTA cliqués', asEntries(valueOr(this._cta, []))),
      tallyGroup('Navigateurs', valueOr(this._browsers, [])),
      tallyGroup('Systèmes', valueOr(this._systems, [])),
      tallyGroup('Pays', valueOr(this._countries, [])),
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
      contactSubmits: this._contactSubmitCounts(),
      outboundClicks: this._outboundClickCounts(),
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
