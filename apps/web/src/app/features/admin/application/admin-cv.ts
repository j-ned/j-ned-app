import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import type { CvInfo } from '../domain/models/cv.model';
import { SupabaseClientService } from '../../../shared/supabase/supabase-client';
import { toCamelCase } from '../../../shared/supabase/column-mapper';

@Component({
  selector: 'app-admin-cv',
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <h1 class="text-2xl font-bold text-foreground mb-8">Gestion du CV</h1>

    @if (cv()) {
      <div class="bg-background border border-foreground/10 rounded-2xl p-6 shadow-lg mb-8">
        <h2 class="text-lg font-semibold text-foreground mb-4">CV actuel</h2>
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <p class="text-xs text-muted mb-1">Fichier</p>
            <p class="text-sm text-foreground font-medium">{{ cv()!.fileName }}</p>
          </div>
          <div>
            <p class="text-xs text-muted mb-1">Date d'upload</p>
            <p class="text-sm text-foreground">{{ formatDate(cv()!.uploadedAt) }}</p>
          </div>
          <div>
            <p class="text-xs text-muted mb-1">Taille</p>
            <p class="text-sm text-foreground">{{ formatSize(cv()!.fileSize) }}</p>
          </div>
          <div>
            <p class="text-xs text-muted mb-1">Téléchargements</p>
            <p class="text-sm text-foreground font-medium">{{ cv()!.downloads }}</p>
          </div>
        </div>
        <div class="flex gap-3 mt-4">
          <a
            [href]="cv()!.fileUrl"
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
      <div class="bg-background border border-foreground/10 rounded-2xl p-6 shadow-lg mb-8">
        <p class="text-muted text-sm">Aucun CV uploadé</p>
      </div>
    }

    <div class="bg-background border border-foreground/10 rounded-2xl p-6 shadow-lg">
      <h2 class="text-lg font-semibold text-foreground mb-4">
        {{ cv() ? 'Mettre à jour le CV' : 'Upload nouveau CV' }}
      </h2>

      <div
        role="button"
        tabindex="0"
        (drop)="onDrop($event)"
        (dragover)="onDragOver($event)"
        (dragleave)="onDragLeave($event)"
        (click)="fileInput.click()"
        (keydown.enter)="fileInput.click()"
        (keydown.space)="fileInput.click()"
        [class]="
          'relative flex flex-col items-center justify-center w-full rounded-lg border-2 border-dashed cursor-pointer transition-colors ' +
          (isDragging()
            ? 'border-primary bg-primary/10'
            : 'border-foreground/20 bg-foreground/5 hover:border-primary/50 hover:bg-foreground/10')
        "
      >
        @if (selectedFile()) {
          <div class="flex flex-col items-center py-8 text-foreground">
            <svg class="w-10 h-10 mb-3 text-primary" aria-hidden="true">
              <use href="/icons/sprite.svg#lucide-file-text" />
            </svg>
            <p class="text-sm font-medium">{{ selectedFile()!.name }}</p>
            <p class="text-xs text-muted mt-1">{{ formatSize(selectedFile()!.size) }}</p>
          </div>
        } @else {
          <div class="flex flex-col items-center py-8 text-muted">
            <svg class="w-10 h-10 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="1.5"
                d="M12 16V4m0 0l-4 4m4-4l4 4M4 20h16"
              />
            </svg>
            <p class="text-sm font-medium">Glissez un fichier PDF ici</p>
            <p class="text-xs mt-1">ou cliquez pour parcourir</p>
          </div>
        }
      </div>
      <input
        #fileInput
        type="file"
        accept=".pdf"
        (change)="onFileSelected($event)"
        class="hidden"
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

      @if (errorMessage()) {
        <p class="mt-3 text-sm text-red-400">{{ errorMessage() }}</p>
      }
      @if (successMessage()) {
        <p class="mt-3 text-sm text-green-400">{{ successMessage() }}</p>
      }
    </div>
  `,
})
export class AdminCv {
  private readonly supabase = inject(SupabaseClientService);

  readonly cv = signal<CvInfo | null>(null);
  readonly selectedFile = signal<File | null>(null);
  readonly isDragging = signal(false);
  readonly isUploading = signal(false);
  readonly errorMessage = signal('');
  readonly successMessage = signal('');

  constructor() {
    this.loadCv();
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }

  formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} o`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
  }

  onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) this.selectFile(file);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(false);
    const file = event.dataTransfer?.files[0];
    if (file?.type === 'application/pdf') {
      this.selectFile(file);
    } else {
      this.errorMessage.set('Seuls les fichiers PDF sont acceptés.');
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(false);
  }

  clearSelection(): void {
    this.selectedFile.set(null);
    this.errorMessage.set('');
    this.successMessage.set('');
  }

  async uploadCv(): Promise<void> {
    const file = this.selectedFile();
    if (!file) return;

    this.isUploading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    const path = file.name;

    const { error: uploadError } = await this.supabase.client.storage
      .from('cv_portfolio')
      .upload(path, file, { upsert: true });

    if (uploadError) {
      this.errorMessage.set(`Erreur d'upload : ${uploadError.message}`);
      this.isUploading.set(false);
      return;
    }

    const publicUrl = this.supabase.client.storage.from('cv_portfolio').getPublicUrl(path)
      .data.publicUrl;

    const existing = this.cv();
    const payload = {
      file_name: file.name,
      file_url: publicUrl,
      file_size: file.size,
      uploaded_at: new Date().toISOString(),
      downloads: existing?.downloads ?? 0,
    };

    const { error: dbError } = existing
      ? await this.supabase.client.from('cv_info').update(payload).eq('id', existing.id)
      : await this.supabase.client.from('cv_info').insert(payload);

    this.isUploading.set(false);

    if (dbError) {
      this.errorMessage.set(`Erreur de sauvegarde : ${dbError.message}`);
      return;
    }

    this.successMessage.set('CV uploadé avec succès !');
    this.selectedFile.set(null);
    this.loadCv();
  }

  async deleteCv(): Promise<void> {
    const existing = this.cv();
    if (!existing) return;

    await this.supabase.client.storage.from('cv_portfolio').remove([existing.fileName]);
    await this.supabase.client.from('cv_info').delete().eq('id', existing.id);
    this.loadCv();
  }

  private selectFile(file: File): void {
    this.errorMessage.set('');
    this.successMessage.set('');
    this.selectedFile.set(file);
  }

  private loadCv(): void {
    this.supabase.client
      .from('cv_info')
      .select('*')
      .limit(1)
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          this.cv.set(null);
        } else {
          this.cv.set(toCamelCase<CvInfo>(data));
        }
      });
  }
}
