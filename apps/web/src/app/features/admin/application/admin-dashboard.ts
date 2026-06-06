import {
  Component,
  inject,
  resource,
  computed,
  ChangeDetectionStrategy,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ContactGateway } from '@features/contact/domain';
import { AuthStore } from '@features/auth/infra';
import { AnalyticsGateway } from '@features/analytics/domain';
import { AppIcon } from '@shared/icons';
import { RelativeTimePipe } from '@shared/calendar';
import { AppSkeleton, AppIconTile } from '@shared/ui';

const FORMATTED_DATE = new Date().toLocaleDateString('fr-FR', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

@Component({
  selector: 'app-admin-dashboard',
  imports: [RouterLink, AppIcon, RelativeTimePipe, AppSkeleton, AppIconTile],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <header class="mb-10">
      <h1 class="text-3xl font-bold text-foreground">
        Bonjour, {{ authService.currentUser()?.displayName }}
      </h1>
      <p class="text-sm text-muted mt-2">{{ formattedDate }}</p>
    </header>

    <!-- Stats -->
    <section class="mb-10">
      <ul class="grid grid-cols-1 md:grid-cols-2 gap-4" role="list">
        <li>
          <a
            routerLink="/admin/messages"
            class="group flex items-center gap-4 bg-surface border border-foreground/10 rounded-xl p-5 hover:border-primary/40 hover:bg-primary/[0.02] transition-all"
          >
            <app-icon-tile class="bg-primary/10">
              <app-icon name="envelope" [size]="20" class="text-primary" />
            </app-icon-tile>
            <div class="flex-1 min-w-0">
              @if (unreadRes.isLoading()) {
                <app-skeleton class="h-7 w-10 rounded" tone="strong" />
              } @else {
                <p class="text-2xl font-bold text-foreground leading-none">{{ unreadCount() }}</p>
              }
              <p class="text-xs text-muted mt-1">Messages non lus</p>
            </div>
            <app-icon name="arrow-right" [size]="20" class="text-muted group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
          </a>
        </li>

        <li>
          <a
            routerLink="/admin/analytics"
            class="group flex items-center gap-4 bg-surface border border-foreground/10 rounded-xl p-5 hover:border-accent/40 hover:bg-accent/[0.02] transition-all"
          >
            <app-icon-tile class="bg-accent/10">
              <app-icon name="download" [size]="20" class="text-accent" />
            </app-icon-tile>
            <div class="flex-1 min-w-0">
              @if (cvDownloadRes.isLoading()) {
                <app-skeleton class="h-7 w-10 rounded" tone="strong" />
              } @else {
                <p class="text-2xl font-bold text-foreground leading-none">
                  {{ cvDownloadCount() }}
                </p>
              }
              <p class="text-xs text-muted mt-1">CV téléchargés</p>
            </div>
            <app-icon name="arrow-right" [size]="20" class="text-muted group-hover:text-accent group-hover:translate-x-0.5 transition-all" />
          </a>
        </li>
      </ul>
    </section>

    <!-- Derniers messages -->
    <section class="mb-10">
      <div class="flex items-center justify-between mb-4 pb-2 border-b border-foreground/5">
        <h2 class="text-xs font-semibold uppercase tracking-widest text-muted">
          Derniers messages
        </h2>
        <a
          routerLink="/admin/messages"
          class="text-xs text-primary hover:text-primary/80 transition-colors inline-flex items-center gap-1"
        >
          Tout voir
          <app-icon name="arrow-right" [size]="12" />
        </a>
      </div>

      @if (messagesRes.isLoading()) {
        <ul class="space-y-2" aria-hidden="true">
          @for (_ of [1, 2, 3]; track $index) {
            <li class="h-14 rounded-lg bg-foreground/5 animate-pulse"></li>
          }
        </ul>
      } @else if (latestMessages().length === 0) {
        <p class="text-sm text-muted text-center py-6">Aucun message pour l'instant.</p>
      } @else {
        <ul class="space-y-1" role="list">
          @for (msg of latestMessages(); track msg.id) {
            <li>
              <a
                routerLink="/admin/messages"
                class="group flex items-center gap-3 p-3 rounded-lg hover:bg-foreground/5 transition-colors"
              >
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-foreground truncate">
                    {{ msg.name }} ·
                    <span class="text-muted font-normal">{{ msg.subject }}</span>
                  </p>
                </div>
                <span class="text-xs text-muted shrink-0">{{ msg.createdAt | relativeTime }}</span>
              </a>
            </li>
          }
        </ul>
      }
    </section>

    <!-- Raccourcis -->
    <section>
      <h2
        class="text-xs font-semibold uppercase tracking-widest text-muted mb-4 pb-2 border-b border-foreground/5"
      >
        Raccourcis
      </h2>
      <div class="flex flex-wrap gap-3">
        <a
          routerLink="/admin/projects"
          class="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-foreground/15 text-sm font-medium text-foreground hover:bg-foreground/5 hover:border-foreground/30 transition-colors"
        >
          <app-icon name="plus" [size]="20" />
          Nouveau projet
        </a>
        <a
          routerLink="/admin/cv"
          class="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-foreground/15 text-sm font-medium text-foreground hover:bg-foreground/5 hover:border-foreground/30 transition-colors"
        >
          <app-icon name="upload" [size]="20" />
          Téléverser CV
        </a>
      </div>
    </section>
  `,
})
export class AdminDashboard {
  private readonly _contactGateway = inject(ContactGateway);
  private readonly _analytics = inject(AnalyticsGateway);
  protected readonly authService = inject(AuthStore);

  protected readonly formattedDate = FORMATTED_DATE;

  protected readonly unreadRes = rxResource({
    stream: () => this._contactGateway.getUnreadCount(),
  });
  protected readonly unreadCount = computed(() => this.unreadRes.value() ?? 0);

  protected readonly messagesRes = rxResource({
    stream: () => this._contactGateway.getAllMessages(),
  });
  protected readonly latestMessages = computed(() => {
    const messages = this.messagesRes.value() ?? [];
    return [...messages]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 3);
  });

  protected readonly cvDownloadRes = resource({
    loader: () => firstValueFrom(this._analytics.getCvDownloadCount()),
  });
  protected readonly cvDownloadCount = computed(() => this.cvDownloadRes.value() ?? 0);
}
