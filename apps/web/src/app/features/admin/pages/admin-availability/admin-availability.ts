import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { rxResource, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormRoot,
  applyEach,
  form,
  required,
  validate,
  validateTree,
} from '@angular/forms/signals';
import { firstValueFrom } from 'rxjs';
import { ToastStore } from '@core/notifications/toast-store';
import { BookingGateway } from '@features/booking/domain/gateways/booking.gateway';
import type {
  AvailabilityClosure,
  AvailabilityRule,
  BookingAdminFailure,
  NewAvailabilityClosure,
} from '@features/booking/domain/models/booking-admin.model';
import { focusFirstInvalid } from '@shared/forms/focus-first-invalid';
import { ConfirmDialog } from '@shared/ui/confirm-dialog';
import { LoadError } from '@shared/ui/load-error';
import { loadState } from '@shared/ui/load-state';
import { AppSkeleton } from '@shared/ui/skeleton';
import {
  AVAILABILITY_WEEKDAYS,
  findOverlappedRange,
  toAvailabilityDraft,
  toAvailabilityRules,
  toMinuteOfDay,
  type AvailabilityDraft,
} from '../../application/availability-draft';
import { AdminAvailabilityRows } from '../../application/components/admin-availability-rows';
import { AdminClosures } from '../../application/components/admin-closures';
import { AdminPageHeader } from '../../application/components/admin-page-header';
import { AdminSaveBar } from '../../application/components/admin-save-bar';
import { AdminSectionHead } from '../../application/components/admin-section-head';
import { DocumentDraft } from '../../application/document-draft';
import type { LeaveConfirmable } from '../../application/unsaved-changes-guard';

const SAVE_FAILURES: Partial<Record<BookingAdminFailure, string>> = {
  overlap: 'Deux plages du même jour se chevauchent : corrigez-les, puis enregistrez.',
  invalid: 'Les plages ont été refusées : vérifiez les heures, puis réessayez.',
  network: 'Enregistrement impossible : vérifiez votre connexion, puis réessayez.',
};
const SAVE_SERVER_FAILURE =
  "Enregistrement impossible : le serveur n'a pas répondu. Réessayez dans un instant.";

const CREATE_FAILURES: Partial<Record<BookingAdminFailure, string>> = {
  invalid: 'La fermeture a été refusée : vérifiez les dates, puis réessayez.',
  network: 'Ajout impossible : vérifiez votre connexion, puis réessayez.',
};
const CREATE_SERVER_FAILURE =
  "Ajout impossible : le serveur n'a pas répondu. Réessayez dans un instant.";

const DELETE_FAILURES: Partial<Record<BookingAdminFailure, string>> = {
  'not-found': "Cette fermeture n'existe plus. Rechargez la page.",
  network: 'Suppression impossible : vérifiez votre connexion, puis réessayez.',
};
const DELETE_SERVER_FAILURE =
  "Suppression impossible : le serveur n'a pas répondu. Réessayez dans un instant.";

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
    AdminAvailabilityRows,
    AdminClosures,
    AdminPageHeader,
    AdminSaveBar,
    AdminSectionHead,
  ],
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
        heading="Plages hebdomadaires"
        headingId="admin-availability-weekly-heading"
      />
      @switch (rulesState()) {
        @case ('loading') {
          <div
            data-testid="admin-availability-loading"
            role="status"
            class="mt-5 grid gap-8 lg:grid-cols-2"
          >
            <span class="sr-only">Chargement des disponibilités…</span>
            <app-skeleton class="block h-32 rounded-sm" />
            <app-skeleton class="block h-32 rounded-sm" />
            <app-skeleton class="block h-32 rounded-sm" />
            <app-skeleton class="block h-32 rounded-sm" />
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
            [formRoot]="rulesForm"
            novalidate
            class="mt-6 grid gap-x-12 gap-y-8 lg:grid-cols-2"
          >
            @for (weekday of weekdays; track weekday.key) {
              <fieldset
                app-admin-availability-rows
                [rows]="rulesForm[weekday.key]"
                [day]="weekday"
              ></fieldset>
            }
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

  protected readonly weekdays = AVAILABILITY_WEEKDAYS;

  protected readonly rulesResource = rxResource({
    stream: () => this.gateway.getAvailabilityRules(),
  });
  protected readonly rulesState = computed(() => loadState(this.rulesResource, () => false));

  protected readonly draft = new DocumentDraft<readonly AvailabilityRule[], AvailabilityDraft>({
    loaded: computed(() => (this.rulesResource.hasValue() ? this.rulesResource.value() : null)),
    toDraft: toAvailabilityDraft,
    sections: [
      {
        id: 'admin-availability-weekly',
        label: 'Plages hebdomadaires',
        fields: AVAILABILITY_WEEKDAYS.map(({ key }) => key),
      },
    ],
  });
  protected readonly noRule = computed(() => this.draft.saved()?.length === 0);

  protected readonly rulesForm = form(
    this.draft.value,
    (path) => {
      for (const { key } of AVAILABILITY_WEEKDAYS) {
        applyEach(path[key], (row) => {
          required(row.start, { message: "Choisissez l'heure de début" });
          required(row.end, { message: "Choisissez l'heure de fin" });
          validate(row.end, ({ value, valueOf }) => {
            const start = valueOf(row.start);
            return value() !== '' && start !== '' && toMinuteOfDay(value()) <= toMinuteOfDay(start)
              ? { kind: 'endBeforeStart', message: 'La fin doit suivre le début' }
              : null;
          });
          validateTree(row, ({ index, valueOf, fieldTreeOf }) => {
            const overlapped = findOverlappedRange(valueOf(path[key]), index());
            return overlapped === null
              ? null
              : {
                  kind: 'overlap',
                  message: `Chevauche la plage ${overlapped + 1}`,
                  fieldTree: fieldTreeOf(row.start),
                };
          });
        });
      }
    },
    {
      submission: {
        action: () => this.saveRules(),
        onInvalid: (field) => focusFirstInvalid(field),
      },
    },
  );

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
      return;
    }
    const reason = result.error instanceof AvailabilitySaveFailure ? result.error.reason : null;
    this.toast.add({
      severity: 'error',
      detail: (reason && SAVE_FAILURES[reason]) ?? SAVE_SERVER_FAILURE,
    });
  }

  protected createClosure(closure: NewAvailabilityClosure): void {
    this.gateway
      .createClosure(closure)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => {
        if (!result.success) {
          this.toast.add({
            severity: 'error',
            detail: CREATE_FAILURES[result.reason] ?? CREATE_SERVER_FAILURE,
          });
          return;
        }
        this.closuresResource.update((list) => [...(list ?? []), result.data].sort(byPeriod));
        this.closureResetToken.update((token) => token + 1);
        this.toast.add({ severity: 'success', detail: 'Fermeture ajoutée' });
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
            detail: DELETE_FAILURES[result.reason] ?? DELETE_SERVER_FAILURE,
          });
          return;
        }
        this.closuresResource.update((list) => (list ?? []).filter((item) => item.id !== id));
        this.toast.add({ severity: 'success', detail: 'Fermeture supprimée' });
      });
  }
}
