import {
  Component,
  inject,
  signal,
  computed,
  viewChild,
  ChangeDetectionStrategy,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { firstValueFrom } from 'rxjs';
import { CvGateway } from '@features/cv/domain/gateways/cv.gateway';
import { ToastStore } from '@shared/ui/toast-store';
import { FileDropzone } from '@shared/ui/file-dropzone';
import { Button } from '@shared/ui/button';
import { ConfirmDialog } from '@shared/ui/confirm-dialog';
import { LoadError } from '@shared/ui/load-error';
import { loadState } from '@shared/ui/load-state';
import { AppSkeleton } from '@shared/ui/skeleton';
import { extractErrorMessage } from '@shared/api/extract-error-message';
import { AdminPageHeader } from './components/admin-page-header';
import { cvOverline } from './admin-page-copy';

@Component({
  selector: 'app-admin-cv',
  imports: [FileDropzone, Button, ConfirmDialog, LoadError, AppSkeleton, AdminPageHeader],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <app-admin-page-header [overline]="overline()" heading="CV">
      Le PDF servi par le bouton «&nbsp;Télécharger le CV&nbsp;» du site. Un nouveau fichier
      remplace l'ancien, qui reste versionné.
    </app-admin-page-header>

    @let current = cv();
    @let state = cvState();
    @if (state === 'loading') {
      <div data-testid="admin-cv-loading" role="status" class="mb-8">
        <span class="sr-only">Chargement du CV…</span>
        <app-skeleton class="block h-40 rounded-2xl" />
      </div>
    } @else if (state === 'error') {
      <app-load-error
        message="Le CV n'a pas pu être chargé. Vérifiez votre connexion, puis réessayez."
        (retry)="cvResource.reload()"
      />
    } @else if (current) {
      <div
        data-testid="admin-cv-current"
        class="bg-surface border border-foreground/10 rounded-2xl p-6 mb-8"
      >
        <h2 class="text-lg font-semibold text-foreground mb-4">CV actuel</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div class="min-w-0">
            <p class="text-xs text-muted mb-1">Fichier</p>
            <p class="text-sm text-foreground font-medium break-all">{{ current.fileName }}</p>
          </div>
          <div>
            <p data-testid="admin-cv-uploaded-at-label" class="text-xs text-muted mb-1">
              Mis en ligne le
            </p>
            <p class="text-sm text-foreground">{{ formattedDate() }}</p>
          </div>
          <div>
            <p class="text-xs text-muted mb-1">Taille</p>
            <p class="text-sm text-foreground">{{ formattedFileSize() }}</p>
          </div>
        </div>
        <div class="flex flex-wrap gap-3 mt-4">
          <a
            data-testid="admin-cv-view"
            [href]="downloadUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex min-h-11 items-center px-4 py-2 text-sm rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
          >
            Voir le CV <span class="sr-only">(nouvel onglet)</span>
          </a>
          <button
            type="button"
            data-testid="admin-cv-delete"
            (click)="deletionPending.set(true)"
            class="inline-flex min-h-11 items-center px-4 py-2 text-sm rounded-lg bg-status-error/10 text-status-error hover:bg-status-error/20 transition-colors"
          >
            Supprimer le CV
          </button>
        </div>
      </div>
    } @else {
      <div
        data-testid="admin-cv-empty"
        class="bg-surface border border-foreground/10 rounded-2xl p-6 mb-8"
      >
        <p class="text-muted text-sm">Aucun CV en ligne</p>
      </div>
    }

    @if (state === 'empty' || state === 'ready') {
      <div class="bg-surface border border-foreground/10 rounded-2xl p-6">
        <h2 class="text-lg font-semibold text-foreground mb-4">
          {{ current ? 'Remplacer le CV' : 'Mettre un CV en ligne' }}
        </h2>

        <app-file-dropzone
          accept="application/pdf"
          label="Fichier PDF"
          helperText="PDF uniquement, sera versionné dans S3"
          (fileSelected)="selectCvFile($event)"
          (cleared)="clearSelection()"
        />

        @if (selectedFile()) {
          <div class="flex gap-4 mt-4">
            <app-button
              severity="primary"
              data-testid="admin-cv-upload"
              [disabled]="isUploading()"
              (click)="uploadCv()"
            >
              @if (isUploading()) {
                Mise en ligne…
              } @else {
                Mettre en ligne
              }
            </app-button>
            <app-button severity="secondary" variant="outlined" (click)="clearSelection()">
              Annuler
            </app-button>
          </div>
        }
      </div>
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
  private readonly _toast = inject(ToastStore);
  private readonly _pageHeader = viewChild.required(AdminPageHeader);

  protected readonly cvResource = rxResource({ stream: () => this._cvService.getCurrent() });
  protected readonly cv = computed(() =>
    this.cvResource.hasValue() ? this.cvResource.value() : null,
  );
  protected readonly cvState = computed(() => loadState(this.cvResource, () => this.cv() === null));
  protected readonly overline = computed(() =>
    this.cvResource.hasValue() ? cvOverline(this.cvResource.value()) : '',
  );
  protected readonly deletionPending = signal(false);
  protected readonly deletionHeading = 'Retirer le CV du site\u202f?';
  protected readonly selectedFile = signal<File | null>(null);
  protected readonly isUploading = signal(false);
  protected readonly downloadUrl = this._cvService.getDownloadUrl();

  protected readonly formattedDate = computed(() => {
    const cv = this.cv();
    return cv ? this.formatDate(cv.uploadedAt) : '';
  });

  protected readonly formattedFileSize = computed(() => {
    const cv = this.cv();
    return cv ? this.formatSize(cv.fileSize) : '';
  });

  protected readonly formattedSelectedSize = computed(() => {
    const file = this.selectedFile();
    return file ? this.formatSize(file.size) : '';
  });

  private formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }

  private formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} o`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
  }

  protected selectCvFile(file: File): void {
    if (file.type === 'application/pdf') {
      this.selectFile(file);
    } else {
      this._toast.add({
        severity: 'error',
        summary: 'Erreur',
        detail: 'Seuls les fichiers PDF sont acceptés.',
      });
    }
  }

  clearSelection(): void {
    this.selectedFile.set(null);
  }

  async uploadCv(): Promise<void> {
    const file = this.selectedFile();
    if (!file) return;

    this.isUploading.set(true);

    try {
      await firstValueFrom(this._cvService.upload(file));
      this._toast.add({
        severity: 'success',
        summary: 'Succès',
        detail: 'CV mis en ligne',
      });
      this.clearSelection();
      this.cvResource.reload();
    } catch (err: unknown) {
      const message = extractErrorMessage(err);
      this._toast.add({
        severity: 'error',
        summary: 'Erreur',
        detail: `Échec de la mise en ligne\u00a0: ${message}`,
      });
    } finally {
      this.isUploading.set(false);
    }
  }

  protected confirmDeletion(): void {
    this.deletionPending.set(false);
    this._pageHeader().focusTitle();
    void this.deleteCv();
  }

  async deleteCv(): Promise<void> {
    try {
      await firstValueFrom(this._cvService.delete());
      this._toast.add({ severity: 'success', summary: 'Succès', detail: 'CV supprimé' });
      this.cvResource.reload();
    } catch (err: unknown) {
      const message = extractErrorMessage(err);
      this._toast.add({
        severity: 'error',
        summary: 'Erreur',
        detail: `Erreur de suppression : ${message}`,
      });
    }
  }

  private selectFile(file: File): void {
    this.selectedFile.set(file);
  }
}
