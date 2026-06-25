import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { AppIconTile } from '@shared/ui/icon-tile';
import { AppIcon } from '@shared/icons/app-icon';
import { AppSkeleton } from '@shared/ui/skeleton';

@Component({
  selector: 'app-admin-analytics-cv-panel',
  imports: [AppIconTile, AppIcon, AppSkeleton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'bg-surface border border-foreground/10 rounded-xl p-6 flex flex-col justify-center items-center text-center',
  },
  template: `
    <app-icon-tile size="lg" class="bg-accent/10 mb-4">
      <app-icon name="download" [size]="24" class="text-accent" />
    </app-icon-tile>
    <h2 class="text-base font-semibold text-foreground mb-1">CV téléchargés</h2>
    @if (loading()) {
      <app-skeleton class="h-10 w-24 rounded" />
    } @else {
      <p class="text-4xl font-bold text-foreground">{{ cvDownloads() }}</p>
    }
    <p class="text-xs text-muted mt-2">sur la période</p>
  `,
})
export class AdminAnalyticsCvPanel {
  readonly loading = input<boolean>(false);
  readonly cvDownloads = input<number>(0);
}
