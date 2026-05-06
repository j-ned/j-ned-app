import {
  Component,
  DestroyRef,
  inject,
  effect,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { takeUntilDestroyed, rxResource } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { PROFILE_GATEWAY } from '@features/profile/application';
import { ToastService } from '@shared/ui';

@Component({
  selector: 'app-admin-what-i-seek',
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <h1 class="text-2xl font-bold text-foreground mb-8">Ce que je cherche</h1>

    <form [formGroup]="form" (ngSubmit)="onSubmit()" class="max-w-2xl space-y-6">
      <fieldset class="space-y-6 border-0 p-0 m-0">
        <legend class="sr-only">Ce que je recherche</legend>

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
          <label for="description" class="form-label">
            Description <span class="text-red-500" aria-hidden="true">*</span>
          </label>
          <textarea
            id="description"
            formControlName="description"
            rows="4"
            aria-required="true"
            class="form-textarea"
            [attr.aria-invalid]="
              form.controls.description.touched && form.controls.description.invalid
            "
          ></textarea>
          @if (
            form.controls.description.touched && form.controls.description.errors?.['required']
          ) {
            <small role="alert" class="form-error">Ce champ est obligatoire.</small>
          }
        </div>
      </fieldset>

      <div class="flex gap-4 pt-4">
        <button type="submit" [disabled]="form.invalid" class="btn-primary">Enregistrer</button>
        <button type="button" (click)="cancel()" class="btn-outline">Annuler</button>
      </div>
    </form>
  `,
})
export class AdminWhatISeek {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly profileGateway = inject(PROFILE_GATEWAY);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly whatISeekId = signal('');

  readonly form = this.fb.nonNullable.group({
    title: ['', Validators.required],
    description: ['', Validators.required],
  });

  private readonly editData = rxResource({
    stream: () => this.profileGateway.getWhatISeekForEdit(),
  });

  private readonly patchForm = effect(() => {
    const data = this.editData.value();
    if (data) {
      this.whatISeekId.set(data.id);
      this.form.patchValue({ title: data.title, description: data.description });
    }
  });

  onSubmit(): void {
    if (this.form.invalid) return;
    const values = this.form.getRawValue();
    const id = this.whatISeekId();
    this.profileGateway
      .updateWhatISeek(id ? { id, ...values } : values)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toast.add({
            severity: 'success',
            summary: 'Succès',
            detail: id ? 'Contenu mis à jour' : 'Contenu créé',
          });
          void this.router.navigate(['/admin/content']);
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
    void this.router.navigate(['/admin/content']);
  }
}
