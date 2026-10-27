import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import type {
  InsertGuide,
  InsertGuideDocument,
} from '@features/workshop/domain/models/insert-guide.model';
import { HttpInsertGuideGateway } from '@features/workshop/infra/gateways/http-insert-guide.gateway';
import { ToastStore } from '@core/notifications/toast-store';
import { withValidationDetail } from '@shared/api/with-validation-detail';
import { loadState } from '@shared/ui/load-state';
import {
  AdminEditorFrame,
  type AdminEditorCopy,
} from '../../application/components/admin-editor-frame';
import { AdminInsertGuideForm } from '../../application/components/admin-insert-guide-form';
import { AdminPageHeader } from '../../application/components/admin-page-header';
import { AdminSaveBar } from '../../application/components/admin-save-bar';
import { DocumentDraft } from '../../application/document-draft';
import { toInsertGuideDraft, type InsertGuideDraft } from '../../application/insert-guide-draft';
import type { LeaveConfirmable } from '../../application/unsaved-changes-guard';

const INSERT_GUIDE_EDITOR_COPY: AdminEditorCopy = {
  testIdPrefix: 'admin-insert-guide',
  loading: 'Chargement du guide des plaquettes…',
  loadError:
    "Le guide des plaquettes n'a pas pu être chargé. Vérifiez votre connexion, puis réessayez.",
  missing: "Le guide des plaquettes n'a pas été trouvé.",
  backRoute: '/admin',
  backLabel: "Retour à la vue d'ensemble",
  leave: 'Les modifications non enregistrées du guide des plaquettes seront perdues.',
};

const CONFLICT_MESSAGE =
  'Le guide des plaquettes a été modifié depuis une autre fenêtre. Rechargez la page pour repartir de la dernière version (vos modifications non enregistrées seront perdues).';

@Component({
  selector: 'app-admin-insert-guide',
  imports: [AdminEditorFrame, AdminInsertGuideForm, AdminPageHeader, AdminSaveBar, RouterLink],
  host: { '(window:beforeunload)': 'draft.warnBeforeUnload($event)' },
  template: `
    <app-admin-page-header heading="Guide des plaquettes">
      <p>
        Les plaquettes que vous utilisez à l'atelier, affichées sur la page publique du guide quand
        il est visible. Les changements y sont visibles au plus une seconde après l'enregistrement,
        au rechargement de la page.
      </p>
    </app-admin-page-header>

    <app-admin-editor-frame
      [state]="state()"
      [copy]="INSERT_GUIDE_EDITOR_COPY"
      [leaveAsked]="draft.leave.asked()"
      (retry)="guideResource.reload()"
      (leaveAnswered)="draft.leave.answer($event)"
    >
      <ng-template #editorForm>
        <app-admin-insert-guide-form
          [(value)]="draft.value"
          [savedEntries]="draft.saved()?.entries ?? []"
          (submitted)="save($event)"
        />
        <app-admin-save-bar
          class="mt-10"
          formId="insert-guide-form"
          cancelRoute="/admin"
          [changes]="draft.changes()"
          [submitting]="draft.saving()"
        />
      </ng-template>
      <ng-template #editorAside>
        <section
          aria-labelledby="insert-guide-reminder-title"
          class="rounded-md border border-line p-4 text-sm"
        >
          <h2 id="insert-guide-reminder-title" class="font-display text-base font-bold">
            Avant d'enregistrer
          </h2>
          <p class="mt-2 text-muted">
            Ce guide est public&nbsp;: jamais de nom de client ni de pièce, ni de référence de plan
            ou d'ordre de fabrication.
          </p>
          <a
            routerLink="/atelier/plaquettes"
            class="mt-2 inline-flex min-h-11 items-center text-primary hover:underline"
          >
            Voir la page publique
          </a>
        </section>
      </ng-template>
    </app-admin-editor-frame>
  `,
})
export class AdminInsertGuide implements LeaveConfirmable {
  private readonly gateway = inject(HttpInsertGuideGateway);
  private readonly toast = inject(ToastStore);

  protected readonly INSERT_GUIDE_EDITOR_COPY = INSERT_GUIDE_EDITOR_COPY;

  protected readonly guideResource = rxResource({ stream: () => this.gateway.getDocument() });

  private readonly loaded = computed(() =>
    this.guideResource.hasValue() ? this.guideResource.value() : null,
  );

  protected readonly state = computed(() => loadState(this.guideResource, () => false));
  protected readonly draft = new DocumentDraft<InsertGuideDocument, InsertGuideDraft>({
    loaded: this.loaded,
    toDraft: toInsertGuideDraft,
    sections: [],
  });

  canLeave(): boolean | Promise<boolean> {
    return this.draft.canLeave();
  }

  protected async save(guide: InsertGuide): Promise<void> {
    const version = this.draft.saved()?.version;
    if (version === undefined) return;
    const result = await this.draft.save(() =>
      firstValueFrom(this.gateway.saveGuide(guide, version)),
    );
    if (result.success) {
      this.toast.add({ severity: 'success', detail: 'Guide des plaquettes enregistré' });
      return;
    }
    this.toast.add({ severity: 'error', detail: saveFailure(result.error) });
  }
}

function saveFailure(error: unknown): string {
  if (error instanceof HttpErrorResponse && error.status === 409) return CONFLICT_MESSAGE;
  return withValidationDetail("Le guide des plaquettes n'a pas pu être enregistré.", error);
}
