import { Component, DestroyRef, inject, signal, effect, ChangeDetectionStrategy } from '@angular/core';
import { takeUntilDestroyed, rxResource } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { switchMap } from 'rxjs';
import { PROFILE_GATEWAY } from '@features/profile/application';
import { ToastService } from '@shared/toast';
import { FileDropZone } from '@shared/file-drop-zone';
import { API_BASE_URL } from '@shared/api';

@Component({
  selector: 'app-admin-profile',
  imports: [ReactiveFormsModule, FileDropZone],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <h1 class="text-2xl font-bold text-foreground mb-8">Profil</h1>

    <form [formGroup]="form" (ngSubmit)="onSubmit()" class="max-w-2xl space-y-6">
      <fieldset class="space-y-6 border-0 p-0 m-0">
        <legend class="sr-only">Informations du profil</legend>

        <div>
          <label for="displayName" class="block text-sm font-medium text-foreground mb-1.5"
            >Nom affiché</label
          >
          <input
            id="displayName"
            type="text"
            formControlName="displayName"
            class="w-full px-4 py-2.5 rounded-lg bg-foreground/5 border border-foreground/20 text-foreground placeholder-muted focus:border-primary focus:outline-none transition-colors"
          />
          @if (form.controls.displayName.touched && form.controls.displayName.errors?.['required']) {
            <span class="text-red-400 text-xs mt-1 block">Ce champ est obligatoire</span>
          }
        </div>

        <div>
          <label for="location" class="block text-sm font-medium text-foreground mb-1.5"
            >Localisation</label
          >
          <input
            id="location"
            type="text"
            formControlName="location"
            class="w-full px-4 py-2.5 rounded-lg bg-foreground/5 border border-foreground/20 text-foreground placeholder-muted focus:border-primary focus:outline-none transition-colors"
          />
          @if (form.controls.location.touched && form.controls.location.errors?.['required']) {
            <span class="text-red-400 text-xs mt-1 block">Ce champ est obligatoire</span>
          }
        </div>

        <div class="flex items-center gap-2">
          <input
            id="isAvailable"
            type="checkbox"
            formControlName="isAvailable"
            class="w-4 h-4 rounded border-foreground/20 text-primary focus:ring-primary"
          />
          <label for="isAvailable" class="text-sm font-medium text-foreground">Disponible</label>
        </div>

        <div>
          <label for="availabilityMessage" class="block text-sm font-medium text-foreground mb-1.5"
            >Message de disponibilité</label
          >
          <input
            id="availabilityMessage"
            type="text"
            formControlName="availabilityMessage"
            class="w-full px-4 py-2.5 rounded-lg bg-foreground/5 border border-foreground/20 text-foreground placeholder-muted focus:border-primary focus:outline-none transition-colors"
          />
        </div>

        <div>
          <span class="block text-sm font-medium text-foreground mb-1.5">Avatar</span>
          <app-file-drop-zone
            [preview]="imagePreview()"
            previewAlt="Aperçu avatar"
            changeLabel="Changer l'avatar"
            (fileSelected)="onFileSelected($event)"
          />
        </div>
      </fieldset>

      <div class="flex gap-4 pt-4">
        <button
          type="submit"
          [disabled]="form.invalid"
          class="px-6 py-2.5 rounded-lg bg-primary text-white font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Enregistrer
        </button>
        <button
          type="button"
          (click)="cancel()"
          class="px-6 py-2.5 rounded-lg bg-foreground/5 text-foreground font-medium hover:bg-foreground/10 transition-colors"
        >
          Annuler
        </button>
      </div>
    </form>
  `,
})
export class AdminProfile {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly apiUrl = inject(API_BASE_URL);
  private readonly profileGateway = inject(PROFILE_GATEWAY);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  readonly selectedFile = signal<File | null>(null);
  readonly imagePreview = signal('');
  private profileId = '';

  readonly form = this.fb.nonNullable.group({
    displayName: ['', Validators.required],
    location: ['', Validators.required],
    isAvailable: [false],
    availabilityMessage: [''],
  });

  private readonly editData = rxResource({
    stream: () => this.profileGateway.getProfileInfoForEdit(),
  });

  private readonly patchForm = effect(() => {
    const profile = this.editData.value();
    if (profile) {
      this.profileId = profile.id;
      const url = profile.avatarUrl;
      this.imagePreview.set(url.startsWith('http') ? url : `${this.apiUrl}${url}`);
      this.form.patchValue({
        displayName: profile.displayName,
        location: profile.location,
        isAvailable: profile.isAvailable,
        availabilityMessage: profile.availabilityMessage,
      });
    }
  });

  onFileSelected(file: File): void {
    if (file.type.startsWith('image/')) this.selectFile(file);
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    const values = this.form.getRawValue();
    const file = this.selectedFile();

    if (file) {
      this.profileGateway
        .uploadAvatar(file)
        .pipe(
          switchMap((avatarUrl) =>
            this.profileGateway.updateProfileInfo({
              id: this.profileId,
              ...values,
              avatarUrl,
            }),
          ),
          takeUntilDestroyed(this.destroyRef),
        )
        .subscribe({
          next: () => {
            this.toast.success('Profil mis à jour');
            this.router.navigate(['/admin/about']);
          },
          error: () => this.toast.error("Erreur lors de l'enregistrement"),
        });
    } else {
      this.profileGateway
        .updateProfileInfo({ id: this.profileId, ...values })
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.toast.success('Profil mis à jour');
            this.router.navigate(['/admin/about']);
          },
          error: () => this.toast.error("Erreur lors de l'enregistrement"),
        });
    }
  }

  cancel(): void {
    this.router.navigate(['/admin/about']);
  }

  private selectFile(file: File): void {
    this.selectedFile.set(file);
    this.imagePreview.set(URL.createObjectURL(file));
  }
}
