import { Component, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { map, catchError, of } from 'rxjs';
import { CONTACT_GATEWAY } from '@features/contact/application';
import { BLOG_GATEWAY } from '@features/blog/application';
import { BOOKING_GATEWAY } from '@features/booking/application';

@Component({
  selector: 'app-admin-inbox-index',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <header class="mb-10">
      <h1 class="text-3xl font-bold text-foreground mb-2">Boîte de réception</h1>
      <p class="text-sm text-muted">Messages, réservations et commentaires en attente</p>
    </header>

    <ul class="grid grid-cols-1 md:grid-cols-3 gap-4" role="list">
      <li>
        <a
          routerLink="/admin/inbox/messages"
          class="group flex flex-col gap-3 bg-surface border border-foreground/10 rounded-xl p-6 hover:border-primary/40 hover:bg-primary/[0.02] transition-all"
        >
          <div class="flex items-start justify-between">
            <div
              class="w-11 h-11 shrink-0 rounded-lg bg-linear-to-br from-primary/15 to-primary/5 flex items-center justify-center"
            >
              <i class="pi pi-envelope text-xl text-primary" aria-hidden="true"></i>
            </div>
            @if (unreadCount() > 0) {
              <span class="px-2 py-0.5 rounded-full bg-primary text-white text-xs font-semibold">
                {{ unreadCount() }}
              </span>
            }
          </div>
          <div>
            <h3
              class="text-base font-semibold text-foreground group-hover:text-primary transition-colors"
            >
              Messages
            </h3>
            <p class="text-xs text-muted leading-relaxed mt-1">Formulaire de contact du site</p>
          </div>
        </a>
      </li>

      <li>
        <a
          routerLink="/admin/inbox/bookings"
          class="group flex flex-col gap-3 bg-surface border border-foreground/10 rounded-xl p-6 hover:border-primary/40 hover:bg-primary/[0.02] transition-all"
        >
          <div class="flex items-start justify-between">
            <div
              class="w-11 h-11 shrink-0 rounded-lg bg-linear-to-br from-cyan-500/15 to-cyan-500/5 flex items-center justify-center"
            >
              <i class="pi pi-calendar text-xl text-cyan-500" aria-hidden="true"></i>
            </div>
            @if (bookingCount() > 0) {
              <span class="px-2 py-0.5 rounded-full bg-cyan-500 text-white text-xs font-semibold">
                {{ bookingCount() }}
              </span>
            }
          </div>
          <div>
            <h3
              class="text-base font-semibold text-foreground group-hover:text-primary transition-colors"
            >
              Réservations
            </h3>
            <p class="text-xs text-muted leading-relaxed mt-1">Appels découverte réservés</p>
          </div>
        </a>
      </li>

      <li>
        <a
          routerLink="/admin/inbox/comments"
          class="group flex flex-col gap-3 bg-surface border border-foreground/10 rounded-xl p-6 hover:border-primary/40 hover:bg-primary/[0.02] transition-all"
        >
          <div class="flex items-start justify-between">
            <div
              class="w-11 h-11 shrink-0 rounded-lg bg-linear-to-br from-yellow-500/15 to-yellow-500/5 flex items-center justify-center"
            >
              <i class="pi pi-comment text-xl text-yellow-500" aria-hidden="true"></i>
            </div>
            @if (pendingCommentCount() > 0) {
              <span class="px-2 py-0.5 rounded-full bg-yellow-500 text-white text-xs font-semibold">
                {{ pendingCommentCount() }}
              </span>
            }
          </div>
          <div>
            <h3
              class="text-base font-semibold text-foreground group-hover:text-primary transition-colors"
            >
              Commentaires
            </h3>
            <p class="text-xs text-muted leading-relaxed mt-1">Commentaires blog à modérer</p>
          </div>
        </a>
      </li>
    </ul>
  `,
})
export class AdminInboxIndex {
  private readonly contactGateway = inject(CONTACT_GATEWAY);
  private readonly blogGateway = inject(BLOG_GATEWAY);
  private readonly bookingGateway = inject(BOOKING_GATEWAY);

  private readonly unreadRes = rxResource({
    stream: () => this.contactGateway.getUnreadCount(),
  });
  readonly unreadCount = computed(() => this.unreadRes.value() ?? 0);

  private readonly pendingCommentRes = rxResource({
    stream: () => this.blogGateway.getPendingCommentCount(),
  });
  readonly pendingCommentCount = computed(() => this.pendingCommentRes.value() ?? 0);

  private readonly bookingRes = rxResource({
    stream: () =>
      this.bookingGateway.getAllBookings().pipe(
        map((b) => b.length),
        catchError(() => of(0)),
      ),
  });
  readonly bookingCount = computed(() => this.bookingRes.value() ?? 0);
}
