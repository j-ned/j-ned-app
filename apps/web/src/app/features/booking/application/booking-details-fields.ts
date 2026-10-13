import { Component, input } from '@angular/core';
import { FormField, type FieldTree } from '@angular/forms/signals';
import { FieldError } from '@shared/ui/field-error';
import { BOOKING_FORMAT_LABELS } from '../domain/booking-copy.static-data';
import type { BookingDraft, BookingFormat } from '../domain/models/booking.model';

@Component({
  selector: 'app-booking-details-fields',
  imports: [FormField, FieldError],
  host: { class: 'relative grid gap-8' },
  template: `
    @let form = field();
    <fieldset class="grid gap-5 sm:grid-cols-2 sm:gap-6">
      <legend class="sr-only">Vos coordonnées</legend>
      <div>
        @let nameInError = form.name().touched() && form.name().invalid();
        <label for="booking-name-input" class="form-label"
          >Nom complet <span class="font-normal text-muted">(requis)</span></label
        >
        <input
          id="booking-name-input"
          type="text"
          autocomplete="name"
          data-testid="booking-name"
          aria-required="true"
          [formField]="form.name"
          [attr.aria-invalid]="nameInError"
          [attr.aria-describedby]="nameInError ? 'booking-name-error' : null"
          class="form-input"
        />
        <app-field-error
          [field]="form.name"
          errorId="booking-name-error"
          testId="booking-name-error"
        />
      </div>
      <div>
        @let emailInError = form.email().touched() && form.email().invalid();
        <label for="booking-email-input" class="form-label"
          >Email <span class="font-normal text-muted">(requis)</span></label
        >
        <input
          id="booking-email-input"
          type="email"
          autocomplete="email"
          data-testid="booking-email"
          aria-required="true"
          [formField]="form.email"
          [attr.aria-invalid]="emailInError"
          [attr.aria-describedby]="emailInError ? 'booking-email-error' : null"
          class="form-input"
        />
        <app-field-error
          [field]="form.email"
          errorId="booking-email-error"
          testId="booking-email-error"
        />
      </div>
      <div class="sm:col-span-2">
        @let companyInError = form.company().touched() && form.company().invalid();
        <label for="booking-company-input" class="form-label"
          >Entreprise <span class="font-normal text-muted">(facultatif)</span></label
        >
        <input
          id="booking-company-input"
          type="text"
          autocomplete="organization"
          data-testid="booking-company"
          [formField]="form.company"
          [attr.aria-invalid]="companyInError"
          [attr.aria-describedby]="companyInError ? 'booking-company-error' : null"
          class="form-input"
        />
        <app-field-error
          [field]="form.company"
          errorId="booking-company-error"
          testId="booking-company-error"
        />
      </div>
    </fieldset>

    <fieldset class="grid gap-5">
      <legend class="form-label">Format de l’appel</legend>
      <div class="grid grid-cols-2 gap-2.5 sm:max-w-sm">
        @for (format of formats; track format) {
          <label
            class="relative flex min-h-11 cursor-pointer items-center justify-center rounded-md border border-field px-3 py-2 font-semibold transition-colors hover:border-primary has-checked:border-primary-bg has-checked:bg-primary-bg has-checked:text-white has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-primary"
          >
            <input
              type="radio"
              class="sr-only"
              [attr.data-testid]="'booking-format-' + format"
              [value]="format"
              [formField]="form.format"
            />{{ formatLabels[format] }}
          </label>
        }
      </div>
      <div>
        @let byPhone = form.format().value() === 'phone';
        @let phoneInError = form.phone().touched() && form.phone().invalid();
        <label for="booking-phone-input" class="form-label"
          >Numéro de téléphone
          <span class="font-normal text-muted">{{
            byPhone ? '(requis)' : '(seulement pour un appel téléphonique)'
          }}</span></label
        >
        <input
          id="booking-phone-input"
          type="tel"
          autocomplete="tel"
          data-testid="booking-phone"
          [formField]="form.phone"
          [attr.aria-required]="byPhone ? 'true' : null"
          [attr.aria-invalid]="phoneInError"
          [attr.aria-describedby]="phoneInError ? 'booking-phone-error' : null"
          class="form-input sm:max-w-sm"
        />
        <app-field-error
          [field]="form.phone"
          errorId="booking-phone-error"
          testId="booking-phone-error"
        />
      </div>
    </fieldset>

    <div>
      @let messageInError = form.message().touched() && form.message().invalid();
      <label for="booking-message-input" class="form-label"
        >Votre besoin <span class="font-normal text-muted">(requis)</span></label
      >
      <textarea
        id="booking-message-input"
        rows="5"
        data-testid="booking-message"
        aria-required="true"
        placeholder="Le projet, le délai, ce que vous attendez de l’appel..."
        [formField]="form.message"
        [attr.aria-invalid]="messageInError"
        [attr.aria-describedby]="messageInError ? 'booking-message-error' : null"
        class="form-textarea"
      ></textarea>
      <app-field-error
        [field]="form.message"
        errorId="booking-message-error"
        testId="booking-message-error"
      />
    </div>

    <!-- Piège à robots hors écran : un robot remplit un champ positionné, il saute souvent un sr-only. -->
    <div aria-hidden="true" class="absolute top-0 -left-[100vw] size-px overflow-hidden">
      <label for="booking-website-input">Site web</label>
      <input
        id="booking-website-input"
        type="text"
        tabindex="-1"
        autocomplete="off"
        data-testid="booking-website"
        [formField]="form.website"
      />
    </div>
  `,
})
export class BookingDetailsFields {
  readonly field = input.required<FieldTree<BookingDraft>>();

  protected readonly formats: readonly BookingFormat[] = ['video', 'phone'];
  protected readonly formatLabels = BOOKING_FORMAT_LABELS;
}
