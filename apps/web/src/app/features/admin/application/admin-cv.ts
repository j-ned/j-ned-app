import {
  Component,
  inject,
  signal,
  computed,
  viewChild,
  ChangeDetectionStrategy,
} from '@angular/core';
import type { CvInfo } from '../domain/models/cv.model';
import { CvService } from '@shared/cv';
import { ToastService } from '@shared/ui';
import { FileUpload } from 'primeng/fileupload';

@Component({
  selector: 'app-admin-cv',
  imports: [FileUpload],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <h1 class="text-2xl font-bold text-foreground mb-8">Gestion du CV</h1>

    @if (cv()) {
      <div class="bg-surface border border-foreground/10 rounded-2xl p-6 shadow-lg mb-8">
        <h2 class="text-lg font-semibold text-foreground mb-4">CV actuel</h2>
        <div class="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <p class="text-xs text-muted mb-1">Fichier</p>
            <p class="text-sm text-foreground font-medium">{{ cv()!.fileName }}</p>
          </div>
          <div>
            <p class="text-xs text-muted mb-1">Date d'upload</p>
            <p class="text-sm text-foreground">{{ formattedDate() }}</p>
          </div>
          <div>
            <p class="text-xs text-muted mb-1">Taille</p>
            <p class="text-sm text-foreground">{{ formattedFileSize() }}</p>
          </div>
        </div>
        <div class="flex gap-3 mt-4">
          <a
            [href]="downloadUrl"
            target="_blank"
            class="px-4 py-2 text-xs rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
          >
            Voir le CV
          </a>
          <button
            (click)="deleteCv()"
            class="px-4 py-2 text-xs rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
          >
            Supprimer le CV
          </button>
        </div>
      </div>
    } @else {
      <div class="bg-surface border border-foreground/10 rounded-2xl p-6 shadow-lg mb-8">
        <p class="text-muted text-sm">Aucun CV uploadé</p>
      </div>
    }

    <div class="bg-surface border border-foreground/10 rounded-2xl p-6 shadow-lg">
      <h2 class="text-lg font-semibold text-foreground mb-4">
        {{ cv() ? 'Mettre à jour le CV' : 'Upload nouveau CV' }}
      </h2>

      <p-fileupload
        #fileUpload
        mode="advanced"
        [auto]="false"
        [showUploadButton]="false"
        [showCancelButton]="false"
        [multiple]="false"
        accept="application/pdf"
        chooseLabel="Choisir un fichier PDF"
        (onSelect)="onFileSelected($event.files[0])"
        (onClear)="clearSelection()"
      />

      @if (selectedFile()) {
        <div class="flex gap-4 mt-4">
          <button
            (click)="uploadCv()"
            [disabled]="isUploading()"
            class="px-6 py-2.5 rounded-lg bg-primary text-white font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            @if (isUploading()) {
              Upload en cours...
            } @else {
              Uploader
            }
          </button>
          <button
            type="button"
            (click)="clearSelection()"
            class="px-6 py-2.5 rounded-lg bg-foreground/5 text-foreground font-medium hover:bg-foreground/10 transition-colors"
          >
            Annuler
          </button>
        </div>
      }
    </div>
  `,
})
export class AdminCv {
  private readonly cvService = inject(CvService);
  private readonly toast = inject(ToastService);
  private readonly fileUpload = viewChild<FileUpload>('fileUpload');

  readonly cv = signal<CvInfo | null>(null);
  readonly selectedFile = signal<File | null>(null);
  readonly isUploading = signal(false);
  readonly downloadUrl = this.cvService.getDownloadUrl();

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

  constructor() {
    this.loadCv();
  }

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

  onFileSelected(file: File): void {
    if (file.type === 'application/pdf') {
      this.selectFile(file);
    } else {
      this.toast.add({
        severity: 'error',
        summary: 'Erreur',
        detail: 'Seuls les fichiers PDF sont acceptés.',
      });
    }
  }

  clearSelection(): void {
    this.selectedFile.set(null);
    this.fileUpload()?.clear();
  }

  async uploadCv(): Promise<void> {
    const file = this.selectedFile();
    if (!file) return;

    this.isUploading.set(true);

    try {
      await this.cvService.upload(file);
      this.toast.add({
        severity: 'success',
        summary: 'Succès',
        detail: 'CV uploadé avec succès !',
      });
      this.clearSelection();
      this.loadCv();
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : ((err as { error?: { message?: string } })?.error?.message ?? 'Erreur inconnue');
      this.toast.add({
        severity: 'error',
        summary: 'Erreur',
        detail: `Erreur d'upload : ${message}`,
      });
    } finally {
      this.isUploading.set(false);
    }
  }

  async deleteCv(): Promise<void> {
    try {
      await this.cvService.delete();
      this.toast.add({ severity: 'success', summary: 'Succès', detail: 'CV supprimé' });
      this.loadCv();
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : ((err as { error?: { message?: string } })?.error?.message ?? 'Erreur inconnue');
      this.toast.add({
        severity: 'error',
        summary: 'Erreur',
        detail: `Erreur de suppression : ${message}`,
      });
    }
  }

  private selectFile(file: File): void {
    this.selectedFile.set(file);
  }

  private loadCv(): void {
    this.cvService.getCurrent().then((data) => {
      this.cv.set(data);
    });
  }
}
