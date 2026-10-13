import {
  Component,
  ElementRef,
  afterRenderEffect,
  computed,
  inject,
  linkedSignal,
  viewChild,
} from '@angular/core';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Button } from '@shared/ui/button';
import { LoadError } from '@shared/ui/load-error';
import { AppSkeleton } from '@shared/ui/skeleton';
import { firstValueFrom } from 'rxjs';
import {
  BOOKING_CANCEL_FAILURE_MESSAGES,
  BOOKING_CANCEL_NOTICES,
  BOOKING_FORMAT_LABELS,
  type BookingCancelNotice,
} from '../../domain/booking-copy.static-data';
import { BookingGateway } from '../../domain/gateways/booking.gateway';
import type { BookingCancelFailure, BookingCancelPreview } from '../../domain/models/booking.model';
import { formatParisDateTime } from '../../domain/paris-format';

// Format du jeton émis par l'API (32 octets en base64url, sans remplissage).
const CANCEL_TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

type Cancellation =
  | { readonly kind: 'idle' }
  | { readonly kind: 'sending' }
  | { readonly kind: 'cancelled' }
  | { readonly kind: 'failed'; readonly reason: BookingCancelFailure };

type CancellationView =
  | { readonly kind: 'invalid' | 'loading' | 'error' | 'not-found' | 'cancelled' }
  | {
      readonly kind: 'preview';
      readonly when: string;
      readonly format: string;
      readonly unavailable: BookingCancelNotice | null;
    };

const unavailableNotice = (preview: BookingCancelPreview): BookingCancelNotice | null => {
  if (preview.status === 'cancelled') return 'already-cancelled';
  return preview.cancellable ? null : 'not-cancellable';
};

const isRetryable = (reason: BookingCancelFailure): boolean =>
  reason === 'network' || reason === 'server';

@Component({
  selector: 'app-booking-cancellation',
  imports: [AppSkeleton, Button, LoadError, RouterLink],
  host: { class: 'block pt-20' },
  template: `
    <div class="page-container pt-12 pb-22 md:pt-20 md:pb-30">
      <h1
        class="max-w-[20ch] text-[clamp(2.25rem,5vw,3.75rem)] leading-[1.04] font-extrabold tracking-[-0.035em] text-balance"
      >
        Annuler un rendez-vous
      </h1>
      <p class="mt-6 max-w-[60ch] text-lg leading-[1.65] text-muted">
        Vérifiez le rendez-vous puis confirmez&nbsp;: le créneau est libéré et un email d’annulation
        vous est envoyé.
      </p>

      <div class="mt-14 max-w-2xl rounded-xl border border-foreground/8 bg-surface p-7 md:p-9">
        @let current = view();
        @switch (current.kind) {
          @case ('invalid') {
            <p data-testid="booking-cancel-invalid" class="font-semibold">
              {{ notices['invalid-link'] }}
            </p>
          }
          @case ('loading') {
            <div data-testid="booking-cancel-loading" role="status" class="grid gap-3">
              <span class="sr-only">Chargement du rendez-vous</span>
              <app-skeleton class="block h-5 w-40 rounded-md" tone="strong" />
              <app-skeleton class="block h-5 w-72 max-w-full rounded-md" />
              <app-skeleton class="block h-5 w-32 rounded-md" />
            </div>
          }
          @case ('error') {
            <app-load-error
              message="Le rendez-vous n’a pas pu être chargé."
              (retry)="reloadPreview()"
            />
          }
          @case ('not-found') {
            <p data-testid="booking-cancel-not-found" class="font-semibold">
              {{ failureMessages['not-found'] }}
            </p>
          }
          @case ('cancelled') {
            <div data-testid="booking-cancel-result">
              <p class="font-mono text-[0.8125rem] text-primary">Annulation enregistrée</p>
              <h2
                #resultHeading
                tabindex="-1"
                data-testid="booking-cancel-result-heading"
                class="mt-3 section-title"
              >
                Rendez-vous annulé
              </h2>
              <p class="mt-6 max-w-[60ch] text-muted">
                Le créneau est libéré. L’email d’annulation retire l’invitation de votre agenda.
              </p>
              <a
                appButton
                variant="outlined"
                routerLink="/rendez-vous"
                class="mt-6"
                data-testid="booking-cancel-book-again"
              >
                Réserver un autre créneau
              </a>
            </div>
          }
          @case ('preview') {
            <div data-testid="booking-cancel-preview">
              <p class="font-mono text-[0.8125rem] text-primary">Appel de cadrage · 30 min</p>
              <dl class="mt-4 grid gap-x-6 gap-y-2 sm:grid-cols-[auto_1fr]">
                <dt class="text-muted">Date</dt>
                <dd data-testid="booking-cancel-when" class="font-semibold first-letter:uppercase">
                  {{ current.when }}
                </dd>
                <dt class="text-muted">Format</dt>
                <dd data-testid="booking-cancel-format" class="font-semibold">
                  {{ current.format }}
                </dd>
              </dl>
              @if (current.unavailable; as notice) {
                <p
                  data-testid="booking-cancel-unavailable"
                  class="mt-6 rounded-md bg-primary/8 px-5 py-4"
                >
                  {{ notices[notice] }}
                </p>
              }
              <div
                data-testid="booking-cancel-status"
                role="status"
                class="mt-6 text-sm font-medium text-status-error empty:hidden"
              >
                @if (failureMessage(); as message) {
                  {{ message }}
                }
              </div>
              <div class="mt-8 flex flex-wrap items-center gap-x-6 gap-y-4">
                @if (canConfirm()) {
                  <button
                    appButton
                    type="button"
                    data-testid="booking-cancel-confirm"
                    [disabled]="cancellation().kind === 'sending'"
                    (click)="confirmCancellation()"
                  >
                    Annuler ce rendez-vous
                  </button>
                }
                <a
                  routerLink="/"
                  data-testid="booking-cancel-home"
                  class="underline underline-offset-3 hover:text-primary"
                >
                  Revenir à l’accueil
                </a>
              </div>
            </div>
          }
        }
      </div>
    </div>
  `,
})
export class BookingCancellation {
  private readonly _gateway = inject(BookingGateway);

  private readonly _resultHeading = viewChild<ElementRef<HTMLElement>>('resultHeading');

  protected readonly notices = BOOKING_CANCEL_NOTICES;
  protected readonly failureMessages = BOOKING_CANCEL_FAILURE_MESSAGES;

  private readonly _fragment = toSignal(inject(ActivatedRoute).fragment, { requireSync: true });
  private readonly _token = computed(() => {
    const fragment = this._fragment();
    return fragment !== null && CANCEL_TOKEN_PATTERN.test(fragment) ? fragment : undefined;
  });

  private readonly _preview = rxResource({
    params: () => this._token(),
    stream: ({ params: token }) => this._gateway.previewCancellation(token),
  });

  protected readonly cancellation = linkedSignal<string | undefined, Cancellation>({
    source: this._token,
    computation: () => ({ kind: 'idle' }),
  });

  protected readonly view = computed((): CancellationView => {
    if (this._token() === undefined) return { kind: 'invalid' };
    if (this.cancellation().kind === 'cancelled') return { kind: 'cancelled' };
    if (!this._preview.hasValue()) {
      return { kind: this._preview.status() === 'error' ? 'error' : 'loading' };
    }
    const result = this._preview.value();
    if (!result.success) return { kind: result.reason === 'not-found' ? 'not-found' : 'error' };
    return {
      kind: 'preview',
      when: formatParisDateTime(result.data.startsAt),
      format: BOOKING_FORMAT_LABELS[result.data.format],
      unavailable: unavailableNotice(result.data),
    };
  });

  protected readonly failureMessage = computed(() => {
    const cancellation = this.cancellation();
    return cancellation.kind === 'failed'
      ? BOOKING_CANCEL_FAILURE_MESSAGES[cancellation.reason]
      : '';
  });

  protected readonly canConfirm = computed(() => {
    const view = this.view();
    const cancellation = this.cancellation();
    return (
      view.kind === 'preview' &&
      view.unavailable === null &&
      (cancellation.kind !== 'failed' || isRetryable(cancellation.reason))
    );
  });

  private readonly _focusResultEffect = afterRenderEffect({
    write: () => this._resultHeading()?.nativeElement.focus(),
  });

  protected reloadPreview(): void {
    this._preview.reload();
  }

  protected async confirmCancellation(): Promise<void> {
    const token = this._token();
    if (token === undefined || this.cancellation().kind === 'sending') return;

    this.cancellation.set({ kind: 'sending' });
    const result = await firstValueFrom(this._gateway.cancelBooking(token));
    this.cancellation.set(
      result.success ? { kind: 'cancelled' } : { kind: 'failed', reason: result.reason },
    );
  }
}
