import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { ContactMessage } from '@features/contact/domain/models/contact-message.model';
import { AppIcon } from '@shared/icons/app-icon';
import { AppSkeleton } from '@shared/ui/skeleton';
import { pluralize } from '../pluralize';
import { AdminEmptyState } from './admin-empty-state';
import { AdminSectionHead } from './admin-section-head';

const unitFor = (count: number | null, singular: string, plural: string): string =>
  count === null ? plural : pluralize(count, singular, plural);

@Component({
  selector: 'app-overview-contacts',
  imports: [AdminSectionHead, RouterLink, AppIcon, AppSkeleton, AdminEmptyState],
  host: { class: 'block' },
  template: `
    <section aria-labelledby="overview-contacts-heading">
      <app-admin-section-head heading="Contacts" headingId="overview-contacts-heading">
        <a
          routerLink="/admin/messages"
          class="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
        >
          Messages
          <app-icon name="arrow-right" [size]="14" />
        </a>
      </app-admin-section-head>

      <div class="grid grid-cols-2 border-b border-line">
        <a
          data-testid="overview-unread"
          routerLink="/admin/messages"
          class="group block py-4 pr-4.5"
        >
          <span class="block font-mono text-xs tracking-[0.06em] text-muted uppercase">
            Non lus
          </span>
          <span
            data-testid="overview-unread-count"
            class="mt-2 block font-display text-[2.125rem] leading-none font-bold tracking-[-0.02em] tabular-nums group-hover:text-primary"
          >
            @if (unreadLoading()) {
              <app-skeleton
                data-testid="overview-unread-loading"
                class="inline-block h-[2.125rem] w-12 rounded-sm align-top"
              /><span class="sr-only">chargement</span>
            } @else if (unread() === null) {
              <span aria-hidden="true">—</span><span class="sr-only">indisponible</span>
            } @else {
              {{ unread() }}
            }
          </span>
          <span
            data-testid="overview-unread-unit"
            class="mt-1.5 block text-[0.8125rem] text-muted"
            >{{ unreadUnit() }}</span
          >
        </a>
        <a
          data-testid="overview-cv"
          routerLink="/admin/cv"
          class="group block border-l border-line py-4 pl-4.5"
        >
          <span class="block font-mono text-xs tracking-[0.06em] text-muted uppercase">
            CV · 30 j
          </span>
          <span
            data-testid="overview-cv-count"
            class="mt-2 block font-display text-[2.125rem] leading-none font-bold tracking-[-0.02em] tabular-nums group-hover:text-primary"
          >
            @if (cvLoading()) {
              <app-skeleton
                data-testid="overview-cv-loading"
                class="inline-block h-[2.125rem] w-12 rounded-sm align-top"
              /><span class="sr-only">chargement</span>
            } @else if (cvDownloads() === null) {
              <span aria-hidden="true">—</span><span class="sr-only">indisponible</span>
            } @else {
              {{ cvDownloads() }}
            }
          </span>
          <span data-testid="overview-cv-unit" class="mt-1.5 block text-[0.8125rem] text-muted">{{
            cvUnit()
          }}</span>
        </a>
      </div>

      @if (latest(); as messages) {
        @if (messages.length === 0) {
          <app-admin-empty-state stamp="Boîte vide" class="mt-5">
            <p>
              Aucun message pour l'instant. Le formulaire de contact de l'accueil est en
              ligne&#8239;; un nouveau message apparaîtra ici avec son sujet.
            </p>
            <a
              data-testid="overview-contact-page"
              href="/"
              target="_blank"
              rel="noopener"
              class="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
            >
              Voir le site<span class="sr-only"> (nouvel onglet)</span>
              <app-icon name="external-link" [size]="14" />
            </a>
          </app-admin-empty-state>
        } @else {
          <ul role="list">
            @for (message of messages; track message.id) {
              <li data-testid="overview-message" class="relative border-b border-line py-3">
                <a
                  data-testid="overview-message-link"
                  routerLink="/admin/messages"
                  class="font-semibold after:absolute after:inset-0 hover:text-primary"
                >
                  {{ message.name }}
                </a>
                <p class="truncate text-sm text-muted">{{ message.subject }}</p>
              </li>
            }
          </ul>
        }
      }
      <ng-content />
    </section>
  `,
})
export class OverviewContacts {
  readonly unread = input.required<number | null>();
  readonly cvDownloads = input.required<number | null>();
  readonly latest = input.required<readonly ContactMessage[] | null>();
  readonly unreadLoading = input(false);
  readonly cvLoading = input(false);

  protected readonly unreadUnit = computed(() => unitFor(this.unread(), 'message', 'messages'));
  protected readonly cvUnit = computed(() =>
    unitFor(this.cvDownloads(), 'téléchargement', 'téléchargements'),
  );
}
