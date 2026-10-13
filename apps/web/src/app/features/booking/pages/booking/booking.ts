import { Component, ElementRef, afterRenderEffect, inject, viewChild } from '@angular/core';
import { FormRoot } from '@angular/forms/signals';
import { RouterLink } from '@angular/router';
import { SectionScroller } from '@core/navigation/section-scroller';
import { Button } from '@shared/ui/button';
import { Cartouche } from '@shared/ui/cartouche';
import { DimensionLine } from '@shared/ui/dimension-line';
import { LoadError } from '@shared/ui/load-error';
import { FieldError } from '@shared/ui/field-error';
import { AppSkeleton } from '@shared/ui/skeleton';
import { BookingConfirmationPanel } from '../../application/booking-confirmation-panel';
import { BookingDayPicker } from '../../application/booking-day-picker';
import { BookingDetailsFields } from '../../application/booking-details-fields';
import { BookingSummary } from '../../application/booking-summary';
import { BookingTimePicker } from '../../application/booking-time-picker';
import {
  BOOKING_FAILURE_MESSAGES,
  BOOKING_FICHE,
  BOOKING_PAGE_COPY,
} from '../../domain/booking-copy.static-data';
import { isSlotLost } from '../../domain/is-slot-lost';
import { BookingFlow } from './booking-flow';

@Component({
  selector: 'app-booking',
  imports: [
    AppSkeleton,
    BookingConfirmationPanel,
    BookingDayPicker,
    BookingDetailsFields,
    BookingSummary,
    BookingTimePicker,
    Button,
    Cartouche,
    DimensionLine,
    FieldError,
    FormRoot,
    LoadError,
    RouterLink,
  ],
  providers: [BookingFlow],
  host: { class: 'block pt-20' },
  template: `
    <div class="page-container pt-12 pb-22 md:pt-20 md:pb-30">
      <h1
        class="max-w-[20ch] text-[clamp(2.25rem,5vw,3.75rem)] leading-[1.04] font-extrabold tracking-[-0.035em] text-balance"
      >
        {{ copy.heading }}
      </h1>
      <p class="mt-6 max-w-[60ch] text-lg leading-[1.65] text-muted">{{ copy.lead }}</p>

      <div
        class="mt-14 grid items-start gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.45fr)] lg:gap-16"
      >
        <div class="lg:sticky lg:top-28">
          <app-cartouche
            data-testid="booking-fiche"
            [title]="fiche.title"
            [reference]="copy.ficheReference"
            [rows]="fiche.rows"
          />
          <app-dimension-line class="mt-3.5" [label]="copy.ficheDimension" />
        </div>

        @let outcome = flow.outcome();
        @if (outcome?.kind === 'confirmed' && outcome; as confirmed) {
          <app-booking-confirmation-panel
            [confirmation]="confirmed.confirmation"
            [email]="confirmed.email"
          />
        } @else {
          <div class="grid gap-16">
            <section aria-labelledby="booking-slots-heading">
              <h2 id="booking-slots-heading" class="section-title">{{ copy.slotsHeading }}</h2>
              <p class="mt-3 text-muted">{{ copy.slotsLead }}</p>
              <div class="mt-8 grid gap-10">
                @switch (flow.state()) {
                  @case ('loading') {
                    <div data-testid="booking-slots-loading" role="status" class="grid gap-4">
                      <span class="sr-only">Chargement des créneaux</span>
                      <app-skeleton class="block h-11 w-56 rounded-md" tone="strong" />
                      <div class="grid grid-cols-[repeat(auto-fill,minmax(5.5rem,1fr))] gap-2.5">
                        @for (placeholder of placeholders; track placeholder) {
                          <app-skeleton class="block h-16 rounded-md" />
                        }
                      </div>
                    </div>
                  }
                  @case ('error') {
                    <app-load-error [message]="copy.loadError" (retry)="flow.reloadSlots()" />
                  }
                  @case ('empty') {
                    <div
                      data-testid="booking-empty"
                      class="rounded-md bg-primary/8 px-6 py-6 sm:px-8"
                    >
                      <p class="font-semibold">{{ copy.emptyTitle }}</p>
                      <p class="mt-2 text-muted">{{ copy.emptyDetail }}</p>
                      <button
                        appButton
                        variant="outlined"
                        type="button"
                        class="mt-5"
                        data-testid="booking-empty-contact"
                        (click)="scrollToContact()"
                      >
                        {{ copy.emptyAction }}
                      </button>
                    </div>
                  }
                  @case ('ready') {
                    @if (flow.currentWeek(); as week) {
                      <app-booking-day-picker
                        [week]="week"
                        [selectedDate]="flow.selectedDate()"
                        [hasPrevious]="flow.hasPreviousWeek()"
                        [hasNext]="flow.hasNextWeek()"
                        (daySelected)="flow.selectDay($event)"
                        (previousWeek)="flow.showPreviousWeek()"
                        (nextWeek)="flow.showNextWeek()"
                      />
                    }
                    <div>
                      <h3
                        #timeHeading
                        tabindex="-1"
                        data-testid="booking-time-heading"
                        class="font-display text-lg font-bold font-stretch-110%"
                      >
                        {{ copy.timeHeading }}
                      </h3>
                      @if (flow.selectedDay(); as day) {
                        <app-booking-time-picker
                          class="mt-2"
                          [day]="day"
                          [field]="flow.form.startsAt"
                        />
                      } @else {
                        <p class="mt-2 text-muted">{{ copy.timeHint }}</p>
                      }
                      <app-field-error
                        [field]="flow.form.startsAt"
                        errorId="booking-start-error"
                        testId="booking-start-error"
                      />
                    </div>
                  }
                }
              </div>
            </section>

            @if (flow.state() === 'ready') {
              <section aria-labelledby="booking-details-heading">
                <h2 id="booking-details-heading" class="section-title">
                  {{ copy.detailsHeading }}
                </h2>
                <p class="mt-3 text-muted">{{ copy.detailsLead }}</p>
                <form data-testid="booking-form" class="mt-8 grid gap-8" [formRoot]="flow.form">
                  <app-booking-details-fields [field]="flow.form" />
                  @let startsAt = flow.form.startsAt().value();
                  @if (startsAt !== '') {
                    <app-booking-summary
                      [startsAt]="startsAt"
                      [format]="flow.form.format().value()"
                    />
                  }
                  <div
                    data-testid="booking-status"
                    role="status"
                    class="text-sm font-medium text-status-error empty:hidden"
                  >
                    @if (outcome?.kind === 'failed' && outcome; as failed) {
                      {{ failureMessages[failed.reason] }}
                    }
                  </div>
                  <div class="flex flex-wrap items-center justify-between gap-x-6 gap-y-4">
                    <p
                      data-testid="booking-privacy-notice"
                      class="max-w-[46ch] text-[0.8125rem] text-muted"
                    >
                      {{ copy.privacyNotice }}
                      <a
                        routerLink="/confidentialite"
                        class="underline underline-offset-3 hover:text-primary"
                        >{{ copy.privacyLink }}</a
                      >
                    </p>
                    <button
                      appButton
                      type="submit"
                      data-testid="booking-submit"
                      [disabled]="flow.form().submitting()"
                    >
                      {{ flow.form().submitting() ? copy.submitting : copy.submit }}
                    </button>
                  </div>
                </form>
              </section>
            }
          </div>
        }
      </div>
    </div>
  `,
})
export class Booking {
  private readonly _scroller = inject(SectionScroller);
  protected readonly flow = inject(BookingFlow);

  private readonly _timeHeading = viewChild<ElementRef<HTMLElement>>('timeHeading');

  protected readonly copy = BOOKING_PAGE_COPY;
  protected readonly fiche = BOOKING_FICHE;
  protected readonly failureMessages = BOOKING_FAILURE_MESSAGES;
  protected readonly placeholders = [1, 2, 3, 4, 5];

  // Créneau perdu : l'heure est vidée et les créneaux rechargés, le visiteur reprend à l'étape horaire.
  private readonly _focusTimeStepEffect = afterRenderEffect({
    write: () => {
      const outcome = this.flow.outcome();
      if (outcome?.kind === 'failed' && isSlotLost(outcome.reason)) {
        this._timeHeading()?.nativeElement.focus();
      }
    },
  });

  protected scrollToContact(): void {
    this._scroller.scrollTo('contact');
  }
}
