import {
  Component,
  DestroyRef,
  inject,
  signal,
  effect,
  ChangeDetectionStrategy,
} from '@angular/core';
import { takeUntilDestroyed, rxResource } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { switchMap } from 'rxjs';
import { PROFILE_GATEWAY } from '@features/profile/application';
import { MessageService } from 'primeng/api';
import { Button } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { Message } from 'primeng/message';
import { FileUpload } from 'primeng/fileupload';
import { API_BASE_URL } from '@shared/api';

@Component({
  selector: 'app-admin-profile',
  imports: [ReactiveFormsModule, FileUpload, Button, InputText, Message],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <h1 class="text-2xl font-bold text-foreground mb-8">Profil</h1>

    <form [formGroup]="form" (ngSubmit)="onSubmit()" class="max-w-2xl space-y-6">
      <fieldset class="space-y-6 border-0 p-0 m-0">
        <legend class="sr-only">Informations du profil</legend>

        <div>
          <label for="displayName" class="text-sm font-medium text-foreground">Nom affiché</label>
          <input id="displayName" type="text" formControlName="displayName" pInputText fluid />
          @if (
            form.controls.displayName.touched && form.controls.displayName.errors?.['required']
          ) {
            <p-message
              severity="error"
              text="Ce champ est obligatoire"
              size="small"
              variant="simple"
            />
          }
        </div>

        <div>
          <label for="location" class="text-sm font-medium text-foreground">Localisation</label>
          <input id="location" type="text" formControlName="location" pInputText fluid />
          @if (form.controls.location.touched && form.controls.location.errors?.['required']) {
            <p-message
              severity="error"
              text="Ce champ est obligatoire"
              size="small"
              variant="simple"
            />
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
          <label for="availabilityMessage" class="text-sm font-medium text-foreground"
            >Message de disponibilité</label
          >
          <input
            id="availabilityMessage"
            type="text"
            formControlName="availabilityMessage"
            pInputText
            fluid
          />
        </div>

        <div>
          <span class="block text-sm font-medium text-foreground mb-1.5">Avatar</span>
          @if (imagePreview()) {
            <img
              [src]="imagePreview()"
              alt="Aperçu avatar"
              class="w-32 h-32 rounded-xl object-cover mb-3 border border-foreground/10"
            />
          }
          <p-fileupload
            mode="advanced"
            [auto]="false"
            [showUploadButton]="false"
            [showCancelButton]="false"
            [multiple]="false"
            accept="image/*"
            chooseLabel="Choisir un avatar"
            (onSelect)="onFileSelected($event.files[0])"
          />
        </div>
      </fieldset>

      <div class="flex gap-4 pt-4">
        <p-button type="submit" label="Enregistrer" [disabled]="form.invalid" />
        <p-button
          type="button"
          label="Annuler"
          severity="secondary"
          [outlined]="true"
          (onClick)="cancel()"
        />
      </div>
    </form>
  `,
})
export class AdminProfile {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly apiUrl = inject(API_BASE_URL);
  private readonly profileGateway = inject(PROFILE_GATEWAY);
  private readonly toast = inject(MessageService);
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
            this.toast.add({ severity: 'success', summary: 'Succès', detail: 'Profil mis à jour' });
            this.router.navigate(['/admin/content']);
          },
          error: () =>
            this.toast.add({
              severity: 'error',
              summary: 'Erreur',
              detail: "Erreur lors de l'enregistrement",
            }),
        });
    } else {
      this.profileGateway
        .updateProfileInfo({ id: this.profileId, ...values })
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.toast.add({ severity: 'success', summary: 'Succès', detail: 'Profil mis à jour' });
            this.router.navigate(['/admin/content']);
          },
          error: () =>
            this.toast.add({
              severity: 'error',
              summary: 'Erreur',
              detail: "Erreur lors de l'enregistrement",
            }),
        });
    }
  }

  cancel(): void {
    this.router.navigate(['/admin/content']);
  }

  private selectFile(file: File): void {
    this.selectedFile.set(file);
    this.imagePreview.set(URL.createObjectURL(file));
  }
}
