import {
  Component,
  afterRenderEffect,
  computed,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { AppIcon } from '@shared/icons/app-icon';
import { Button } from '@shared/ui/button';
import { ConfirmDialog } from '@shared/ui/confirm-dialog';
import { LoadError } from '@shared/ui/load-error';
import type { LoadState } from '@shared/ui/load-state';
import { AppSkeleton } from '@shared/ui/skeleton';
import type { BookingFeedView } from '../booking-feed-view';
import { AdminSectionHead } from './admin-section-head';

@Component({
  selector: 'section[app-admin-booking-feed]',
  imports: [AppIcon, Button, ConfirmDialog, LoadError, AppSkeleton, AdminSectionHead],
  host: {
    'data-testid': 'admin-booking-feed',
    'aria-labelledby': 'admin-booking-feed-heading',
    class: 'block',
  },
  template: `
    <app-admin-section-head heading="Abonnement d'agenda" headingId="admin-booking-feed-heading" />

    @switch (state()) {
      @case ('loading') {
        <div data-testid="admin-booking-feed-loading" role="status" class="mt-5 space-y-3">
          <span class="sr-only">Chargement de l'abonnement…</span>
          <app-skeleton class="block h-11 rounded-lg" />
          <app-skeleton class="block h-5 w-2/3 rounded-sm" />
        </div>
      }
      @case ('error') {
        <app-load-error
          message="L'abonnement d'agenda n'a pas pu être chargé. Vérifiez votre connexion, puis réessayez."
          (retry)="retry.emit()"
        />
      }
      @default {
        @let feed = view();
        @if (feed?.kind === 'unconfigured') {
          <p
            data-testid="admin-booking-feed-unconfigured"
            class="mt-5 max-w-prose rounded-lg border border-status-warn/40 bg-status-warn/10 p-4 text-sm text-foreground"
          >
            Abonnement non configuré&nbsp;: ajoutez la variable
            <code class="font-mono text-[0.85em]">BOOKING_FEED_SECRET</code> (32 caractères au
            moins, par exemple la sortie de
            <code class="font-mono text-[0.85em]">openssl rand -base64 48</code>) à l'environnement
            de l'API dans Dokploy, puis redéployez l'API.
          </p>
        } @else if (feed?.kind === 'none') {
          <p data-testid="admin-booking-feed-none" class="mt-5 text-sm text-muted">
            Aucun lien d'abonnement pour l'instant.
          </p>
        } @else if (feed?.kind === 'active') {
          <div class="mt-5 max-w-2xl">
            <label for="admin-booking-feed-url" class="form-label">Lien d'abonnement</label>
            <input
              id="admin-booking-feed-url"
              data-testid="admin-booking-feed-url"
              type="text"
              readonly
              [value]="feed.url"
              class="form-input font-mono"
            />
            <button
              appButton
              type="button"
              variant="outlined"
              data-testid="admin-booking-feed-copy"
              class="mt-3"
              (click)="copyRequested.emit()"
            >
              <app-icon name="clipboard" [size]="16" />
              Copier le lien
            </button>
            <p data-testid="admin-booking-feed-since" class="mt-2 text-sm text-muted">
              Lien créé le {{ feed.since }}.
            </p>
          </div>
        }
      }
    }

    @if (hasAction()) {
      <div class="mt-5 flex flex-wrap gap-3">
        <button
          appButton
          type="button"
          [variant]="webcalUrl() === null ? 'primary' : 'outlined'"
          data-testid="admin-booking-feed-action"
          [attr.aria-disabled]="regenerating() ? 'true' : null"
          class="aria-disabled:cursor-not-allowed aria-disabled:opacity-55"
          (click)="requestAction()"
        >
          {{ actionLabel() }}
        </button>
        @if (webcalUrl(); as webcalUrl) {
          <a
            appButton
            variant="outlined"
            data-testid="admin-booking-feed-webcal"
            [href]="webcalUrl"
          >
            Ouvrir dans Calendrier
          </a>
        }
      </div>
    }

    @if (webcalUrl() !== null) {
      <ul
        data-testid="admin-booking-feed-help"
        role="list"
        class="mt-6 max-w-prose space-y-3 rounded-lg border border-line bg-surface p-4 text-sm text-muted"
      >
        <li>
          <strong class="font-semibold text-foreground">iPhone</strong>&nbsp;: touchez «&nbsp;Ouvrir
          dans Calendrier&nbsp;» puis «&nbsp;S'abonner&nbsp;», ou, dans Calendrier, Calendriers ›
          Ajouter un calendrier › Ajouter un calendrier avec abonnement, et collez le lien. Le
          rythme de mise à jour suit le réglage de l'iPhone (Calendrier › Comptes › Récupérer).
        </li>
        <li>
          <strong class="font-semibold text-foreground">Google Agenda (ordinateur)</strong>&nbsp;:
          Autres agendas › + › À partir de l'URL, collez le lien. Google met l'agenda à jour toutes
          les quelques heures&nbsp;: une annulation peut y rester visible jusqu'à un jour.
        </li>
        <li>
          Ce lien donne accès aux coordonnées de vos visiteurs&nbsp;: ne le partagez pas. En cas de
          doute, régénérez-le.
        </li>
        <li>
          Une fois abonné, n'ajoutez plus les rendez-vous à la main depuis l'email&nbsp;: ces copies
          ne suivent pas les annulations.
        </li>
      </ul>

      <app-confirm-dialog
        [open]="confirmOpen()"
        heading="Régénérer le lien d'abonnement&#8239;?"
        confirmLabel="Régénérer le lien"
        cancelLabel="Garder le lien actuel"
        (confirmed)="confirmRegeneration()"
        (cancelled)="confirmOpen.set(false)"
      >
        L'ancien lien cessera aussitôt de fonctionner sur tous vos appareils&nbsp;: les agendas qui
        y sont abonnés ne recevront plus vos rendez-vous tant que vous ne les aurez pas abonnés au
        nouveau.
      </app-confirm-dialog>
    }
  `,
})
export class AdminBookingFeed {
  readonly view = input.required<BookingFeedView | null>();
  readonly state = input.required<LoadState>();
  readonly regenerating = input(false);
  readonly copyRequested = output<void>();
  readonly regenerateRequested = output<void>();
  readonly retry = output<void>();

  private readonly _sectionHead = viewChild.required(AdminSectionHead);

  private readonly _actionable = computed(() => {
    const view = this.view();
    return this.state() === 'ready' && view !== null && view.kind !== 'unconfigured' ? view : null;
  });
  protected readonly hasAction = computed(() => this._actionable() !== null);
  protected readonly actionLabel = computed(() => this._actionable()?.actionLabel ?? '');
  protected readonly webcalUrl = computed(() => {
    const view = this._actionable();
    return view?.kind === 'active' ? view.webcalUrl : null;
  });
  protected readonly confirmOpen = signal(false);

  // Le bouton d'action disparaît en « unconfigured » : sans relais, le focus tomberait sur <body>.
  private _hadAction = false;
  private readonly _focusHeadingOnActionLoss = afterRenderEffect({
    write: () => {
      if (this.hasAction()) {
        this._hadAction = true;
      } else if (this._hadAction && this.view()?.kind === 'unconfigured') {
        this._hadAction = false;
        this._sectionHead().focusHeading();
      }
    },
  });

  protected requestAction(): void {
    if (this.regenerating()) return;
    if (this.webcalUrl() === null) this.regenerateRequested.emit();
    else this.confirmOpen.set(true);
  }

  protected confirmRegeneration(): void {
    this.confirmOpen.set(false);
    this.regenerateRequested.emit();
  }
}
