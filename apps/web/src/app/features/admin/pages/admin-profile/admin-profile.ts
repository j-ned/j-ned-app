import { HttpErrorResponse } from '@angular/common/http';
import {
  Component,
  afterRenderEffect,
  computed,
  inject,
  linkedSignal,
  signal,
  viewChild,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { firstValueFrom } from 'rxjs';
import { ProfileGateway } from '@features/profile/domain/gateways/profile.gateway';
import type {
  ProfileContent,
  ProfileDocument,
} from '@features/profile/domain/models/profile-content.model';
import { withValidationDetail } from '@shared/api/with-validation-detail';
import { loadState } from '@shared/ui/load-state';
import { ToastStore } from '@core/notifications/toast-store';
import {
  AdminEditorFrame,
  type AdminEditorCopy,
} from '../../application/components/admin-editor-frame';
import { AdminFormToc } from '../../application/components/admin-form-toc';
import { AdminFormSection } from '../../application/components/admin-form-section';
import { AdminPageHeader } from '../../application/components/admin-page-header';
import { AdminProfileForm } from '../../application/components/admin-profile-form';
import { AdminProfilePortrait } from '../../application/components/admin-profile-portrait';
import { AdminSaveBar } from '../../application/components/admin-save-bar';
import { AdminWordingNotice } from '../../application/components/admin-wording-notice';
import { DocumentDraft } from '../../application/document-draft';
import type { FormTocSection } from '../../application/form-toc-entries';
import { toProfileDraft, type ProfileDraft } from '../../application/profile-draft';
import { profileWordingWarnings } from '../../application/profile-wording-warnings';
import type { LeaveConfirmable } from '../../application/unsaved-changes-guard';

const FORM_SECTIONS: readonly FormTocSection<ProfileDraft>[] = [
  {
    id: 'profile-biography',
    label: '01 · Parcours',
    fields: ['biographyTitle', 'biographySummary', 'leadEmphasis', 'paragraphs'],
  },
  { id: 'profile-traits', label: '02 · Traits', fields: ['highlights'] },
  {
    id: 'profile-work',
    label: '03 · Ce que je fais',
    fields: ['workSummary', 'whatIDo', 'technologies'],
  },
  { id: 'profile-diplomas', label: '04 · Formations', fields: ['diplomasSummary', 'diplomas'] },
  {
    id: 'profile-motivation',
    label: '05 · Motivation',
    fields: ['motivationTitle', 'motivationStatement', 'motivationDescription'],
  },
  { id: 'profile-portrait', label: '06 · Portrait', fields: [] },
];

const PROFILE_EDITOR_COPY: AdminEditorCopy = {
  testIdPrefix: 'admin-profile',
  loading: 'Chargement du parcours…',
  loadError: "Le parcours n'a pas pu être chargé. Vérifiez votre connexion, puis réessayez.",
  missing: "Le parcours n'a pas été trouvé.",
  backRoute: '/admin',
  backLabel: "Retour à la vue d'ensemble",
  leave: 'Les modifications non enregistrées du parcours seront perdues.',
};

const CONFLICT_MESSAGE =
  'Le parcours a été modifié depuis une autre fenêtre. Rechargez la page pour repartir de la dernière version (vos modifications non enregistrées seront perdues).';

@Component({
  selector: 'app-admin-profile',
  imports: [
    AdminEditorFrame,
    AdminFormSection,
    AdminFormToc,
    AdminPageHeader,
    AdminProfileForm,
    AdminProfilePortrait,
    AdminSaveBar,
    AdminWordingNotice,
  ],
  host: { '(window:beforeunload)': 'draft.warnBeforeUnload($event)' },
  template: `
    <app-admin-page-header heading="Parcours">
      <p>
        Les changements sont visibles sur le site au plus une seconde après l'enregistrement, au
        rechargement de la page.
      </p>
    </app-admin-page-header>

    <app-admin-editor-frame
      [state]="state()"
      [copy]="PROFILE_EDITOR_COPY"
      [leaveAsked]="draft.leave.asked()"
      (retry)="retry()"
      (leaveAnswered)="draft.leave.answer($event)"
    >
      <ng-template #editorForm>
        <app-admin-profile-form [(value)]="draft.value" (submitted)="save($event)" />
        <fieldset
          app-admin-form-section
          id="profile-portrait"
          number="06"
          heading="Portrait"
          description="Envoyé dès le dépôt, sans passer par l'enregistrement. Visible sur le site au plus une seconde après l'envoi, au rechargement de la page."
          class="mt-8.5"
        >
          <app-admin-profile-portrait
            [portraitUrl]="portraitUrl()"
            [busy]="portraitBusy()"
            (portraitSelected)="uploadPortrait($event)"
            (portraitRejected)="rejectPortrait()"
            (removeConfirmed)="removePortrait()"
          />
        </fieldset>
        <app-admin-wording-notice class="mt-10" [warnings]="wordingWarnings()" />
        <app-admin-save-bar
          class="mt-10"
          formId="profile-form"
          cancelRoute="/admin"
          [changes]="draft.changes()"
          [submitting]="draft.saving()"
        />
      </ng-template>
      <ng-template #editorAside>
        <app-admin-form-toc [sections]="draft.toc()" />
      </ng-template>
    </app-admin-editor-frame>
  `,
})
export class AdminProfile implements LeaveConfirmable {
  private readonly gateway = inject(ProfileGateway);
  private readonly toast = inject(ToastStore);

  private readonly header = viewChild.required(AdminPageHeader);

  protected readonly PROFILE_EDITOR_COPY = PROFILE_EDITOR_COPY;

  protected readonly profileResource = rxResource({ stream: () => this.gateway.getProfile() });

  private readonly loaded = computed(() =>
    this.profileResource.hasValue() ? this.profileResource.value() : null,
  );

  protected readonly state = computed(() => loadState(this.profileResource, () => false));
  protected readonly draft = new DocumentDraft<ProfileDocument, ProfileDraft>({
    loaded: this.loaded,
    toDraft: (document, previous): ProfileDraft =>
      toProfileDraft(document?.content ?? null, previous),
    sections: FORM_SECTIONS,
  });

  protected readonly wordingWarnings = computed(() => profileWordingWarnings(this.draft.value()));
  // Hors du brouillon : un portrait envoyé ne compte pas dans les modifications non enregistrées.
  protected readonly portraitUrl = linkedSignal(() => this.loaded()?.portraitUrl ?? null);
  protected readonly portraitBusy = signal(false);

  private retrying = false;
  // « Réessayer » disparaît avec l'erreur : le focus passe au titre une fois le document affiché.
  private readonly focusAfterRetry = afterRenderEffect({
    write: () => {
      if (this.state() !== 'ready' || !this.retrying) return;
      this.retrying = false;
      this.header().focusTitle();
    },
  });

  canLeave(): boolean | Promise<boolean> {
    return this.draft.canLeave();
  }

  protected retry(): void {
    this.retrying = true;
    this.profileResource.reload();
  }

  protected async save(content: ProfileContent): Promise<void> {
    const version = this.draft.saved()?.version;
    if (version === undefined) return;
    const result = await this.draft.save(() =>
      firstValueFrom(this.gateway.saveProfile(content, version)),
    );
    if (result.success) {
      this.toast.add({ severity: 'success', detail: 'Parcours enregistré' });
      return;
    }
    this.toast.add({ severity: 'error', detail: saveFailure(result.error) });
  }

  protected async uploadPortrait(file: File): Promise<void> {
    this.portraitBusy.set(true);
    try {
      const document = await firstValueFrom(this.gateway.uploadPortrait(file));
      this.portraitUrl.set(document.portraitUrl);
      this.toast.add({ severity: 'success', detail: 'Portrait remplacé' });
    } catch (error: unknown) {
      this.toast.add({
        severity: 'error',
        detail: portraitFailure("Le portrait n'a pas pu être remplacé.", error),
      });
    } finally {
      this.portraitBusy.set(false);
    }
  }

  protected rejectPortrait(): void {
    this.toast.add({
      severity: 'error',
      detail: 'Seules les images AVIF, WebP, PNG ou JPEG sont acceptées.',
    });
  }

  protected async removePortrait(): Promise<void> {
    this.portraitBusy.set(true);
    try {
      await firstValueFrom(this.gateway.removePortrait(), { defaultValue: undefined });
      this.portraitUrl.set(null);
      this.toast.add({ severity: 'success', detail: 'Portrait par défaut rétabli' });
    } catch (error: unknown) {
      this.toast.add({
        severity: 'error',
        detail: portraitFailure("Le portrait par défaut n'a pas pu être rétabli.", error),
      });
    } finally {
      this.portraitBusy.set(false);
    }
  }
}

// 503 : le parcours est verrouillé par une autre écriture le temps de quelques secondes.
function portraitFailure(label: string, error: unknown): string {
  if (error instanceof HttpErrorResponse && error.status === 503) {
    return `${label} Réessayez dans quelques secondes.`;
  }
  return withValidationDetail(label, error);
}

function saveFailure(error: unknown): string {
  if (error instanceof HttpErrorResponse && error.status === 409) return CONFLICT_MESSAGE;
  return withValidationDetail("Le parcours n'a pas pu être enregistré.", error);
}
