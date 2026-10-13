import {
  Component,
  computed,
  effect,
  input,
  output,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { FormField, FormRoot, form, maxLength, required, validate } from '@angular/forms/signals';
import type {
  AvailabilityClosure,
  NewAvailabilityClosure,
} from '@features/booking/domain/models/booking-admin.model';
import { formatLongDate } from '@features/booking/domain/paris-format';
import { focusFirstInvalid } from '@shared/forms/focus-first-invalid';
import { AppIcon } from '@shared/icons/app-icon';
import { Button } from '@shared/ui/button';
import { ConfirmDialog } from '@shared/ui/confirm-dialog';
import { FieldError } from '@shared/ui/field-error';
import { LoadError } from '@shared/ui/load-error';
import type { LoadState } from '@shared/ui/load-state';
import { AppSkeleton } from '@shared/ui/skeleton';
import { capitalize } from '../capitalize';
import { AdminSectionHead } from './admin-section-head';

const REASON_MAX_LENGTH = 500;

const EMPTY_CLOSURE = { startsOn: '', endsOn: '', reason: '' };

type ClosureRow = {
  readonly id: string;
  readonly period: string;
  readonly deleteLabel: string;
  readonly reason: string | null;
};

function toClosureRow({ id, startsOn, endsOn, reason }: AvailabilityClosure): ClosureRow {
  const first = formatLongDate(startsOn);
  const days = startsOn === endsOn ? first : `${first} au ${formatLongDate(endsOn)}`;
  return {
    id,
    period: startsOn === endsOn ? capitalize(first) : `Du ${days}`,
    deleteLabel: `Supprimer la fermeture du ${days}`,
    reason,
  };
}

@Component({
  selector: 'section[app-admin-closures]',
  imports: [
    FormRoot,
    FormField,
    AppIcon,
    Button,
    ConfirmDialog,
    FieldError,
    LoadError,
    AppSkeleton,
    AdminSectionHead,
  ],
  host: {
    'data-testid': 'admin-closures',
    'aria-labelledby': 'admin-closures-heading',
    class: 'block',
  },
  template: `
    <app-admin-section-head heading="Fermetures" headingId="admin-closures-heading" />

    @if (state() === 'ready' || state() === 'empty') {
      <form
        data-testid="admin-closure-form"
        [formRoot]="closureForm"
        novalidate
        class="mt-5 grid items-start gap-4 sm:grid-cols-2 lg:grid-cols-[minmax(0,12rem)_minmax(0,12rem)_minmax(0,1fr)_auto]"
      >
        @let startsInError = closureForm.startsOn().touched() && closureForm.startsOn().invalid();
        <div>
          <label for="admin-closure-starts-on" class="field-label">Premier jour</label>
          <input
            id="admin-closure-starts-on"
            data-testid="admin-closure-starts-on"
            type="date"
            [formField]="closureForm.startsOn"
            aria-required="true"
            [attr.aria-invalid]="startsInError"
            [attr.aria-describedby]="startsInError ? 'admin-closure-starts-on-error' : null"
            class="form-input"
          />
          <app-field-error
            [field]="closureForm.startsOn"
            errorId="admin-closure-starts-on-error"
            testId="admin-closure-starts-on-error"
          />
        </div>
        @let endsInError = closureForm.endsOn().touched() && closureForm.endsOn().invalid();
        <div>
          <label for="admin-closure-ends-on" class="field-label">Dernier jour</label>
          <input
            id="admin-closure-ends-on"
            data-testid="admin-closure-ends-on"
            type="date"
            [formField]="closureForm.endsOn"
            aria-required="true"
            [attr.aria-invalid]="endsInError"
            [attr.aria-describedby]="endsInError ? 'admin-closure-ends-on-error' : null"
            class="form-input"
          />
          <app-field-error
            [field]="closureForm.endsOn"
            errorId="admin-closure-ends-on-error"
            testId="admin-closure-ends-on-error"
          />
        </div>
        <div class="sm:col-span-2 lg:col-span-1">
          <label for="admin-closure-reason" class="field-label">Motif (facultatif)</label>
          <input
            id="admin-closure-reason"
            data-testid="admin-closure-reason"
            type="text"
            [formField]="closureForm.reason"
            class="form-input"
          />
        </div>
        <button
          appButton
          type="submit"
          variant="outlined"
          data-testid="admin-closure-submit"
          class="lg:mt-6.5"
        >
          <app-icon name="plus" [size]="16" />Ajouter la fermeture
        </button>
      </form>
    }

    @switch (state()) {
      @case ('loading') {
        <div data-testid="admin-closures-loading" role="status" class="mt-5 space-y-3">
          <span class="sr-only">Chargement des fermetures…</span>
          <app-skeleton class="block h-14 rounded-sm" />
          <app-skeleton class="block h-14 rounded-sm" />
        </div>
      }
      @case ('error') {
        <app-load-error
          message="Les fermetures n'ont pas pu être chargées. Vérifiez votre connexion, puis réessayez."
          (retry)="retry.emit()"
        />
      }
      @case ('empty') {
        <p data-testid="admin-closures-empty" class="py-5 text-sm text-muted">
          Aucune fermeture à venir.
        </p>
      }
      @default {
        <ul data-testid="admin-closures-list" role="list" class="mt-2">
          @for (row of rows(); track row.id) {
            <li
              data-testid="admin-closure"
              class="flex items-center justify-between gap-4 border-b border-line py-3"
            >
              <div class="min-w-0">
                <p data-testid="admin-closure-period" class="font-semibold">{{ row.period }}</p>
                @if (row.reason) {
                  <p data-testid="admin-closure-row-reason" class="mt-0.5 text-sm text-muted">
                    {{ row.reason }}
                  </p>
                }
              </div>
              <button
                appButton
                type="button"
                variant="text-danger"
                size="icon"
                data-testid="admin-closure-delete"
                [attr.aria-label]="row.deleteLabel"
                (click)="pendingDeletion.set(row)"
              >
                <app-icon name="trash" [size]="18" />
              </button>
            </li>
          }
        </ul>
      }
    }

    <app-confirm-dialog
      [open]="pendingDeletion() !== null"
      heading="Supprimer cette fermeture&#8239;?"
      confirmLabel="Supprimer la fermeture"
      cancelLabel="Garder la fermeture"
      (confirmed)="confirmDeletion()"
      (cancelled)="pendingDeletion.set(null)"
    >
      {{ pendingDeletion()?.period }}. Les créneaux redeviennent réservables.
    </app-confirm-dialog>
  `,
})
export class AdminClosures {
  readonly state = input.required<LoadState>();
  readonly closures = input.required<readonly AvailabilityClosure[]>();
  readonly resetToken = input(0);
  readonly retry = output<void>();
  readonly created = output<NewAvailabilityClosure>();
  readonly deleteConfirmed = output<string>();

  private readonly _sectionHead = viewChild.required(AdminSectionHead);

  protected readonly rows = computed(() => this.closures().map(toClosureRow));
  protected readonly pendingDeletion = signal<ClosureRow | null>(null);

  private readonly _closure = signal({ ...EMPTY_CLOSURE });
  protected readonly closureForm = form(
    this._closure,
    (path) => {
      required(path.startsOn, { message: 'Choisissez le premier jour' });
      required(path.endsOn, { message: 'Choisissez le dernier jour' });
      validate(path.endsOn, ({ value, valueOf }) => {
        const startsOn = valueOf(path.startsOn);
        return value() !== '' && startsOn !== '' && value() < startsOn
          ? { kind: 'beforeStart', message: 'Le dernier jour ne peut pas précéder le premier' }
          : null;
      });
      maxLength(path.reason, REASON_MAX_LENGTH);
    },
    {
      submission: {
        action: async () => {
          const { startsOn, endsOn, reason } = this._closure();
          this.created.emit({ startsOn, endsOn, reason: reason.trim() || null });
        },
        onInvalid: (field) => focusFirstInvalid(field),
      },
    },
  );

  private readonly resetAfterCreation = effect(() => {
    this.resetToken();
    untracked(() => this.closureForm().reset({ ...EMPTY_CLOSURE }));
  });

  protected confirmDeletion(): void {
    const row = this.pendingDeletion();
    this.pendingDeletion.set(null);
    this._sectionHead().focusHeading();
    if (row) this.deleteConfirmed.emit(row.id);
  }
}
