import { NgTemplateOutlet } from '@angular/common';
import {
  afterRenderEffect,
  Component,
  computed,
  contentChild,
  ElementRef,
  input,
  output,
  signal,
  TemplateRef,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { counted } from '@shared/format/counted';
import { pluralize } from '@shared/format/pluralize';
import { Button } from '@shared/ui/button';
import { ConfirmDialog } from '@shared/ui/confirm-dialog';
import { LoadError } from '@shared/ui/load-error';
import type { LoadState } from '@shared/ui/load-state';
import { AppSkeleton } from '@shared/ui/skeleton';

export type AdminEditorCopy = {
  readonly testIdPrefix: 'admin-project' | 'admin-post' | 'admin-profile';
  readonly loading: string;
  readonly loadError: string;
  readonly missing: string;
  readonly backRoute: string;
  readonly backLabel: string;
  readonly leave: string;
  readonly entity: 'de cet article' | 'de ce projet' | 'du parcours';
};

@Component({
  selector: 'app-admin-editor-frame',
  imports: [NgTemplateOutlet, RouterLink, Button, ConfirmDialog, LoadError, AppSkeleton],
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
        <div
          #newerVersionStatus
          [attr.data-testid]="prefix + '-newer-version'"
          role="status"
          tabindex="-1"
        >
          @if (newerVersion()) {
            <div
              class="mb-6 flex flex-wrap items-center gap-3 rounded-lg border border-status-warn/40 bg-status-warn/10 p-3 text-sm"
            >
              <p class="min-w-0 flex-1">
                Une version plus récente {{ copy().entity }} a été enregistrée ailleurs.
              </p>
              <button
                appButton
                type="button"
                variant="outlined"
                [attr.data-testid]="prefix + '-reload-latest'"
                (click)="askReload()"
              >
                Recharger la dernière version
              </button>
            </div>
          } @else if (reloaded()) {
            <p class="mb-6 text-sm text-muted">Dernière version chargée.</p>
          }
        </div>
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

    <app-confirm-dialog
      [attr.data-testid]="prefix + '-reload-dialog'"
      [open]="reloadAsked()"
      heading="Recharger la dernière version&#8239;?"
      confirmLabel="Recharger la dernière version"
      cancelLabel="Continuer l'édition"
      (confirmed)="reload()"
      (cancelled)="reloadAsked.set(false)"
    >
      {{ lostChanges() }}
    </app-confirm-dialog>

    <app-confirm-dialog
      [attr.data-testid]="prefix + '-overwrite-dialog'"
      [open]="overwriteAsked()"
      heading="Enregistrer par-dessus la version la plus récente&#8239;?"
      confirmLabel="Enregistrer quand même"
      cancelLabel="Continuer l'édition"
      (confirmed)="overwriteAnswered.emit(true)"
      (cancelled)="overwriteAnswered.emit(false)"
    >
      Une version plus récente {{ copy().entity }} a été enregistrée ailleurs&#160;: enregistrer ton
      brouillon la remplacera.
    </app-confirm-dialog>
  `,
})
export class AdminEditorFrame {
  readonly state = input.required<LoadState>();
  readonly copy = input.required<AdminEditorCopy>();
  readonly leaveAsked = input(false);
  readonly newerVersion = input(false);
  readonly reloaded = input(false);
  readonly overwriteAsked = input(false);
  readonly changes = input(0);
  readonly retry = output<void>();
  readonly leaveAnswered = output<boolean>();
  readonly reloadLatest = output<void>();
  readonly overwriteAnswered = output<boolean>();

  protected readonly editorForm = contentChild.required('editorForm', { read: TemplateRef });
  protected readonly editorAside = contentChild.required('editorAside', { read: TemplateRef });
  private readonly newerVersionStatus = viewChild<ElementRef<HTMLElement>>('newerVersionStatus');

  private readonly loadError = viewChild(LoadError);

  protected readonly reloadAsked = signal(false);
  private focusRetryOnError = false;
  // La zone d'état disparaît avec l'éditeur si le rechargement échoue : le focus va à « Réessayer ».
  private readonly focusAfterFailedReload = afterRenderEffect({
    write: () => {
      const loadError = this.loadError();
      if (!loadError || !this.focusRetryOnError) return;
      this.focusRetryOnError = false;
      loadError.focusRetry();
    },
  });
  protected readonly lostChanges = computed(() => {
    const changes = this.changes();
    const count = counted(
      changes,
      'modification non enregistrée',
      'modifications non enregistrées',
    );
    const lost = pluralize(changes, 'sera perdue', 'seront perdues');
    return `Ton brouillon sera remplacé par la dernière version enregistrée\u00a0: ${count} ${this.copy().entity} ${lost}.`;
  });

  protected askReload(): void {
    if (this.changes() > 0) this.reloadAsked.set(true);
    else this.reload();
  }

  // Le bouton disparaît avec l'avertissement : le focus passe à l'état, qui annonce la suite.
  protected reload(): void {
    this.reloadAsked.set(false);
    this.focusRetryOnError = true;
    this.newerVersionStatus()?.nativeElement.focus();
    this.reloadLatest.emit();
  }
}
