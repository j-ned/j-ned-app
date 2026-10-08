import { Component, computed, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, EMPTY, interval, map, startWith, switchMap } from 'rxjs';
import { AnalyticsDeviceExclusion } from '@core/analytics/analytics-device-exclusion';
import { ThemeStore } from '@core/theme/theme-store';
import {
  buildLineChartOptions,
  buildVisitorsChartData,
  type DateRangeKey,
} from '@features/analytics/domain/analytics-presenter';
import { AnalyticsGateway } from '@features/analytics/domain/gateways/analytics.gateway';
import { AppIcon } from '@shared/icons/app-icon';
import { Button } from '@shared/ui/button';
import { FilterGroup, type FilterOption } from '@shared/ui/filter-group';
import { LoadError } from '@shared/ui/load-error';
import { AppSkeleton } from '@shared/ui/skeleton';
import { AudienceReport } from './audience-report';
import { readChartPalette, readThemeColor } from './chart-palette';
import { AdminPageHeader } from './components/admin-page-header';
import { AdminReadout } from './components/admin-readout';
import { AdminSectionHead } from './components/admin-section-head';
import { AudienceChart } from './components/audience-chart';
import { AudienceShareTable } from './components/audience-share-table';
import { AudienceTally } from './components/audience-tally';
import { groupedNumber } from './overview-view';
import { pluralize } from './pluralize';

const ACTIVE_VISITORS_REFRESH_MS = 30_000;

const PERIODS: readonly FilterOption<DateRangeKey>[] = [
  { value: '7d', label: '7 jours' },
  { value: '30d', label: '30 jours' },
  { value: '90d', label: '90 jours' },
  { value: 'all', label: 'Depuis le début' },
];

@Component({
  selector: 'app-admin-audience',
  imports: [
    AppIcon,
    Button,
    FilterGroup,
    LoadError,
    AppSkeleton,
    AdminPageHeader,
    AdminReadout,
    AdminSectionHead,
    AudienceChart,
    AudienceShareTable,
    AudienceTally,
  ],
  providers: [AudienceReport],
  host: { class: 'block' },
  template: `
    <app-admin-page-header [overline]="report.overline()" heading="Audience">
      @if (report.lead(); as lead) {
        <span data-testid="audience-lead">{{ lead }}</span>
      }
      <div adminPageAside class="grid justify-items-start gap-3 lg:justify-items-end">
        <p class="inline-flex items-center gap-2 text-sm">
          <span aria-hidden="true" class="size-1.5 rounded-full bg-status-success"></span>
          <span data-testid="audience-active-visitors"
            ><span class="font-mono font-semibold tabular-nums">{{ activeVisitors().count }}</span>
            {{ activeVisitors().label }}</span
          >
        </p>
        <div class="flex flex-wrap gap-2.5 lg:justify-end">
          <button
            type="button"
            data-testid="device-exclusion-toggle"
            [attr.aria-pressed]="deviceExclusion.excluded()"
            (click)="deviceExclusion.toggle()"
            class="link-btn-outline cursor-pointer aria-pressed:border-primary"
          >
            <app-icon [name]="deviceExclusion.excluded() ? 'shield' : 'eye'" [size]="16" />
            {{ deviceExclusion.excluded() ? 'Cet appareil est exclu' : 'Exclure cet appareil' }}
          </button>
          <app-button
            severity="secondary"
            variant="outlined"
            data-testid="analytics-export-csv"
            (click)="exportCsv()"
          >
            <app-icon name="download" [size]="16" />
            Exporter en CSV
          </app-button>
        </div>
      </div>
    </app-admin-page-header>

    <app-filter-group label="Période" [options]="periods" [(active)]="report.range" />

    @if (report.hasError()) {
      <app-load-error
        message="Une partie des statistiques n'a pas pu être chargée."
        (retry)="report.retry()"
      />
    } @else if (report.isLoading()) {
      <div data-testid="audience-loading" role="status" class="mt-7 grid gap-6">
        <span class="sr-only">Chargement des statistiques…</span>
        <app-skeleton class="block h-28 rounded-sm" />
        <app-skeleton class="block h-72 rounded-sm" />
        <app-skeleton class="block h-56 rounded-sm" />
      </div>
    } @else {
      <app-admin-readout class="mt-7" [items]="report.readout()" />

      <section class="mt-12" aria-labelledby="audience-chart-heading">
        <app-admin-section-head heading="Visites par jour" headingId="audience-chart-heading">
          <p aria-hidden="true" class="flex gap-4.5 text-[0.8125rem] text-muted">
            <span class="inline-flex items-center gap-2">
              <i class="inline-block w-4 border-t-2 border-primary"></i>Visiteurs
            </span>
            <span class="inline-flex items-center gap-2">
              <i class="inline-block w-4 border-t-2 border-dashed border-foreground/55"></i>Pages
              vues
            </span>
          </p>
        </app-admin-section-head>
        <app-audience-chart
          [points]="report.chartPoints()"
          [data]="chartData()"
          [options]="chartOptions()"
        />
      </section>

      <div class="mt-12 grid gap-10 lg:grid-cols-2 lg:gap-14">
        <app-audience-share-table
          heading="Pages les plus vues"
          headingId="audience-pages-heading"
          labelHeader="Page"
          unitLabel="Vues"
          [rows]="report.pages()"
        />
        <app-audience-share-table
          heading="Provenance"
          headingId="audience-referrers-heading"
          labelHeader="Source"
          unitLabel="Sessions"
          [rows]="report.referrers()"
        />
      </div>

      <section class="mt-12" aria-labelledby="audience-events-heading">
        <app-admin-section-head
          heading="Ce que les visiteurs font"
          headingId="audience-events-heading"
        />
        <div class="mt-5 grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
          @for (group of report.events(); track group.heading) {
            <app-audience-tally [heading]="group.heading" [rows]="group.rows" />
          }
        </div>
      </section>
    }
  `,
})
export class AdminAudience {
  private readonly _analytics = inject(AnalyticsGateway);
  private readonly _document = inject(DOCUMENT);
  private readonly _isDark = inject(ThemeStore).isDark;
  protected readonly report = inject(AudienceReport);
  protected readonly deviceExclusion = inject(AnalyticsDeviceExclusion);

  protected readonly periods = PERIODS;

  private readonly _activeCount = toSignal(
    interval(ACTIVE_VISITORS_REFRESH_MS).pipe(
      startWith(0),
      switchMap(() => this._analytics.getActiveVisitors().pipe(catchError(() => EMPTY))),
      map((visitors) => visitors.count),
    ),
    { initialValue: 0 },
  );
  protected readonly activeVisitors = computed(() => {
    const count = this._activeCount();
    return {
      count: groupedNumber(count),
      label: `${pluralize(count, 'visiteur', 'visiteurs')} en ce moment`,
    };
  });

  // Les couleurs viennent des variables CSS du registre courant : relues à chaque bascule de thème.
  private readonly _palette = computed(() => {
    this._isDark();
    return {
      line: readChartPalette(this._document),
      background: readThemeColor(this._document, '--theme-background', 'Canvas'),
    };
  });
  protected readonly chartData = computed(() =>
    buildVisitorsChartData(this.report.chartPoints(), this._palette().line),
  );
  protected readonly chartOptions = computed(() =>
    buildLineChartOptions(this._palette().line.foreground, this._palette().background),
  );

  protected exportCsv(): void {
    const blob = new Blob(['\uFEFF' + this.report.csv()], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = this._document.createElement('a');
    link.href = url;
    link.download = `analytics-${this.report.range()}-${new Date().toISOString().slice(0, 10)}.csv`;
    this._document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }
}
