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
import { ReactiveFormsModule, FormBuilder, FormArray, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { PROFILE_GATEWAY } from '@features/profile/application';
import { ToastService } from '@shared/ui';

@Component({
  selector: 'app-admin-diploma-form',
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <h1 class="text-2xl font-bold text-foreground mb-8">
      {{ isEditMode() ? 'Modifier le diplôme' : 'Nouveau diplôme' }}
    </h1>

    <form [formGroup]="form" (ngSubmit)="onSubmit()" class="max-w-2xl space-y-6">
      <fieldset class="space-y-6 border-0 p-0 m-0">
        <legend class="sr-only">Informations du diplôme</legend>

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
          <label for="provider" class="form-label">
            Organisme <span class="text-red-500" aria-hidden="true">*</span>
          </label>
          <input
            id="provider"
            type="text"
            formControlName="provider"
            aria-required="true"
            class="form-input"
            [attr.aria-invalid]="form.controls.provider.touched && form.controls.provider.invalid"
          />
          @if (form.controls.provider.touched && form.controls.provider.errors?.['required']) {
            <small role="alert" class="form-error">Ce champ est obligatoire.</small>
          }
        </div>

        <div>
          <label for="shortDescription" class="form-label">Description courte</label>
          <textarea
            id="shortDescription"
            formControlName="shortDescription"
            rows="3"
            class="form-textarea"
          ></textarea>
        </div>

        <div>
          <div class="flex items-center justify-between mb-1.5">
            <span class="form-label mb-0">Compétences</span>
            <button
              type="button"
              (click)="addSkill()"
              class="px-3 py-1 text-xs rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
            >
              Ajouter une compétence
            </button>
          </div>
          <div formArrayName="skills" class="space-y-2">
            @for (ctrl of skills.controls; track $index) {
              <div class="flex gap-2">
                <input
                  [formControlName]="$index"
                  type="text"
                  class="form-input flex-1"
                />
                <button
                  type="button"
                  (click)="removeSkill($index)"
                  class="px-3 py-1.5 text-xs rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                >
                  Supprimer
                </button>
              </div>
            }
          </div>
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
export class AdminDiplomaForm {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly profileGateway = inject(PROFILE_GATEWAY);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  readonly id = input<string>();
  readonly isEditMode = computed(() => !!this.id());

  readonly form = this.fb.nonNullable.group({
    title: ['', Validators.required],
    provider: ['', Validators.required],
    shortDescription: [''],
    skills: this.fb.array<string>([]),
  });

  get skills(): FormArray {
    return this.form.controls.skills;
  }

  private readonly editData = rxResource({
    params: () => (this.id() ? { id: this.id()! } : undefined),
    stream: ({ params }) => this.profileGateway.getDiplomaById(params.id),
  });

  private readonly patchForm = effect(() => {
    const diploma = this.editData.value();
    if (diploma) {
      this.form.patchValue({
        title: diploma.title,
        provider: diploma.provider,
        shortDescription: diploma.shortDescription,
      });
      this.skills.clear();
      diploma.skills.forEach((s) => this.skills.push(this.fb.nonNullable.control(s)));
    }
  });

  addSkill(): void {
    this.skills.push(this.fb.nonNullable.control(''));
  }

  removeSkill(index: number): void {
    this.skills.removeAt(index);
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    const { title, provider, shortDescription, skills } = this.form.getRawValue();
    const data = {
      title,
      provider,
      shortDescription,
      skills: skills.filter((s): s is string => s !== null),
    };
    const id = this.id();

    const request$ = id
      ? this.profileGateway.updateDiploma(id, data)
      : this.profileGateway.createDiploma(data);

    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.toast.add({
          severity: 'success',
          summary: 'Succès',
          detail: id ? 'Diplôme mis à jour' : 'Diplôme créé',
        });
        void this.router.navigate(['/admin/content/diplomas']);
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
    void this.router.navigate(['/admin/content/diplomas']);
  }
}
