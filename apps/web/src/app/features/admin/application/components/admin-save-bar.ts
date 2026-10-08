import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { counted } from '@shared/format/counted';
import { AppIcon } from '@shared/icons/app-icon';

@Component({
  selector: 'app-admin-save-bar',
  imports: [RouterLink, AppIcon],
  host: {
    class:
      'sticky bottom-0 z-10 flex flex-wrap items-center justify-between gap-x-4 gap-y-3 border-t-[1.5px] border-line-strong bg-background py-3.5',
  },
  template: `
    <p data-testid="savebar-state" role="status" class="flex items-center gap-2.5 text-sm">
      <span
        aria-hidden="true"
        class="size-1.5 rounded-full"
        [class]="changes() > 0 ? 'bg-primary' : 'bg-line-strong'"
      ></span>
      {{ stateLabel() }}
    </p>
    <div class="flex gap-2.5">
      <a data-testid="savebar-cancel" [routerLink]="cancelRoute()" class="link-btn-outline">
        Annuler
      </a>
      <button
        data-testid="savebar-submit"
        type="submit"
        [attr.form]="formId()"
        [disabled]="submitting()"
        class="link-btn-primary cursor-pointer disabled:cursor-wait disabled:opacity-60"
      >
        <app-icon name="check" [size]="16" />Enregistrer
      </button>
    </div>
  `,
})
export class AdminSaveBar {
  readonly formId = input.required<string>();
  readonly changes = input.required<number>();
  readonly submitting = input.required<boolean>();
  readonly cancelRoute = input.required<string>();

  protected readonly stateLabel = computed(() => {
    const changes = this.changes();
    return changes === 0
      ? 'Aucune modification'
      : counted(changes, 'modification non enregistrée', 'modifications non enregistrées');
  });
}
