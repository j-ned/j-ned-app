import { Component, inject, signal, computed, viewChild } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { firstValueFrom } from 'rxjs';
import { dateRangeToParams } from '@features/analytics/domain/analytics-presenter';
import { AnalyticsGateway } from '@features/analytics/domain/gateways/analytics.gateway';
import { CvGateway } from '@features/cv/domain/gateways/cv.gateway';
import { AppIcon } from '@shared/icons/app-icon';
import { ToastStore } from '@core/notifications/toast-store';
import { FileDropzone } from '@shared/ui/file-dropzone';
import { Button } from '@shared/ui/button';
import { Cartouche } from '@shared/ui/cartouche';
import { ConfirmDialog } from '@shared/ui/confirm-dialog';
import { LoadError } from '@shared/ui/load-error';
import { loadState } from '@shared/ui/load-state';
import { AppSkeleton } from '@shared/ui/skeleton';
import { extractErrorMessage } from '@shared/api/extract-error-message';
import { AdminEmptyState } from '../../application/components/admin-empty-state';
import { AdminPageHeader } from '../../application/components/admin-page-header';
import { AdminSectionHead } from '../../application/components/admin-section-head';
import { cvOverline } from '../../application/admin-page-copy';
import { toCvRows } from '../../application/admin-cv-view';

@Component({
  selector: 'app-admin-cv',
  imports: [
    AppIcon,
    FileDropzone,
    Button,
    Cartouche,
    ConfirmDialog,
    LoadError,
    AppSkeleton,
    AdminEmptyState,
    AdminPageHeader,
    AdminSectionHead,
  ],
  host: { class: 'block' },
  template: `
    @let current = cv();
    @let state = cvState();
    <app-admin-page-header [overline]="overline()" heading="CV">
      Le PDF servi par le bouton «&nbsp;Télécharger le CV&nbsp;» du site. Un nouveau fichier
      remplace l'ancien, qui reste versionné.
      @if (current) {
        <app-cartouche
          adminPageAside
          title="CV en ligne"
          [reference]="current.fileName"
          [rows]="rows()"
        />
      }
    </app-admin-page-header>

    @if (state === 'loading') {
      <div data-testid="admin-cv-loading" role="status">
        <span class="sr-only">Chargement du CV…</span>
        <app-skeleton class="block h-40 rounded-sm" />
      </div>
    } @else if (state === 'error') {
      <app-load-error
        message="Le CV n'a pas pu être chargé. Vérifiez votre connexion, puis réessayez."
        (retry)="cvResource.reload()"
      />
    } @else if (current) {
      <div data-testid="admin-cv-current" class="flex flex-wrap items-center gap-2.5">
        <a
          appButton
          variant="outlined"
          data-testid="admin-cv-view"
          [href]="downloadUrl"
          target="_blank"
          rel="noopener noreferrer"
        >
          <app-icon name="external-link" [size]="16" />
          Ouvrir le PDF<span class="sr-only"> (nouvel onglet)</span>
        </a>
        <button
          appButton
          type="button"
          variant="text-danger"
          data-testid="admin-cv-delete"
          (click)="deletionPending.set(true)"
        >
          Retirer le CV du site…
        </button>
      </div>
    } @else {
      <app-admin-empty-state stamp="Aucun CV">
        <p>
          Le bouton «&nbsp;Télécharger le CV&nbsp;» n'apparaît pas sur le site tant qu'aucun PDF
          n'est en ligne.
        </p>
      </app-admin-empty-state>
    }

    @if (state === 'empty' || state === 'ready') {
      <section class="mt-12" aria-labelledby="admin-cv-upload-heading">
        <app-admin-section-head
          [heading]="current ? 'Remplacer le fichier' : 'Mettre un CV en ligne'"
          headingId="admin-cv-upload-heading"
        />

        <app-file-dropzone
          class="mt-5"
          accept="application/pdf"
          label="Fichier PDF"
          helperText="PDF uniquement, versionné à chaque envoi"
          [resetToken]="dropzoneResetToken()"
          (fileSelected)="selectCvFile($event)"
          (cleared)="clearSelection()"
        />

        @if (selectedFile()) {
          <div class="mt-4 flex flex-wrap gap-2.5">
            <button
              appButton
              type="button"
              data-testid="admin-cv-upload"
              [disabled]="isUploading()"
              (click)="uploadCv()"
            >
              @if (isUploading()) {
                Mise en ligne…
              } @else {
                Mettre en ligne
              }
            </button>
            <button appButton type="button" variant="outlined" (click)="clearSelection()">
              Annuler
            </button>
          </div>
        }
      </section>
    }

    <app-confirm-dialog
      [open]="deletionPending()"
      [heading]="deletionHeading"
      confirmLabel="Retirer le CV"
      (confirmed)="confirmDeletion()"
      (cancelled)="deletionPending.set(false)"
    >
      <p>Le bouton de téléchargement du CV disparaît du site. Cette action est définitive.</p>
    </app-confirm-dialog>
  `,
})
export class AdminCv {
  private readonly _cvService = inject(CvGateway);
  private readonly _analytics = inject(AnalyticsGateway);
  private readonly _toast = inject(ToastStore);
  private readonly _pageHeader = viewChild.required(AdminPageHeader);

  private readonly _period = dateRangeToParams('30d', new Date());

  protected readonly cvResource = rxResource({ stream: () => this._cvService.getCurrent() });
  private readonly _downloadsResource = rxResource({
    stream: () => this._analytics.getCvDownloadCount(this._period.startDate, this._period.endDate),
  });
  protected readonly cv = computed(() =>
    this.cvResource.hasValue() ? this.cvResource.value() : null,
  );
  protected readonly cvState = computed(() => loadState(this.cvResource, () => this.cv() === null));
  protected readonly overline = computed(() =>
    this.cvResource.hasValue() ? cvOverline(this.cvResource.value()) : '',
  );
  protected readonly rows = computed(() => {
    const cv = this.cv();
    if (cv === null) return [];
    const downloads = this._downloadsResource.hasValue() ? this._downloadsResource.value() : null;
    return toCvRows(cv, downloads);
  });
  protected readonly deletionPending = signal(false);
  protected readonly deletionHeading = 'Retirer le CV du site\u202f?';
  protected readonly selectedFile = signal<File | null>(null);
  protected readonly isUploading = signal(false);
  protected readonly dropzoneResetToken = signal(0);
  protected readonly downloadUrl = this._cvService.getDownloadUrl();

  protected selectCvFile(file: File): void {
    if (file.type === 'application/pdf') {
      this.selectedFile.set(file);
    } else {
      this.clearSelection();
      this.dropzoneResetToken.update((token) => token + 1);
      this._toast.add({ severity: 'error', detail: 'Seuls les fichiers PDF sont acceptés.' });
    }
  }

  protected clearSelection(): void {
    this.selectedFile.set(null);
  }

  protected async uploadCv(): Promise<void> {
    const file = this.selectedFile();
    if (!file) return;

    this.isUploading.set(true);

    try {
      await firstValueFrom(this._cvService.upload(file));
      this._toast.add({ severity: 'success', detail: 'CV mis en ligne' });
      this.clearSelection();
      this.dropzoneResetToken.update((token) => token + 1);
      this.cvResource.reload();
    } catch (err: unknown) {
      const message = extractErrorMessage(err);
      this._toast.add({ severity: 'error', detail: `Échec de la mise en ligne\u00a0: ${message}` });
    } finally {
      this.isUploading.set(false);
    }
  }

  protected confirmDeletion(): void {
    this.deletionPending.set(false);
    this._pageHeader().focusTitle();
    void this.deleteCv();
  }

  private async deleteCv(): Promise<void> {
    try {
      await firstValueFrom(this._cvService.delete());
      this._toast.add({ severity: 'success', detail: 'CV supprimé' });
      this.cvResource.reload();
    } catch (err: unknown) {
      const message = extractErrorMessage(err);
      this._toast.add({ severity: 'error', detail: `Erreur de suppression\u00a0: ${message}` });
    }
  }
}
