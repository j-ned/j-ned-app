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
import { HOME_GATEWAY } from '@features/home/application';
import { ToastService } from '@shared/ui';

@Component({
  selector: 'app-admin-home-highlight-form',
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <h1 class="text-2xl font-bold text-foreground mb-8">
      {{ isEditMode() ? 'Modifier le point fort' : 'Nouveau point fort' }}
    </h1>

    <form [formGroup]="form" (ngSubmit)="onSubmit()" class="max-w-2xl space-y-6">
      <fieldset class="space-y-6 border-0 p-0 m-0">
        <legend class="sr-only">Informations de la mise en avant</legend>

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

        <div>
          <label for="order" class="form-label">Ordre</label>
          <input id="order" type="number" formControlName="order" class="form-input" />
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
export class AdminHomeHighlightForm {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly homeGateway = inject(HOME_GATEWAY);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  readonly id = input<string>();
  readonly isEditMode = computed(() => !!this.id());

  readonly form = this.fb.nonNullable.group({
    title: ['', Validators.required],
    description: ['', Validators.required],
    icon: ['', Validators.required],
    order: [0],
  });

  private readonly editData = rxResource({
    params: () => (this.id() ? { id: this.id()! } : undefined),
    stream: ({ params }) => this.homeGateway.getHomeHighlightById(params.id),
  });

  private readonly patchForm = effect(() => {
    const highlight = this.editData.value();
    if (highlight) {
      this.form.patchValue(highlight);
    }
  });

  onSubmit(): void {
    if (this.form.invalid) return;
    const values = this.form.getRawValue();
    const id = this.id();

    const request$ = id
      ? this.homeGateway.updateHomeHighlight(id, values)
      : this.homeGateway.createHomeHighlight(values);

    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.toast.add({
          severity: 'success',
          summary: 'Succès',
          detail: id ? 'Mise en avant mise à jour' : 'Mise en avant créée',
        });
        this.router.navigate(['/admin/content/home-highlights']);
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
    this.router.navigate(['/admin/content/home-highlights']);
  }
}
