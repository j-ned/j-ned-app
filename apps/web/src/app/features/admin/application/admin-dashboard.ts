import {
  Component,
  inject,
  resource,
  computed,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { firstValueFrom, map, catchError, of } from 'rxjs';
import { BLOG_GATEWAY } from '../../blog/domain';
import { CONTACT_GATEWAY } from '../../contact/domain';
import { BOOKING_GATEWAY } from '../../booking/domain';
import { SupabaseClientService } from '../../../shared/supabase/supabase-client';
import { AuthService } from '../../auth/domain';

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
  `,
})
export class AdminDashboard {
  private readonly blogGateway = inject(BLOG_GATEWAY);
  private readonly contactGateway = inject(CONTACT_GATEWAY);
  private readonly bookingGateway = inject(BOOKING_GATEWAY);
  private readonly supabase = inject(SupabaseClientService);
  readonly authService = inject(AuthService);

  readonly formattedDate = signal(
    new Date().toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }),
  );

  readonly articleRes = resource({
    loader: () => firstValueFrom(this.blogGateway.getArticleCount()),
  });
  readonly articleCount = computed(() => this.articleRes.value() ?? 0);

  readonly commentRes = resource({
    loader: () => firstValueFrom(this.blogGateway.getPendingCommentCount()),
  });
  readonly commentCount = computed(() => this.commentRes.value() ?? 0);

  readonly projectRes = resource({
    loader: async () => {
      const { count, error } = await this.supabase.client
        .from('projects')
        .select('*', { count: 'exact', head: true });
      if (error) throw error;
      return count ?? 0;
    },
  });
  readonly projectCount = computed(() => this.projectRes.value() ?? 0);

  readonly unreadRes = resource({
    loader: () => firstValueFrom(this.contactGateway.getUnreadCount()),
  });
  readonly unreadCount = computed(() => this.unreadRes.value() ?? 0);

  readonly bookingRes = resource({
    loader: () =>
      firstValueFrom(
        this.bookingGateway.getAllBookings().pipe(
          map((b) => b.length),
          catchError(() => of(0)),
        ),
      ),
  });
  readonly bookingCount = computed(() => this.bookingRes.value() ?? 0);

  readonly cvDownloadRes = resource({
    loader: async () => {
      const { data, error } = await this.supabase.client
        .from('cv_info')
        .select('downloads')
        .limit(1)
        .single();
      if (error) return 0;
      return (data?.['downloads'] as number) ?? 0;
    },
  });
  readonly cvDownloadCount = computed(() => this.cvDownloadRes.value() ?? 0);
}
