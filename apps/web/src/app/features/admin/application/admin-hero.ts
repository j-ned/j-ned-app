import { Component, DestroyRef, inject, effect, ChangeDetectionStrategy } from '@angular/core';
import { takeUntilDestroyed, rxResource } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HOME_GATEWAY } from '@features/home/application';
import { ToastService } from '@shared/ui';

@Component({
  selector: 'app-admin-hero',
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <h1 class="text-2xl font-bold text-foreground mb-8">Hero</h1>

    <form [formGroup]="form" (ngSubmit)="onSubmit()" class="max-w-2xl space-y-6">
      <fieldset class="space-y-5 border-0 p-0 m-0">
        <legend class="sr-only">Informations du hero</legend>

        <div>
          <label for="name" class="form-label">
            Nom <span class="text-red-500" aria-hidden="true">*</span>
          </label>
          <input
            id="name"
            type="text"
            formControlName="name"
            autocomplete="name"
            aria-required="true"
            class="form-input"
            [attr.aria-invalid]="form.controls.name.touched && form.controls.name.invalid"
          />
          @if (form.controls.name.touched && form.controls.name.errors?.['required']) {
            <small role="alert" class="form-error">Ce champ est obligatoire.</small>
          }
        </div>

        <div>
          <label for="tagline" class="form-label">
            Tagline <span class="text-red-500" aria-hidden="true">*</span>
          </label>
          <input
            id="tagline"
            type="text"
            formControlName="tagline"
            aria-required="true"
            class="form-input"
            [attr.aria-invalid]="form.controls.tagline.touched && form.controls.tagline.invalid"
          />
          @if (form.controls.tagline.touched && form.controls.tagline.errors?.['required']) {
            <small role="alert" class="form-error">Ce champ est obligatoire.</small>
          }
        </div>

        <div>
          <label for="availability" class="form-label">
            Disponibilité <span class="text-red-500" aria-hidden="true">*</span>
          </label>
          <input
            id="availability"
            type="text"
            formControlName="availability"
            aria-required="true"
            class="form-input"
            [attr.aria-invalid]="
              form.controls.availability.touched && form.controls.availability.invalid
            "
          />
          @if (
            form.controls.availability.touched && form.controls.availability.errors?.['required']
          ) {
            <small role="alert" class="form-error">Ce champ est obligatoire.</small>
          }
        </div>
      </fieldset>

      <div class="flex items-center gap-3 pt-2">
        <button type="submit" [disabled]="form.invalid" class="btn-primary">Enregistrer</button>
        <button type="button" (click)="cancel()" class="btn-outline">Annuler</button>
      </div>
    </form>
  `,
})
export class AdminHero {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly homeGateway = inject(HOME_GATEWAY);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  private heroId = '';

  readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    tagline: ['', Validators.required],
    availability: ['', Validators.required],
  });

  private readonly editData = rxResource({
    stream: () => this.homeGateway.getHeroDataForEdit(),
  });

  private readonly _patchForm = effect(() => {
    const hero = this.editData.value();
    if (hero) {
      this.heroId = hero.id;
      this.form.patchValue({
        name: hero.name,
        tagline: hero.tagline,
        availability: hero.availability,
      });
    }
  });

  onSubmit(): void {
    if (this.form.invalid) return;
    const values = this.form.getRawValue();
    this.homeGateway
      .updateHeroData(values)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.homeGateway.invalidateBundle();
          this.toast.add({ severity: 'success', summary: 'Succès', detail: 'Hero mis à jour' });
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
