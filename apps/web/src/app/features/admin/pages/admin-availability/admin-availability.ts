import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { rxResource, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormRoot, form } from '@angular/forms/signals';
import { firstValueFrom } from 'rxjs';
import { ToastStore } from '@core/notifications/toast-store';
import { BookingGateway } from '@features/booking/domain/gateways/booking.gateway';
import type {
  AvailabilityClosure,
  AvailabilityRule,
  BookingAdminFailure,
  NewAvailabilityClosure,
} from '@features/booking/domain/models/booking-admin.model';
import { ConfirmDialog } from '@shared/ui/confirm-dialog';
import { LoadError } from '@shared/ui/load-error';
import { loadState } from '@shared/ui/load-state';
import { AppSkeleton } from '@shared/ui/skeleton';
import {
  AVAILABILITY_WEEKDAYS,
  toAvailabilityRules,
  toWeeklySlotsDraft,
  type WeeklySlotsDraft,
} from '../../application/availability-draft';
import { AdminAvailabilityCalendar } from '../../application/components/admin-availability-calendar';
import { AdminClosures } from '../../application/components/admin-closures';
import { AdminPageHeader } from '../../application/components/admin-page-header';
import { AdminSaveBar } from '../../application/components/admin-save-bar';
import { AdminSectionHead } from '../../application/components/admin-section-head';
import { AdminWeekTemplate } from '../../application/components/admin-week-template';
import { DocumentDraft } from '../../application/document-draft';
import type { LeaveConfirmable } from '../../application/unsaved-changes-guard';
import {
  createFailureMessage,
  deleteFailureMessage,
  saveFailureMessage,
} from './availability-messages';
import { AvailabilityCalendar } from './availability-calendar';

const byPeriod = (a: AvailabilityClosure, b: AvailabilityClosure): number =>
  a.startsOn.localeCompare(b.startsOn) || a.endsOn.localeCompare(b.endsOn);

class AvailabilitySaveFailure extends Error {
  constructor(readonly reason: BookingAdminFailure) {
    super(`Availability rules rejected: ${reason}`);
  }
}

@Component({
  selector: 'app-admin-availability',
  imports: [
    FormRoot,
    ConfirmDialog,
    LoadError,
    AppSkeleton,
    AdminAvailabilityCalendar,
    AdminClosures,
    AdminPageHeader,
    AdminSaveBar,
    AdminSectionHead,
    AdminWeekTemplate,
  ],
  providers: [AvailabilityCalendar],
  host: { class: 'block', '(window:beforeunload)': 'draft.warnBeforeUnload($event)' },
  template: `
    <app-admin-page-header heading="Disponibilités">
      Les créneaux de 30 minutes proposés sur la page de réservation découlent de ces plages, à
      l'heure de Paris, moins les fermetures et les rendez-vous déjà pris.
    </app-admin-page-header>

    <section
      data-testid="admin-availability-weekly"
      aria-labelledby="admin-availability-weekly-heading"
    >
      <app-admin-section-head
        heading="Semaine type"
        headingId="admin-availability-weekly-heading"
      />
      @switch (rulesState()) {
        @case ('loading') {
          <div
            data-testid="admin-availability-loading"
            role="status"
            class="mt-6 grid gap-x-12 gap-y-8 lg:grid-cols-[minmax(0,1fr)_17rem]"
          >
            <span class="sr-only">Chargement des disponibilités…</span>
            <app-skeleton class="block h-56 rounded-sm" />
            <app-skeleton class="block h-56 rounded-sm" />
          </div>
        }
        @case ('error') {
          <app-load-error
            message="Les disponibilités n'ont pas pu être chargées. Vérifiez votre connexion, puis réessayez."
            (retry)="rulesResource.reload()"
          />
        }
        @default {
          @if (noRule()) {
            <p
              data-testid="admin-availability-none"
              class="mt-5 border-l-2 border-primary pl-3 text-sm"
            >
              Aucune plage&nbsp;: la page de réservation n'affiche aucun créneau.
            </p>
          }
          <form
            id="availability-form"
            data-testid="admin-availability-rules"
            [formRoot]="slotsForm"
            novalidate
            class="mt-6"
          >
            <app-admin-week-template [slots]="slotsForm" />
          </form>
          <app-admin-save-bar
            class="mt-10"
            formId="availability-form"
            cancelRoute="/admin"
            [changes]="draft.changes()"
            [submitting]="draft.saving()"
          />
        }
      }
    </section>

    <section
      app-admin-availability-calendar
      class="mt-14"
      [view]="calendar.view()"
      [state]="calendar.state()"
      [busy]="calendar.busy()"
      [focusDate]="calendar.focusDate()"
      [pending]="calendar.pending()"
      [holidaysSaving]="calendar.holidaysSaving()"
      [announcement]="calendar.announcement()"
      [bookingWarning]="calendar.bookingWarning()"
      (monthRequested)="calendar.goToMonth($event.month, $event.focusDate)"
      (dayActivated)="calendar.toggleDay($event)"
      (holidaysToggled)="calendar.setHolidaysClosed($event)"
      (retry)="calendar.reload()"
    ></section>

    <section
      app-admin-closures
      class="mt-14"
      [state]="closuresState()"
      [closures]="closures()"
      [resetToken]="closureResetToken()"
      (retry)="closuresResource.reload()"
      (created)="createClosure($event)"
      (deleteConfirmed)="deleteClosure($event)"
    ></section>

    <app-confirm-dialog
      [open]="draft.leave.asked()"
      heading="Quitter sans enregistrer&#8239;?"
      confirmLabel="Quitter sans enregistrer"
      cancelLabel="Continuer l'édition"
      (confirmed)="draft.leave.answer(true)"
      (cancelled)="draft.leave.answer(false)"
    >
      Les modifications non enregistrées des disponibilités seront perdues.
    </app-confirm-dialog>
  `,
})
export class AdminAvailability implements LeaveConfirmable {
  private readonly gateway = inject(BookingGateway);
  private readonly toast = inject(ToastStore);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly calendar = inject(AvailabilityCalendar);

  protected readonly rulesResource = rxResource({
    stream: () => this.gateway.getAvailabilityRules(),
  });
  protected readonly rulesState = computed(() => loadState(this.rulesResource, () => false));

  protected readonly draft = new DocumentDraft<readonly AvailabilityRule[], WeeklySlotsDraft>({
    loaded: computed(() => (this.rulesResource.hasValue() ? this.rulesResource.value() : null)),
    toDraft: toWeeklySlotsDraft,
    sections: [
      {
        id: 'admin-availability-weekly',
        label: 'Semaine type',
        fields: AVAILABILITY_WEEKDAYS.map(({ key }) => key),
      },
    ],
  });
  protected readonly noRule = computed(() => this.draft.saved()?.length === 0);

  protected readonly slotsForm = form(this.draft.value, {
    submission: { action: () => this.saveRules() },
  });

  protected readonly closuresResource = rxResource({
    stream: () => this.gateway.getClosures(),
  });
  protected readonly closures = computed(() =>
    this.closuresResource.hasValue() ? this.closuresResource.value() : [],
  );
  protected readonly closuresState = computed(() =>
    loadState(this.closuresResource, () => this.closures().length === 0),
  );
  protected readonly closureResetToken = signal(0);

  canLeave(): boolean | Promise<boolean> {
    return this.draft.canLeave();
  }

  private async saveRules(): Promise<void> {
    const rules = toAvailabilityRules(this.draft.value());
    const result = await this.draft.save(async () => {
      const outcome = await firstValueFrom(this.gateway.replaceAvailabilityRules(rules));
      if (!outcome.success) throw new AvailabilitySaveFailure(outcome.reason);
      return outcome.data;
    });
    if (result.success) {
      this.toast.add({ severity: 'success', detail: 'Disponibilités enregistrées' });
      this.calendar.reload();
      return;
    }
    const reason = result.error instanceof AvailabilitySaveFailure ? result.error.reason : null;
    this.toast.add({ severity: 'error', detail: saveFailureMessage(reason) });
  }

  protected createClosure(closure: NewAvailabilityClosure): void {
    this.gateway
      .createClosure(closure)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => {
        if (!result.success) {
          this.toast.add({
            severity: 'error',
            detail: createFailureMessage(result.reason),
          });
          return;
        }
        this.closuresResource.update((list) => [...(list ?? []), result.data].sort(byPeriod));
        this.closureResetToken.update((token) => token + 1);
        this.toast.add({ severity: 'success', detail: 'Fermeture ajoutée' });
        this.calendar.reload();
      });
  }

  protected deleteClosure(id: string): void {
    this.gateway
      .deleteClosure(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => {
        if (!result.success) {
          this.toast.add({
            severity: 'error',
            detail: deleteFailureMessage(result.reason),
          });
          return;
        }
        this.closuresResource.update((list) => (list ?? []).filter((item) => item.id !== id));
        this.toast.add({ severity: 'success', detail: 'Fermeture supprimée' });
        this.calendar.reload();
      });
  }
}
