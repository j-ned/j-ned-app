import {
  Component,
  inject,
  resource,
  computed,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { map, catchError, of } from 'rxjs';
import { BLOG_GATEWAY } from '@features/blog/application';
import { CONTACT_GATEWAY } from '@features/contact/application';
import { BOOKING_GATEWAY } from '@features/booking/application';
import { PROJECTS_GATEWAY } from '@features/projects/application';
import { AuthService } from '@features/auth/infrastructure';
import { AnalyticsService } from '@shared/analytics';
import { SiteSettingsService } from '@core/services';

@Component({
  selector: 'app-admin-dashboard',
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-foreground">
        Bienvenue, {{ authService.currentUser()?.displayName }}
      </h1>
      <p class="text-sm text-muted mt-1">{{ formattedDate() }}</p>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
      <!-- Articles -->
      <div
        class="bg-linear-to-br from-background to-background/50 border border-foreground/10 rounded-2xl p-6 shadow-lg hover:border-primary/30 hover:-translate-y-0.5 transition-all duration-300"
      >
        <div class="flex items-center gap-4">
          <div
            class="w-14 h-14 rounded-xl bg-linear-to-br from-primary/20 to-primary/5 flex items-center justify-center"
          >
            <svg class="w-7 h-7 text-primary" aria-hidden="true">
              <use href="/icons/sprite.svg#lucide-notebook-pen" />
            </svg>
          </div>
          <div>
            @if (articleRes.isLoading()) {
              <div class="h-8 w-12 rounded-lg bg-foreground/10 animate-pulse"></div>
            } @else {
              <p class="text-2xl font-bold text-foreground">{{ articleCount() }}</p>
            }
            <p class="text-sm text-muted">Articles</p>
          </div>
        </div>
      </div>

      <div
        class="bg-linear-to-br from-background to-background/50 border border-foreground/10 rounded-2xl p-6 shadow-lg hover:border-yellow-500/30 hover:-translate-y-0.5 transition-all duration-300"
      >
        <div class="flex items-center gap-4">
          <div
            class="w-14 h-14 rounded-xl bg-linear-to-br from-yellow-500/20 to-yellow-500/5 flex items-center justify-center"
          >
            <svg class="w-7 h-7 text-yellow-500" aria-hidden="true">
              <use href="/icons/sprite.svg#lucide-message-square" />
            </svg>
          </div>
          <div>
            @if (commentRes.isLoading()) {
              <div class="h-8 w-12 rounded-lg bg-foreground/10 animate-pulse"></div>
            } @else {
              <p class="text-2xl font-bold text-foreground">{{ commentCount() }}</p>
            }
            <p class="text-sm text-muted">En attente</p>
          </div>
        </div>
      </div>

      <div
        class="bg-linear-to-br from-background to-background/50 border border-foreground/10 rounded-2xl p-6 shadow-lg hover:border-green-500/30 hover:-translate-y-0.5 transition-all duration-300"
      >
        <div class="flex items-center gap-4">
          <div
            class="w-14 h-14 rounded-xl bg-linear-to-br from-green-500/20 to-green-500/5 flex items-center justify-center"
          >
            <svg class="w-7 h-7 text-green-500" aria-hidden="true">
              <use href="/icons/sprite.svg#lucide-laptop" />
            </svg>
          </div>
          <div>
            @if (projectRes.isLoading()) {
              <div class="h-8 w-12 rounded-lg bg-foreground/10 animate-pulse"></div>
            } @else {
              <p class="text-2xl font-bold text-foreground">{{ projectCount() }}</p>
            }
            <p class="text-sm text-muted">Projets</p>
          </div>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
        class="bg-linear-to-br from-background to-background/50 border border-foreground/10 rounded-2xl p-6 shadow-lg hover:border-orange-500/30 hover:-translate-y-0.5 transition-all duration-300"
      >
        <div class="flex items-center gap-4">
          <div
            class="w-14 h-14 rounded-xl bg-linear-to-br from-orange-500/20 to-orange-500/5 flex items-center justify-center"
          >
            <svg class="w-7 h-7 text-orange-500" aria-hidden="true">
              <use href="/icons/sprite.svg#lucide-mail" />
            </svg>
          </div>
          <div>
            @if (unreadRes.isLoading()) {
              <div class="h-8 w-12 rounded-lg bg-foreground/10 animate-pulse"></div>
            } @else {
              <p class="text-2xl font-bold text-foreground">{{ unreadCount() }}</p>
            }
            <p class="text-sm text-muted">Messages non lus</p>
          </div>
        </div>
      </div>

      <div
        class="bg-linear-to-br from-background to-background/50 border border-foreground/10 rounded-2xl p-6 shadow-lg hover:border-cyan-500/30 hover:-translate-y-0.5 transition-all duration-300"
      >
        <div class="flex items-center gap-4">
          <div
            class="w-14 h-14 rounded-xl bg-linear-to-br from-cyan-500/20 to-cyan-500/5 flex items-center justify-center"
          >
            <svg class="w-7 h-7 text-cyan-500" aria-hidden="true">
              <use href="/icons/sprite.svg#lucide-calendar" />
            </svg>
          </div>
          <div>
            @if (bookingRes.isLoading()) {
              <div class="h-8 w-12 rounded-lg bg-foreground/10 animate-pulse"></div>
            } @else {
              <p class="text-2xl font-bold text-foreground">{{ bookingCount() }}</p>
            }
            <p class="text-sm text-muted">Réservations</p>
          </div>
        </div>
      </div>

      <div
        class="bg-linear-to-br from-background to-background/50 border border-foreground/10 rounded-2xl p-6 shadow-lg hover:border-purple-500/30 hover:-translate-y-0.5 transition-all duration-300"
      >
        <div class="flex items-center gap-4">
          <div
            class="w-14 h-14 rounded-xl bg-linear-to-br from-purple-500/20 to-purple-500/5 flex items-center justify-center"
          >
            <svg class="w-7 h-7 text-purple-500" aria-hidden="true">
              <use href="/icons/sprite.svg#lucide-file-text" />
            </svg>
          </div>
          <div>
            @if (cvDownloadRes.isLoading()) {
              <div class="h-8 w-12 rounded-lg bg-foreground/10 animate-pulse"></div>
            } @else {
              <p class="text-2xl font-bold text-foreground">{{ cvDownloadCount() }}</p>
            }
            <p class="text-sm text-muted">Téléchargements CV</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Feature Toggles -->
    <div class="mt-8">
      <h2 class="text-lg font-bold text-foreground mb-4">Sections du site</h2>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          class="bg-linear-to-br from-background to-background/50 border border-foreground/10 rounded-2xl p-6 shadow-lg"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-4">
              <div
                [class]="
                  'w-14 h-14 rounded-xl flex items-center justify-center transition-colors ' +
                  (siteSettings.blogEnabled()
                    ? 'bg-linear-to-br from-primary/20 to-primary/5'
                    : 'bg-linear-to-br from-yellow-500/20 to-yellow-500/5')
                "
              >
                <svg
                  [class]="
                    'w-7 h-7 ' +
                    (siteSettings.blogEnabled() ? 'text-primary' : 'text-yellow-500')
                  "
                  aria-hidden="true"
                >
                  <use href="/icons/sprite.svg#lucide-notebook-pen" />
                </svg>
              </div>
              <div>
                <p class="text-sm font-semibold text-foreground">Blog</p>
                <p class="text-xs text-muted">
                  {{ siteSettings.blogEnabled() ? 'Visible sur le site' : 'Désactivé' }}
                </p>
              </div>
            </div>
            <button
              (click)="siteSettings.toggleBlog()"
              [class]="
                'relative w-12 h-7 rounded-full transition-colors duration-200 ' +
                (siteSettings.blogEnabled() ? 'bg-primary' : 'bg-foreground/20')
              "
              [attr.aria-label]="
                siteSettings.blogEnabled() ? 'Désactiver le blog' : 'Activer le blog'
              "
            >
              <span
                [class]="
                  'absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform duration-200 ' +
                  (siteSettings.blogEnabled() ? 'translate-x-5' : 'translate-x-0')
                "
              ></span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class AdminDashboard {
  private readonly blogGateway = inject(BLOG_GATEWAY);
  private readonly contactGateway = inject(CONTACT_GATEWAY);
  private readonly bookingGateway = inject(BOOKING_GATEWAY);
  private readonly projectsGateway = inject(PROJECTS_GATEWAY);
  private readonly analytics = inject(AnalyticsService);
  readonly authService = inject(AuthService);
  readonly siteSettings = inject(SiteSettingsService);

  readonly formattedDate = signal(
    new Date().toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }),
  );

  readonly articleRes = rxResource({
    stream: () => this.blogGateway.getArticleCount(),
  });
  readonly articleCount = computed(() => this.articleRes.value() ?? 0);

  readonly commentRes = rxResource({
    stream: () => this.blogGateway.getPendingCommentCount(),
  });
  readonly commentCount = computed(() => this.commentRes.value() ?? 0);

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
    stream: () =>
      this.bookingGateway.getAllBookings().pipe(
        map((b) => b.length),
        catchError(() => of(0)),
      ),
  });
  readonly bookingCount = computed(() => this.bookingRes.value() ?? 0);

  readonly cvDownloadRes = resource({
    loader: () => this.analytics.getCvDownloadCount(),
  });
  readonly cvDownloadCount = computed(() => this.cvDownloadRes.value() ?? 0);
}
