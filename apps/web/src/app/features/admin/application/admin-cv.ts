import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { catchError, map, of } from 'rxjs';
import type { CvInfo } from '../domain/models/cv.model';
import { API_BASE_URL } from '../../../shared/api/api-config';

@Component({
  selector: 'app-admin-cv',
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div>
      <h1 class="text-2xl font-bold text-foreground mb-8">Gestion du CV</h1>

      @if (cv()) {
        <!-- Current CV -->
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
          <div class="mt-4">
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

      <!-- Upload form -->
      <div class="bg-background border border-foreground/10 rounded-2xl p-6 shadow-lg">
        <h2 class="text-lg font-semibold text-foreground mb-4">
          {{ cv() ? 'Mettre à jour le CV' : 'Upload nouveau CV' }}
        </h2>
        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-4">
          <div>
            <label for="fileName" class="block text-sm font-medium text-foreground mb-1.5"
              >Nom du fichier</label
            >
            <input
              id="fileName"
              type="text"
              formControlName="fileName"
              class="w-full px-4 py-2.5 rounded-lg bg-foreground/5 border border-foreground/20 text-foreground placeholder-muted focus:border-primary focus:outline-none transition-colors"
              placeholder="CV_NOM_PRENOM.pdf"
            />
          </div>
          <div>
            <label for="fileUrl" class="block text-sm font-medium text-foreground mb-1.5"
              >URL du fichier</label
            >
            <input
              id="fileUrl"
              type="text"
              formControlName="fileUrl"
              class="w-full px-4 py-2.5 rounded-lg bg-foreground/5 border border-foreground/20 text-foreground placeholder-muted focus:border-primary focus:outline-none transition-colors"
              placeholder="/docs/mon-cv.pdf"
            />
          </div>
          <div>
            <label for="fileSize" class="block text-sm font-medium text-foreground mb-1.5"
              >Taille (octets)</label
            >
            <input
              id="fileSize"
              type="number"
              formControlName="fileSize"
              class="w-full px-4 py-2.5 rounded-lg bg-foreground/5 border border-foreground/20 text-foreground placeholder-muted focus:border-primary focus:outline-none transition-colors"
            />
          </div>
          <button
            type="submit"
            [disabled]="form.invalid"
            class="px-6 py-2.5 rounded-lg bg-primary text-white font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {{ cv() ? 'Mettre à jour' : 'Enregistrer' }}
          </button>
        </form>
      </div>
    </div>
  `,
})
export class AdminCv {
  private readonly http = inject(HttpClient);
  private readonly fb = inject(FormBuilder);

  readonly cv = signal<CvInfo | null>(null);

  readonly form = this.fb.nonNullable.group({
    fileName: ['', Validators.required],
    fileUrl: ['', Validators.required],
    fileSize: [0, Validators.required],
  });

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
    return `${(bytes / 1024).toFixed(0)} Ko`;
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    const values = this.form.getRawValue();
    const existing = this.cv();

    const payload = {
      ...values,
      uploadedAt: new Date().toISOString(),
      downloads: existing?.downloads ?? 0,
    };

    const request$ = existing
      ? this.http.patch<CvInfo>(`${API_BASE_URL}/cv/${existing.id}`, payload)
      : this.http.post<CvInfo>(`${API_BASE_URL}/cv`, payload);

    request$.subscribe(() => {
      this.form.reset();
      this.loadCv();
    });
  }

  deleteCv(): void {
    const existing = this.cv();
    if (!existing) return;
    this.http.delete(`${API_BASE_URL}/cv/${existing.id}`).subscribe(() => {
      this.loadCv();
    });
  }

  private loadCv(): void {
    this.http
      .get<CvInfo[]>(`${API_BASE_URL}/cv`)
      .pipe(
        map((data) => data[0] ?? null),
        catchError(() => of(null)),
      )
      .subscribe((cv) => this.cv.set(cv));
  }
}
