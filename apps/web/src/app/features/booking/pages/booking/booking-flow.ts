import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, computed, inject, linkedSignal, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import {
  applyWhen,
  form,
  maxLength,
  minLength,
  pattern,
  required,
  submit,
  type FieldTree,
} from '@angular/forms/signals';
import { AnalyticsGateway } from '@features/analytics/domain/gateways/analytics.gateway';
import { focusFirstInvalid } from '@shared/forms/focus-first-invalid';
import { loadState } from '@shared/ui/load-state';
import { firstValueFrom } from 'rxjs';
import { BookingGateway } from '../../domain/gateways/booking.gateway';
import { groupDaysByWeek } from '../../domain/group-days-by-week';
import { groupSlotsByDay } from '../../domain/group-slots-by-day';
import { isSlotLost } from '../../domain/is-slot-lost';
import type {
  BookingConfirmation,
  BookingDay,
  BookingDraft,
  BookingFailureReason,
  BookingRequest,
  BookingWeek,
} from '../../domain/models/booking.model';

const EMPTY_BOOKING: BookingDraft = {
  startsAt: '',
  name: '',
  email: '',
  format: 'video',
  phone: '',
  company: '',
  message: '',
  website: '',
};

type BookingOutcome =
  | {
      readonly kind: 'confirmed';
      readonly confirmation: BookingConfirmation;
      readonly email: string;
    }
  | { readonly kind: 'failed'; readonly reason: BookingFailureReason };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Motif de l'API : un numéro qu'elle refuserait ne doit pas partir.
const PHONE_PATTERN = /^\+?[0-9][0-9 .-]{5,19}$/;
const NAME_MAX_LENGTH = 200;
const EMAIL_MAX_LENGTH = 320;
const COMPANY_MAX_LENGTH = 200;
const MESSAGE_MIN_LENGTH = 10;
const MESSAGE_MAX_LENGTH = 1000;

const toBookingRequest = (draft: BookingDraft): BookingRequest => ({
  startsAt: draft.startsAt,
  name: draft.name,
  email: draft.email,
  format: draft.format,
  phone: draft.format === 'phone' ? draft.phone : null,
  company: draft.company === '' ? null : draft.company,
  message: draft.message,
  website: draft.website,
});

const isOffered = (days: readonly BookingDay[], startsAt: string): boolean =>
  days.some((day) => day.slots.some((slot) => slot.startsAt === startsAt));

@Injectable()
export class BookingFlow {
  private readonly _gateway = inject(BookingGateway);
  private readonly _analytics = inject(AnalyticsGateway);
  private readonly _isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  // Jamais demandés au prérendu : des créneaux sérialisés dans le HTML seraient périmés.
  private readonly _slots = rxResource({
    params: () => (this._isBrowser ? true : undefined),
    stream: () => this._gateway.getSlots(),
  });

  private readonly _days = computed(() =>
    this._slots.hasValue() ? groupSlotsByDay(this._slots.value()) : [],
  );

  private readonly _weekIndex = linkedSignal<readonly BookingWeek[], number>({
    source: () => this.weeks(),
    computation: (weeks, previous) => Math.max(0, Math.min(previous?.value ?? 0, weeks.length - 1)),
  });

  private readonly _selectedDate = linkedSignal<readonly BookingDay[], string | null>({
    source: this._days,
    computation: (days, previous) => {
      const date = previous?.value ?? null;
      return days.some((day) => day.date === date) ? date : null;
    },
  });

  private readonly _model = linkedSignal<readonly BookingDay[], BookingDraft>({
    source: this._days,
    computation: (days, previous) => {
      const draft = previous?.value ?? EMPTY_BOOKING;
      return draft.startsAt === '' || isOffered(days, draft.startsAt)
        ? draft
        : { ...draft, startsAt: '' };
    },
  });

  private readonly _outcome = signal<BookingOutcome | null>(null);

  readonly form = form(
    this._model,
    (path) => {
      required(path.startsAt, { message: 'Choisissez un horaire' });
      required(path.name, { message: 'Indiquez votre nom' });
      minLength(path.name, 2, { message: 'Le nom doit contenir au moins 2 caractères' });
      maxLength(path.name, NAME_MAX_LENGTH, {
        message: `Le nom ne doit pas dépasser ${NAME_MAX_LENGTH} caractères`,
      });
      required(path.email, { message: 'Indiquez votre email' });
      pattern(path.email, EMAIL_PATTERN, { message: "Format d'email invalide" });
      maxLength(path.email, EMAIL_MAX_LENGTH, {
        message: `L'email ne doit pas dépasser ${EMAIL_MAX_LENGTH} caractères`,
      });
      // Validation croisée : le numéro n'est exigé, et contrôlé, que pour un appel téléphonique.
      applyWhen(
        path.phone,
        ({ valueOf }) => valueOf(path.format) === 'phone',
        (phone) => {
          required(phone, { message: 'Indiquez le numéro auquel vous joindre' });
          pattern(phone, PHONE_PATTERN, {
            message: 'Numéro invalide\u00a0: chiffres, espaces, points ou tirets',
          });
        },
      );
      maxLength(path.company, COMPANY_MAX_LENGTH, {
        message: `L'entreprise ne doit pas dépasser ${COMPANY_MAX_LENGTH} caractères`,
      });
      required(path.message, { message: 'Décrivez votre besoin en quelques mots' });
      minLength(path.message, MESSAGE_MIN_LENGTH, {
        message: `Le message doit contenir au moins ${MESSAGE_MIN_LENGTH} caractères`,
      });
      maxLength(path.message, MESSAGE_MAX_LENGTH, {
        message: `Le message ne doit pas dépasser ${MESSAGE_MAX_LENGTH} caractères`,
      });
    },
    {
      submission: {
        action: (field) => this.send(field),
        onInvalid: (field) => focusFirstInvalid(field),
      },
    },
  );
  readonly outcome = this._outcome.asReadonly();
  readonly state = computed(() => loadState(this._slots, () => this._days().length === 0));
  readonly weeks = computed(() => groupDaysByWeek(this._days()));
  readonly currentWeek = computed(() => this.weeks()[this._weekIndex()] ?? null);
  readonly hasPreviousWeek = computed(() => this._weekIndex() > 0);
  readonly hasNextWeek = computed(() => this._weekIndex() < this.weeks().length - 1);
  readonly selectedDate = this._selectedDate.asReadonly();
  readonly selectedDay = computed(
    () => this._days().find((day) => day.date === this._selectedDate()) ?? null,
  );

  showPreviousWeek(): void {
    if (this.hasPreviousWeek()) this._weekIndex.update((index) => index - 1);
  }

  showNextWeek(): void {
    if (this.hasNextWeek()) this._weekIndex.update((index) => index + 1);
  }

  selectDay(date: string): void {
    this._selectedDate.set(date);
    this._model.update((draft) => ({ ...draft, startsAt: '' }));
  }

  reloadSlots(): void {
    this._slots.reload();
  }

  // Point d'entrée unique, partagé par `FormRoot` (événement submit) et les tests.
  async submitBooking(): Promise<void> {
    await submit(this.form);
  }

  private async send(field: FieldTree<BookingDraft>): Promise<void> {
    const draft = field().value();
    this._outcome.set(null);
    const result = await firstValueFrom(this._gateway.createBooking(toBookingRequest(draft)));
    if (result.success) {
      this._outcome.set({ kind: 'confirmed', confirmation: result.data, email: draft.email });
      this._analytics.trackContactSubmit('booking');
      return;
    }
    this._outcome.set({ kind: 'failed', reason: result.reason });
    if (isSlotLost(result.reason)) {
      this.form.startsAt().reset('');
      this._slots.reload();
    }
  }
}
