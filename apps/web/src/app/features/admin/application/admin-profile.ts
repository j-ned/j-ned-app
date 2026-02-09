import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { switchMap } from 'rxjs';
import { PROFILE_GATEWAY } from '../../profile/domain';

@Component({
  selector: 'app-admin-profile',
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <h1 class="text-2xl font-bold text-foreground mb-8">Profil</h1>

    <form [formGroup]="form" (ngSubmit)="onSubmit()" class="max-w-2xl space-y-6">
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
          @if (imagePreview()) {
            <div class="relative w-full">
              <img
                [src]="imagePreview()"
                alt="Aperçu avatar"
                class="w-full max-h-56 object-contain rounded-lg"
              />
              <div
                class="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 rounded-lg transition-opacity"
              >
                <span class="text-white text-sm font-medium">Changer l'avatar</span>
              </div>
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
              <p class="text-sm font-medium">Glissez une image ici</p>
              <p class="text-xs mt-1">ou cliquez pour parcourir</p>
            </div>
          }
        </div>
        <input
          #fileInput
          type="file"
          accept="image/*"
          (change)="onFileSelected($event)"
          class="hidden"
        />
      </div>

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
export class AdminProfile implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly profileGateway = inject(PROFILE_GATEWAY);

  readonly selectedFile = signal<File | null>(null);
  readonly imagePreview = signal('');
  readonly isDragging = signal(false);
  private profileId = 1;

  readonly form = this.fb.nonNullable.group({
    displayName: ['', Validators.required],
    location: ['', Validators.required],
    isAvailable: [false],
    availabilityMessage: [''],
  });

  ngOnInit(): void {
    this.profileGateway.getProfileInfoForEdit().subscribe((profile) => {
      this.profileId = profile.id;
      this.imagePreview.set(profile.avatarUrl);
      this.form.patchValue({
        displayName: profile.displayName,
        location: profile.location,
        isAvailable: profile.isAvailable,
        availabilityMessage: profile.availabilityMessage,
      });
    });
  }

  onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) this.selectFile(file);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(false);
    const file = event.dataTransfer?.files[0];
    if (file?.type.startsWith('image/')) this.selectFile(file);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(false);
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
        )
        .subscribe(() => this.router.navigate(['/admin/about']));
    } else {
      this.profileGateway
        .updateProfileInfo({ id: this.profileId, ...values })
        .subscribe(() => this.router.navigate(['/admin/about']));
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
