import { DOCUMENT } from '@angular/common';
import { Component, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { WordingWarning } from '../profile-wording-warnings';

@Component({
  selector: 'app-admin-wording-notice',
  imports: [RouterLink],
  host: { class: 'block' },
  template: `
    @if (warnings().length > 0) {
      <section
        data-testid="admin-wording-notice"
        aria-labelledby="admin-wording-notice-title"
        class="rounded-md border border-status-warn/40 bg-status-warn/10 p-4"
      >
        <h2
          id="admin-wording-notice-title"
          data-testid="admin-wording-notice-title"
          class="font-display text-base font-bold font-stretch-104%"
        >
          À relire avant de publier
        </h2>
        <ul class="mt-2 grid gap-1 text-sm">
          @for (warning of warnings(); track warning.fieldId + warning.wording) {
            <li data-testid="admin-wording-notice-item">
              <a
                routerLink="."
                [fragment]="warning.fieldId"
                (click)="focusField(warning.fieldId)"
                class="inline-flex min-h-11 items-center text-primary underline-offset-2 hover:underline"
                >«&nbsp;{{ warning.wording }}&nbsp;» dans {{ warning.fieldLabel }}</a
              >
            </li>
          }
        </ul>
      </section>
    }
  `,
})
export class AdminWordingNotice {
  private readonly document = inject(DOCUMENT);

  readonly warnings = input.required<readonly WordingWarning[]>();

  protected focusField(fieldId: string): void {
    this.document.getElementById(fieldId)?.focus();
  }
}
