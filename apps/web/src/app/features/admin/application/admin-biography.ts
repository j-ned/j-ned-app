import { Component, DestroyRef, inject, effect, ChangeDetectionStrategy } from '@angular/core';
import { takeUntilDestroyed, rxResource } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule, FormBuilder, FormArray, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { PROFILE_GATEWAY } from '@features/profile/application';
import { ToastService } from '@shared/ui';

@Component({
  selector: 'app-admin-biography',
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <h1 class="text-2xl font-bold text-foreground mb-8">Biographie</h1>

    <form [formGroup]="form" (ngSubmit)="onSubmit()" class="max-w-2xl space-y-6">
      <fieldset class="space-y-6 border-0 p-0 m-0">
        <legend class="sr-only">Contenu de la biographie</legend>

        <div>
          <label for="title" class="form-label">
            Titre <span class="text-red-500" aria-hidden="true">*</span>
          </label>
          <input
            id="title"
            type="text"
            formControlName="title"
            aria-required="true"
            class="form-input"
            [attr.aria-invalid]="form.controls.title.touched && form.controls.title.invalid"
          />
          @if (form.controls.title.touched && form.controls.title.errors?.['required']) {
            <small role="alert" class="form-error">Ce champ est obligatoire.</small>
          }
        </div>

        <div>
          <div class="flex items-center justify-between mb-1.5">
            <span class="form-label mb-0">Paragraphes</span>
            <button
              type="button"
              (click)="addParagraph()"
              class="px-3 py-1 text-xs rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
            >
              Ajouter un paragraphe
            </button>
          </div>
          <div formArrayName="paragraphs" class="space-y-3">
            @for (_ctrl of paragraphs.controls; track $index) {
              <div class="flex gap-2">
                <textarea
                  [formControlName]="$index"
                  rows="3"
                  class="form-textarea flex-1"
                ></textarea>
                <button
                  type="button"
                  (click)="removeParagraph($index)"
                  class="px-3 py-1.5 text-xs rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors self-start"
                >
                  Supprimer
                </button>
              </div>
            }
          </div>
        </div>
      </fieldset>

      <div class="flex gap-4 pt-4">
        <button type="submit" [disabled]="form.invalid" class="btn-primary">Enregistrer</button>
        <button type="button" (click)="cancel()" class="btn-outline">Annuler</button>
      </div>
    </form>
  `,
})
export class AdminBiography {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly profileGateway = inject(PROFILE_GATEWAY);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);
  private biographyId = '';

  readonly form = this.fb.nonNullable.group({
    title: ['', Validators.required],
    paragraphs: this.fb.array<string>([]),
  });

  get paragraphs(): FormArray {
    return this.form.controls.paragraphs;
  }

  private readonly editData = rxResource({
    stream: () => this.profileGateway.getBiographyForEdit(),
  });

  private readonly patchForm = effect(() => {
    const bio = this.editData.value();
    if (bio) {
      this.biographyId = bio.id;
      this.form.patchValue({ title: bio.title });
      this.paragraphs.clear();
      bio.paragraphs.forEach((p) => this.paragraphs.push(this.fb.nonNullable.control(p)));
    }
  });

  addParagraph(): void {
    this.paragraphs.push(this.fb.nonNullable.control(''));
  }

  removeParagraph(index: number): void {
    this.paragraphs.removeAt(index);
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    const { title, paragraphs } = this.form.getRawValue();
    this.profileGateway
      .updateBiography({
        title,
        paragraphs: paragraphs.filter((p): p is string => p !== null),
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toast.add({
            severity: 'success',
            summary: 'Succès',
            detail: 'Biographie mise à jour',
          });
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

  cancel(): void {
    this.router.navigate(['/admin/content']);
  }
}
