import {
  Component,
  DestroyRef,
  inject,
  input,
  computed,
  effect,
  ChangeDetectionStrategy,
} from '@angular/core';
import { takeUntilDestroyed, rxResource } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { PROFILE_GATEWAY } from '@features/profile/application';
import { ToastService } from '@shared/ui';

@Component({
  selector: 'app-admin-technology-form',
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <h1 class="text-2xl font-bold text-foreground mb-8">
      {{ isEditMode() ? 'Modifier la technologie' : 'Nouvelle technologie' }}
    </h1>

    <form [formGroup]="form" (ngSubmit)="onSubmit()" class="max-w-2xl space-y-6">
      <fieldset class="space-y-6 border-0 p-0 m-0">
        <legend class="sr-only">Informations de la technologie</legend>

        <div>
          <label for="name" class="form-label">
            Nom <span class="text-red-500" aria-hidden="true">*</span>
          </label>
          <input
            id="name"
            type="text"
            formControlName="name"
            aria-required="true"
            class="form-input"
            [attr.aria-invalid]="form.controls.name.touched && form.controls.name.invalid"
          />
          @if (form.controls.name.touched && form.controls.name.errors?.['required']) {
            <small role="alert" class="form-error">Ce champ est obligatoire.</small>
          }
        </div>

        <div>
          <label for="category" class="form-label">
            Catégorie <span class="text-red-500" aria-hidden="true">*</span>
          </label>
          <select
            id="category"
            formControlName="category"
            aria-required="true"
            class="form-input"
            [attr.aria-invalid]="form.controls.category.touched && form.controls.category.invalid"
          >
            <option value="" disabled>Choisir une catégorie</option>
            @for (cat of categories; track cat) {
              <option [value]="cat">{{ cat }}</option>
            }
          </select>
          @if (form.controls.category.touched && form.controls.category.errors?.['required']) {
            <small role="alert" class="form-error">Ce champ est obligatoire.</small>
          }
        </div>

        <div>
          <label for="icon" class="form-label">
            Icône <span class="text-red-500" aria-hidden="true">*</span>
          </label>
          <input
            id="icon"
            type="text"
            formControlName="icon"
            aria-required="true"
            class="form-input"
            [attr.aria-invalid]="form.controls.icon.touched && form.controls.icon.invalid"
          />
          @if (form.controls.icon.touched && form.controls.icon.errors?.['required']) {
            <small role="alert" class="form-error">Ce champ est obligatoire.</small>
          }
        </div>
      </fieldset>

      <div class="flex gap-4 pt-4">
        <button type="submit" [disabled]="form.invalid" class="btn-primary">
          {{ isEditMode() ? 'Enregistrer' : 'Créer' }}
        </button>
        <button type="button" (click)="cancel()" class="btn-outline">Annuler</button>
      </div>
    </form>
  `,
})
export class AdminTechnologyForm {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly profileGateway = inject(PROFILE_GATEWAY);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  readonly id = input<string>();
  readonly isEditMode = computed(() => !!this.id());

  readonly categories = ['Framework', 'Langage', 'Styling', 'Backend', 'Base de données', 'Devops'];

  readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    category: ['', Validators.required],
    icon: ['', Validators.required],
  });

  private readonly editData = rxResource({
    params: () => (this.id() ? { id: this.id()! } : undefined),
    stream: ({ params }) => this.profileGateway.getTechnologyById(params.id),
  });

  private readonly patchForm = effect(() => {
    const tech = this.editData.value();
    if (tech) {
      this.form.patchValue(tech);
    }
  });

  onSubmit(): void {
    if (this.form.invalid) return;
    const values = this.form.getRawValue();
    const id = this.id();

    const request$ = id
      ? this.profileGateway.updateTechnology(id, values)
      : this.profileGateway.createTechnology(values);

    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.toast.add({
          severity: 'success',
          summary: 'Succès',
          detail: id ? 'Technologie mise à jour' : 'Technologie créée',
        });
        this.router.navigate(['/admin/content/technologies']);
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
    this.router.navigate(['/admin/content/technologies']);
  }
}
