import {
  Component,
  inject,
  resource,
  computed,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { CONTACT_GATEWAY } from '@features/contact/application';
import { AuthService } from '@features/auth/infrastructure';
import { ANALYTICS_GATEWAY } from '@shared/analytics';
import { AppIcon } from '@shared/icons';

function relativeTime(date: Date | string): string {
  const target = typeof date === 'string' ? new Date(date) : date;
  const diffMs = Date.now() - target.getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return "à l'instant";
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'hier';
  if (days < 30) return `${days} j`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} mois`;
  return target.toLocaleDateString('fr-FR');
}

@Component({
  selector: 'app-admin-dashboard',
  imports: [RouterLink, AppIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <header class="mb-10">
      <h1 class="text-3xl font-bold text-foreground">
        Bonjour, {{ authService.currentUser()?.displayName }}
      </h1>
      <p class="text-sm text-muted mt-2">{{ formattedDate() }}</p>
    </header>

    <!-- Stats -->
    <section class="mb-10">
      <ul class="grid grid-cols-1 md:grid-cols-2 gap-4" role="list">
        <li>
          <a
            routerLink="/admin/messages"
            class="group flex items-center gap-4 bg-surface border border-foreground/10 rounded-xl p-5 hover:border-primary/40 hover:bg-primary/[0.02] transition-all"
          >
            <div
              class="w-12 h-12 shrink-0 rounded-lg bg-linear-to-br from-primary/15 to-primary/5 flex items-center justify-center"
            >
              <app-icon name="envelope" [size]="20" class="text-primary" />
            </div>
            <div class="flex-1 min-w-0">
              @if (unreadRes.isLoading()) {
                <div class="h-7 w-10 rounded bg-foreground/10 animate-pulse"></div>
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
            class="group flex items-center gap-4 bg-surface border border-foreground/10 rounded-xl p-5 hover:border-purple-500/40 hover:bg-purple-500/[0.02] transition-all"
          >
            <div
              class="w-12 h-12 shrink-0 rounded-lg bg-linear-to-br from-purple-500/15 to-purple-500/5 flex items-center justify-center"
            >
              <app-icon name="download" [size]="20" class="text-purple-500" />
            </div>
            <div class="flex-1 min-w-0">
              @if (cvDownloadRes.isLoading()) {
                <div class="h-7 w-10 rounded bg-foreground/10 animate-pulse"></div>
              } @else {
                <p class="text-2xl font-bold text-foreground leading-none">
                  {{ cvDownloadCount() }}
                </p>
              }
              <p class="text-xs text-muted mt-1">CV téléchargés</p>
            </div>
            <app-icon name="arrow-right" [size]="20" class="text-muted group-hover:text-purple-500 group-hover:translate-x-0.5 transition-all" />
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
                <span class="text-xs text-muted shrink-0">{{ formatTime(msg.createdAt) }}</span>
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
  private readonly contactGateway = inject(CONTACT_GATEWAY);
  private readonly analytics = inject(ANALYTICS_GATEWAY);
  readonly authService = inject(AuthService);

  readonly formattedDate = signal(
    new Date().toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }),
  );

  readonly unreadRes = rxResource({
    stream: () => this.contactGateway.getUnreadCount(),
  });
  readonly unreadCount = computed(() => this.unreadRes.value() ?? 0);

  readonly messagesRes = rxResource({
    stream: () => this.contactGateway.getAllMessages(),
  });
  readonly latestMessages = computed(() => {
    const messages = this.messagesRes.value() ?? [];
    return [...messages]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 3);
  });

  readonly cvDownloadRes = resource({
    loader: () => firstValueFrom(this.analytics.getCvDownloadCount()),
  });
  readonly cvDownloadCount = computed(() => this.cvDownloadRes.value() ?? 0);

  protected formatTime(date: string | Date): string {
    return relativeTime(date);
  }
}
