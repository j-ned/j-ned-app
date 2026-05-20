import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { PROFILE_GATEWAY } from '@features/profile/application';
import { ToastService } from '@shared/ui';

const MAX_AVATAR_SIZE_BYTES = 2 * 1024 * 1024;
const ALLOWED_AVATAR_MIME = ['image/jpeg', 'image/png', 'image/webp'] as const;

@Component({
  selector: 'app-admin-profile',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <header class="mb-10">
      <h1 class="text-3xl font-bold text-foreground mb-2">Photo de profil</h1>
      <p class="text-sm text-muted">Cette image apparaît sur la page À propos.</p>
    </header>

    <div class="max-w-md bg-surface border border-foreground/10 rounded-2xl p-8">
      <div class="flex flex-col items-center gap-6">
        @if (avatarUrl()) {
          <img
            [src]="avatarUrl()"
            alt="Avatar actuel"
            class="w-40 h-40 rounded-full object-cover border-4 border-foreground/10"
          />
        } @else {
          <div
            class="w-40 h-40 rounded-full bg-foreground/5 border-4 border-foreground/10 flex items-center justify-center"
          >
            <i class="pi pi-user text-5xl text-muted" aria-hidden="true"></i>
          </div>
        }

        <input
          #fileInput
          type="file"
          accept="image/jpeg,image/png,image/webp"
          class="hidden"
          (change)="onFileSelected($event)"
        />

        <button
          type="button"
          (click)="fileInput.click()"
          [disabled]="isUploading()"
          class="px-5 py-2.5 rounded-lg bg-primary-bg text-white font-semibold shadow-md hover:bg-primary-bg/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          @if (isUploading()) {
            <i class="pi pi-spinner pi-spin mr-2" aria-hidden="true"></i> Téléversement...
          } @else {
            <i class="pi pi-upload mr-2" aria-hidden="true"></i> Choisir une nouvelle photo
          }
        </button>

        <p class="text-xs text-muted text-center">
          Formats acceptés : JPG, PNG, WebP. Taille max : 2 Mo.
        </p>
      </div>
    </div>
  `,
})
export class AdminProfile {
  private readonly profileGateway = inject(PROFILE_GATEWAY);
  private readonly toast = inject(ToastService);

  private readonly profileRes = rxResource({
    stream: () => this.profileGateway.getProfileInfo(),
  });

  protected readonly avatarUrl = computed(() => this.profileRes.value()?.avatarUrl ?? '');
  protected readonly isUploading = signal(false);

  protected onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (!ALLOWED_AVATAR_MIME.includes(file.type as (typeof ALLOWED_AVATAR_MIME)[number])) {
      this.toast.add({
        severity: 'error',
        summary: 'Format non supporté',
        detail: 'Utilisez un fichier JPG, PNG ou WebP.',
      });
      input.value = '';
      return;
    }
    if (file.size > MAX_AVATAR_SIZE_BYTES) {
      this.toast.add({
        severity: 'error',
        summary: 'Fichier trop volumineux',
        detail: 'La taille maximum est de 2 Mo.',
      });
      input.value = '';
      return;
    }

    this.isUploading.set(true);
    this.profileGateway.uploadAvatar(file).subscribe({
      next: () => {
        this.isUploading.set(false);
        this.toast.add({
          severity: 'success',
          summary: 'Photo mise à jour',
          detail: 'La nouvelle photo apparaîtra dans quelques instants.',
        });
        this.profileRes.reload();
        input.value = '';
      },
      error: () => {
        this.isUploading.set(false);
        this.toast.add({
          severity: 'error',
          summary: 'Échec du téléversement',
          detail: 'Réessayez ou vérifiez votre connexion.',
        });
        input.value = '';
      },
    });
  }
}
