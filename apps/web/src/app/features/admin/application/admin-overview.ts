import { Component, computed, inject, type Resource, type ResourceRef } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { ThemeStore } from '@core/theme/theme-store';
import {
  buildLineChartOptions,
  buildVisitorsOnlyChartData,
  dateRangeToParams,
} from '@features/analytics/domain/analytics-presenter';
import { AnalyticsGateway } from '@features/analytics/domain/gateways/analytics.gateway';
import { BlogGateway } from '@features/blog/domain/gateways/blog.gateway';
import { ContactGateway } from '@features/contact/domain/gateways/contact.gateway';
import { ProjectsGateway } from '@features/projects/domain/gateways/projects.gateway';
import { AppIcon } from '@shared/icons/app-icon';
import { Cartouche } from '@shared/ui/cartouche';
import { LoadError } from '@shared/ui/load-error';
import { AppSkeleton } from '@shared/ui/skeleton';
import { todayOverline } from './admin-page-copy';
import { readChartPalette, readThemeColor } from './chart-palette';
import { AdminPageHeader } from './components/admin-page-header';
import { AdminSectionHead } from './components/admin-section-head';
import { OverviewAudience } from './components/overview-audience';
import { OverviewContacts } from './components/overview-contacts';
import { OverviewContent } from './components/overview-content';
import { overviewSummary } from './overview-copy';
import {
  chartSummary,
  latestMessages,
  toAudienceReadout,
  toContentRows,
  toOnlineRows,
} from './overview-view';

// `value()` lève en état d'erreur : toute lecture de ressource passe par `hasValue()`.
const valueOrNull = <T>(source: Resource<T | undefined>): T | null =>
  source.hasValue() ? (source.value() ?? null) : null;

const failed = (sources: readonly ResourceRef<unknown>[]): readonly ResourceRef<unknown>[] =>
  sources.filter((source) => source.status() === 'error');

@Component({
  selector: 'app-admin-overview',
  imports: [
    RouterLink,
    AppIcon,
    Cartouche,
    AppSkeleton,
    LoadError,
    AdminPageHeader,
    AdminSectionHead,
    OverviewAudience,
    OverviewContacts,
    OverviewContent,
  ],
  host: { class: 'block' },
  template: `
    <app-admin-page-header [overline]="overline" heading="Vue d'ensemble">
      @if (summary(); as text) {
        <span data-testid="overview-summary">{{ text }}</span>
      }
      <div adminPageAside data-testid="overview-online">
        @if (contentLoading()) {
          <div data-testid="overview-online-loading" role="status">
            <span class="sr-only">Chargement du contenu en ligne…</span>
            <app-skeleton class="block h-56 rounded-sm" />
          </div>
        } @else {
          <app-cartouche title="En ligne" reference="nedellec-julien.fr" [rows]="onlineRows()" />
        }
      </div>
    </app-admin-page-header>

    <div class="grid gap-12 lg:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)] lg:gap-14">
      <app-overview-audience
        data-testid="overview-audience"
        [visitors]="overview()?.visitors ?? null"
        [sessions]="overview()?.sessions ?? null"
        [readout]="readout()"
        [chartData]="chartData()"
        [chartOptions]="chartOptions()"
        [chartSummary]="chartCaption()"
      >
        @if (audienceLoading()) {
          <div data-testid="overview-audience-loading" role="status" class="grid gap-4 pt-5.5">
            <span class="sr-only">Chargement de l'audience…</span>
            <app-skeleton class="block h-32 rounded-sm" />
            <app-skeleton class="block h-20 rounded-sm" />
          </div>
        }
        @if (audienceFailures().length > 0) {
          <app-load-error
            message="Une partie des statistiques n'a pas pu être chargée."
            (retry)="reload(audienceFailures())"
          />
        }
      </app-overview-audience>

      <app-overview-contacts
        data-testid="overview-contacts"
        [unread]="unread()"
        [cvDownloads]="overview()?.cvDownloads ?? null"
        [latest]="latest()"
        [unreadLoading]="unreadRes.isLoading()"
        [cvLoading]="overviewRes.isLoading()"
      >
        @if (messagesRes.isLoading()) {
          <div data-testid="overview-contacts-loading" role="status" class="grid gap-2 pt-4">
            <span class="sr-only">Chargement des messages…</span>
            <app-skeleton class="block h-12 rounded-sm" />
            <app-skeleton class="block h-12 rounded-sm" />
          </div>
        }
        @if (contactsFailures().length > 0) {
          <app-load-error
            message="Les messages n'ont pas pu être chargés."
            (retry)="reload(contactsFailures())"
          />
        }
      </app-overview-contacts>
    </div>

    <div class="mt-12 grid gap-12 lg:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)] lg:gap-14">
      <app-overview-content data-testid="overview-content" [rows]="contentRows()">
        @if (contentLoading()) {
          <div data-testid="overview-content-loading" role="status" class="grid gap-2 pt-4">
            <span class="sr-only">Chargement du contenu en ligne…</span>
            <app-skeleton class="block h-16 rounded-sm" />
            <app-skeleton class="block h-16 rounded-sm" />
            <app-skeleton class="block h-16 rounded-sm" />
          </div>
        }
        @if (contentFailures().length > 0) {
          <app-load-error
            message="Une partie du contenu en ligne n'a pas pu être chargée."
            (retry)="reload(contentFailures())"
          />
        }
      </app-overview-content>

      <section data-testid="overview-quick" aria-labelledby="overview-quick-heading">
        <app-admin-section-head heading="Actions rapides" headingId="overview-quick-heading" />
        <div class="mt-5 flex flex-wrap gap-2.5">
          <a data-testid="quick-new-project" routerLink="/admin/projects" class="link-btn-primary">
            <app-icon name="plus" [size]="16" />Nouveau projet
          </a>
          <a data-testid="quick-new-post" routerLink="/admin/blog" class="link-btn-outline">
            <app-icon name="plus" [size]="16" />Nouvel article
          </a>
          <a data-testid="quick-cv" routerLink="/admin/cv" class="link-btn-outline">
            <app-icon name="upload" [size]="16" />Remplacer le CV
          </a>
          <a data-testid="quick-audience" routerLink="/admin/audience" class="link-btn-outline">
            <app-icon name="arrow-right" [size]="16" />Voir l'audience
          </a>
        </div>
      </section>
    </div>
  `,
})
export class AdminOverview {
  private readonly _projects = inject(ProjectsGateway);
  private readonly _blog = inject(BlogGateway);
  private readonly _contact = inject(ContactGateway);
  private readonly _analytics = inject(AnalyticsGateway);
  private readonly _document = inject(DOCUMENT);
  private readonly _isDark = inject(ThemeStore).isDark;

  private readonly _now = new Date();
  private readonly _period = dateRangeToParams('30d', this._now);

  protected readonly overline = `${todayOverline(this._now)} · 30 derniers jours`;

  protected readonly projectsRes = rxResource({ stream: () => this._projects.getAllProjects() });
  protected readonly postsRes = rxResource({ stream: () => this._blog.getAllPostsForAdmin() });
  protected readonly unreadRes = rxResource({ stream: () => this._contact.getUnreadCount() });
  protected readonly messagesRes = rxResource({ stream: () => this._contact.getAllMessages() });
  protected readonly overviewRes = rxResource({
    stream: () => this._analytics.getOverview(this._period.startDate, this._period.endDate),
  });
  protected readonly chartRes = rxResource({
    stream: () => this._analytics.getChart(this._period.startDate, this._period.endDate),
  });
  protected readonly referrersRes = rxResource({
    stream: () =>
      this._analytics.getMetrics('referrer', this._period.startDate, this._period.endDate),
  });

  private readonly _projectList = computed(() => valueOrNull(this.projectsRes));
  private readonly _postList = computed(() => valueOrNull(this.postsRes));
  protected readonly overview = computed(() => valueOrNull(this.overviewRes));
  protected readonly unread = computed(() => valueOrNull(this.unreadRes));

  protected readonly summary = computed(() =>
    overviewSummary({
      overview: this.overview(),
      referrers: valueOrNull(this.referrersRes),
      unread: this.unread(),
      projects: this._projectList(),
      posts: this._postList(),
    }),
  );

  protected readonly contentLoading = computed(
    () => this.projectsRes.isLoading() || this.postsRes.isLoading(),
  );
  protected readonly contentFailures = computed(() => failed([this.projectsRes, this.postsRes]));
  protected readonly onlineRows = computed(() =>
    toOnlineRows(this._projectList(), this._postList()),
  );
  protected readonly contentRows = computed(() => {
    if (this.contentLoading()) return null;
    const rows = toContentRows(this._projectList(), this._postList(), 5);
    return rows.length === 0 && this.contentFailures().length > 0 ? null : rows;
  });

  protected readonly audienceLoading = computed(
    () => this.overviewRes.isLoading() || this.chartRes.isLoading(),
  );
  protected readonly audienceFailures = computed(() =>
    failed([this.overviewRes, this.chartRes, this.referrersRes]),
  );
  protected readonly readout = computed(() => {
    const overview = this.overview();
    return overview ? toAudienceReadout(overview) : [];
  });

  // Les couleurs viennent des variables CSS du registre courant : relues à chaque bascule de thème.
  private readonly _palette = computed(() => {
    this._isDark();
    return {
      line: readChartPalette(this._document),
      background: readThemeColor(this._document, '--theme-background', 'Canvas'),
    };
  });
  protected readonly chartData = computed(() => {
    const points = valueOrNull(this.chartRes);
    return points === null ? null : buildVisitorsOnlyChartData(points, this._palette().line);
  });
  protected readonly chartCaption = computed(() => {
    const points = valueOrNull(this.chartRes);
    return points === null ? '' : chartSummary(points);
  });
  protected readonly chartOptions = computed(() => {
    const { line, background } = this._palette();
    const options = buildLineChartOptions(line.foreground, background);
    return {
      ...options,
      scales: {
        x: { ...options.scales.x, display: false },
        y: { ...options.scales.y, display: false },
      },
    };
  });

  protected readonly latest = computed(() => {
    const messages = valueOrNull(this.messagesRes);
    return messages === null ? null : latestMessages(messages, 3);
  });
  protected readonly contactsFailures = computed(() => failed([this.unreadRes, this.messagesRes]));

  protected reload(sources: readonly ResourceRef<unknown>[]): void {
    sources.forEach((source) => source.reload());
  }
}
