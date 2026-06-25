import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { AppIcon } from '@shared/icons/app-icon';
import { AppSkeleton } from '@shared/ui/skeleton';
import type { StatsOverview } from '@features/analytics/domain/models/analytics.types';

@Component({
  selector: 'app-admin-analytics-kpis',
  imports: [AppIcon, AppSkeleton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'contents' },
  template: `
    <section class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8" aria-label="Indicateurs clés">
      <article class="bg-surface border border-foreground/10 rounded-xl p-5">
        <div class="flex items-center gap-2 mb-2">
          <app-icon name="users" [size]="20" class="text-primary" />
          <span class="text-xs text-muted uppercase tracking-wider">Visiteurs</span>
        </div>
        @if (loading()) {
          <app-skeleton class="h-9 w-20 rounded" tone="strong" />
        } @else {
          <p class="text-3xl font-bold text-foreground leading-none">
            {{ overview()?.visitors ?? 0 }}
          </p>
          <p class="text-xs text-muted mt-2">{{ overview()?.sessions ?? 0 }} sessions</p>
        }
      </article>

      <article class="bg-surface border border-foreground/10 rounded-xl p-5">
        <div class="flex items-center gap-2 mb-2">
          <app-icon name="eye" [size]="20" class="text-primary" />
          <span class="text-xs text-muted uppercase tracking-wider">Pages vues</span>
        </div>
        @if (loading()) {
          <app-skeleton class="h-9 w-20 rounded" tone="strong" />
        } @else {
          <p class="text-3xl font-bold text-foreground leading-none">
            {{ overview()?.pageviews ?? 0 }}
          </p>
          <p class="text-xs text-muted mt-2">{{ pagesPerSession() }} pages / session</p>
        }
      </article>

      <article class="bg-surface border border-foreground/10 rounded-xl p-5">
        <div class="flex items-center gap-2 mb-2">
          <app-icon name="arrow-right-arrow-left" [size]="20" class="text-status-warn" />
          <span class="text-xs text-muted uppercase tracking-wider">Taux de rebond</span>
        </div>
        @if (loading()) {
          <app-skeleton class="h-9 w-20 rounded" tone="strong" />
        } @else {
          <p class="text-3xl font-bold text-foreground leading-none">
            {{ bounceRateFormatted() }}%
          </p>
          <p class="text-xs text-muted mt-2">{{ overview()?.bounces ?? 0 }} sessions en rebond</p>
        }
      </article>

      <article class="bg-surface border border-foreground/10 rounded-xl p-5">
        <div class="flex items-center gap-2 mb-2">
          <app-icon name="clock" [size]="20" class="text-status-success" />
          <span class="text-xs text-muted uppercase tracking-wider">Durée moyenne</span>
        </div>
        @if (loading()) {
          <app-skeleton class="h-9 w-20 rounded" tone="strong" />
        } @else {
          <p class="text-3xl font-bold text-foreground leading-none">{{ formattedDuration() }}</p>
          <p class="text-xs text-muted mt-2">par page</p>
        }
      </article>
    </section>
  `,
})
export class AdminAnalyticsKpis {
  readonly loading = input<boolean>(false);
  readonly overview = input<StatsOverview | undefined>(undefined);
  readonly pagesPerSession = input<string>('0');
  readonly bounceRateFormatted = input<string>('0.0');
  readonly formattedDuration = input<string>('0s');
}
