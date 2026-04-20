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
import { map, catchError, of } from 'rxjs';
import { CONTACT_GATEWAY } from '@features/contact/application';
import { BOOKING_GATEWAY } from '@features/booking/application';
import { PROJECTS_GATEWAY } from '@features/projects/application';
import { AuthService } from '@features/auth/infrastructure';
import { AnalyticsService } from '@shared/analytics';

@Component({
  selector: 'app-admin-dashboard',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <header class="mb-10">
      <h1 class="text-3xl font-bold text-foreground">
        Bonjour, {{ authService.currentUser()?.displayName }}
      </h1>
      <p class="text-sm text-muted mt-2">{{ formattedDate() }}</p>
    </header>

    <!-- Actions requises -->
    <section class="mb-10">
      <h2
        class="text-xs font-semibold uppercase tracking-widest text-muted mb-4 pb-2 border-b border-foreground/5"
      >
        Actions requises
      </h2>
      <ul class="grid grid-cols-1 md:grid-cols-3 gap-4" role="list">
        <li>
          <a
            routerLink="/admin/inbox/messages"
            class="group flex items-center gap-4 bg-surface border border-foreground/10 rounded-xl p-5 hover:border-primary/40 hover:bg-primary/[0.02] transition-all"
          >
            <div
              class="w-12 h-12 shrink-0 rounded-lg bg-linear-to-br from-primary/15 to-primary/5 flex items-center justify-center"
            >
              <i class="pi pi-envelope text-xl text-primary" aria-hidden="true"></i>
            </div>
            <div class="flex-1 min-w-0">
              @if (unreadRes.isLoading()) {
                <div class="h-7 w-10 rounded bg-foreground/10 animate-pulse"></div>
              } @else {
                <p class="text-2xl font-bold text-foreground leading-none">{{ unreadCount() }}</p>
              }
              <p class="text-xs text-muted mt-1">Messages non lus</p>
            </div>
            <i
              class="pi pi-arrow-right text-muted group-hover:text-primary group-hover:translate-x-0.5 transition-all"
              aria-hidden="true"
            ></i>
          </a>
        </li>

        <li>
          <a
            routerLink="/admin/schedule/calendar"
            class="group flex items-center gap-4 bg-surface border border-foreground/10 rounded-xl p-5 hover:border-cyan-500/40 hover:bg-cyan-500/[0.02] transition-all"
          >
            <div
              class="w-12 h-12 shrink-0 rounded-lg bg-linear-to-br from-cyan-500/15 to-cyan-500/5 flex items-center justify-center"
            >
              <i class="pi pi-calendar text-xl text-cyan-500" aria-hidden="true"></i>
            </div>
            <div class="flex-1 min-w-0">
              @if (bookingRes.isLoading()) {
                <div class="h-7 w-10 rounded bg-foreground/10 animate-pulse"></div>
              } @else {
                <p class="text-2xl font-bold text-foreground leading-none">
                  {{ upcomingBookingCount() }}
                </p>
              }
              <p class="text-xs text-muted mt-1">Réservations à venir (7 j)</p>
            </div>
            <i
              class="pi pi-arrow-right text-muted group-hover:text-cyan-500 group-hover:translate-x-0.5 transition-all"
              aria-hidden="true"
            ></i>
          </a>
        </li>
      </ul>
    </section>

    <!-- Aperçu contenu -->
    <section>
      <h2
        class="text-xs font-semibold uppercase tracking-widest text-muted mb-4 pb-2 border-b border-foreground/5"
      >
        Aperçu
      </h2>
      <ul class="grid grid-cols-1 md:grid-cols-3 gap-4" role="list">
        <li class="flex flex-col gap-2 bg-surface border border-foreground/10 rounded-xl p-5">
          <div class="flex items-center gap-3">
            <i class="pi pi-desktop text-green-500" aria-hidden="true"></i>
            <span class="text-xs text-muted">Projets</span>
          </div>
          @if (projectRes.isLoading()) {
            <div class="h-8 w-12 rounded bg-foreground/10 animate-pulse"></div>
          } @else {
            <p class="text-3xl font-bold text-foreground leading-none">{{ projectCount() }}</p>
          }
        </li>

        <li class="flex flex-col gap-2 bg-surface border border-foreground/10 rounded-xl p-5">
          <div class="flex items-center gap-3">
            <i class="pi pi-download text-purple-500" aria-hidden="true"></i>
            <span class="text-xs text-muted">CV téléchargés</span>
          </div>
          @if (cvDownloadRes.isLoading()) {
            <div class="h-8 w-12 rounded bg-foreground/10 animate-pulse"></div>
          } @else {
            <p class="text-3xl font-bold text-foreground leading-none">{{ cvDownloadCount() }}</p>
          }
        </li>

        <li class="flex flex-col gap-2 bg-surface border border-foreground/10 rounded-xl p-5">
          <div class="flex items-center gap-3">
            <i class="pi pi-calendar text-cyan-500" aria-hidden="true"></i>
            <span class="text-xs text-muted">Total réservations</span>
          </div>
          @if (bookingRes.isLoading()) {
            <div class="h-8 w-12 rounded bg-foreground/10 animate-pulse"></div>
          } @else {
            <p class="text-3xl font-bold text-foreground leading-none">{{ bookingCount() }}</p>
          }
        </li>
      </ul>
    </section>
  `,
})
export class AdminDashboard {
  private readonly contactGateway = inject(CONTACT_GATEWAY);
  private readonly bookingGateway = inject(BOOKING_GATEWAY);
  private readonly projectsGateway = inject(PROJECTS_GATEWAY);
  private readonly analytics = inject(AnalyticsService);
  readonly authService = inject(AuthService);

  readonly formattedDate = signal(
    new Date().toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }),
  );

  readonly projectRes = rxResource({
    stream: () =>
      this.projectsGateway.filterProjects({}).pipe(
        map((p) => p.length),
        catchError(() => of(0)),
      ),
  });
  readonly projectCount = computed(() => this.projectRes.value() ?? 0);

  readonly unreadRes = rxResource({
    stream: () => this.contactGateway.getUnreadCount(),
  });
  readonly unreadCount = computed(() => this.unreadRes.value() ?? 0);

  readonly bookingRes = rxResource({
    stream: () => this.bookingGateway.getAllBookings().pipe(catchError(() => of([]))),
  });
  readonly bookingCount = computed(() => this.bookingRes.value()?.length ?? 0);

  readonly upcomingBookingCount = computed(() => {
    const bookings = this.bookingRes.value() ?? [];
    const now = new Date();
    const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    return bookings.filter((b) => {
      const bookingDate = new Date(b.date);
      return bookingDate >= now && bookingDate <= in7Days;
    }).length;
  });

  readonly cvDownloadRes = resource({
    loader: () => this.analytics.getCvDownloadCount(),
  });
  readonly cvDownloadCount = computed(() => this.cvDownloadRes.value() ?? 0);
}
