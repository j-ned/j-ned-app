import { NgTemplateOutlet } from '@angular/common';
import { Component, contentChild, input, output, TemplateRef } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ConfirmDialog } from '@shared/ui/confirm-dialog';
import { LoadError } from '@shared/ui/load-error';
import type { LoadState } from '@shared/ui/load-state';
import { AppSkeleton } from '@shared/ui/skeleton';

export type AdminEditorCopy = {
  readonly testIdPrefix: 'admin-project' | 'admin-post';
  readonly loading: string;
  readonly loadError: string;
  readonly missing: string;
  readonly backRoute: string;
  readonly backLabel: string;
  readonly leave: string;
};

@Component({
  selector: 'app-admin-editor-frame',
  imports: [NgTemplateOutlet, RouterLink, ConfirmDialog, LoadError, AppSkeleton],
  template: `
    @let prefix = copy().testIdPrefix;
    @switch (state()) {
      @case ('loading') {
        <div
          [attr.data-testid]="prefix + '-editor-loading'"
          role="status"
          class="grid gap-5 2xl:max-w-[calc(100%-28.5rem)]"
        >
          <span class="sr-only">{{ copy().loading }}</span>
          <app-skeleton class="block h-12 rounded-md" />
          <app-skeleton class="block h-28 rounded-md" />
          <app-skeleton class="block h-12 rounded-md" />
          <app-skeleton class="block h-40 rounded-md" />
        </div>
      }
      @case ('error') {
        <app-load-error [message]="copy().loadError" (retry)="retry.emit()" />
      }
      @case ('empty') {
        <p [attr.data-testid]="prefix + '-editor-missing'" class="py-8 text-center text-muted">
          {{ copy().missing }}
        </p>
      }
      @default {
        <div class="grid items-start gap-10 2xl:grid-cols-[minmax(0,1fr)_25rem] 2xl:gap-14">
          <div class="min-w-0">
            <ng-container [ngTemplateOutlet]="editorForm()" />
          </div>
          <div
            id="apercu"
            [attr.data-testid]="prefix + '-aside'"
            class="grid scroll-mt-6 gap-3.5 2xl:sticky 2xl:top-6"
          >
            <ng-container [ngTemplateOutlet]="editorAside()" />
          </div>
        </div>
      }
    }

    @if (state() === 'error' || state() === 'empty') {
      <p class="text-center">
        <a
          [attr.data-testid]="prefix + '-editor-back'"
          [routerLink]="copy().backRoute"
          class="inline-flex min-h-11 items-center text-sm text-primary hover:underline"
        >
          {{ copy().backLabel }}
        </a>
      </p>
    }

    <app-confirm-dialog
      [open]="leaveAsked()"
      heading="Quitter sans enregistrer&#8239;?"
      confirmLabel="Quitter sans enregistrer"
      cancelLabel="Continuer l'édition"
      (confirmed)="leaveAnswered.emit(true)"
      (cancelled)="leaveAnswered.emit(false)"
    >
      {{ copy().leave }}
    </app-confirm-dialog>
  `,
})
export class AdminEditorFrame {
  readonly state = input.required<LoadState>();
  readonly copy = input.required<AdminEditorCopy>();
  readonly leaveAsked = input(false);
  readonly retry = output<void>();
  readonly leaveAnswered = output<boolean>();

  protected readonly editorForm = contentChild.required('editorForm', { read: TemplateRef });
  protected readonly editorAside = contentChild.required('editorAside', { read: TemplateRef });
}
