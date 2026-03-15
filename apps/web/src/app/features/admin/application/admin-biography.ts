import { Component, DestroyRef, inject, effect, ChangeDetectionStrategy } from '@angular/core';
import { takeUntilDestroyed, rxResource } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule, FormBuilder, FormArray, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { PROFILE_GATEWAY } from '@features/profile/application';
import { ToastService } from '@shared/toast';

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
          <label for="title" class="block text-sm font-medium text-foreground mb-1.5"
            >Titre</label
          >
          <input
            id="title"
            type="text"
            formControlName="title"
            class="w-full px-4 py-2.5 rounded-lg bg-foreground/5 border border-foreground/20 text-foreground placeholder-muted focus:border-primary focus:outline-none transition-colors"
          />
          @if (form.controls.title.touched && form.controls.title.errors?.['required']) {
            <span class="text-red-400 text-xs mt-1 block">Ce champ est obligatoire</span>
          }
        </div>

        <div>
          <div class="flex items-center justify-between mb-1.5">
            <span class="block text-sm font-medium text-foreground">Paragraphes</span>
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
                  class="flex-1 px-4 py-2.5 rounded-lg bg-foreground/5 border border-foreground/20 text-foreground placeholder-muted focus:border-primary focus:outline-none transition-colors resize-y"
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
        id: this.biographyId,
        title,
        paragraphs: paragraphs.filter((p): p is string => p !== null),
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toast.success('Biographie mise à jour');
          this.router.navigate(['/admin/about']);
        },
        error: () => this.toast.error("Erreur lors de l'enregistrement"),
      });
  }

  cancel(): void {
    this.router.navigate(['/admin/about']);
  }
}
