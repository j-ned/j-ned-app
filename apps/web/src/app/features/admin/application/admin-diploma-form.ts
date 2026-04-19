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
import { Button } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { Textarea } from 'primeng/textarea';
import { Message } from 'primeng/message';

@Component({
  selector: 'app-admin-diploma-form',
  imports: [ReactiveFormsModule, Button, InputText, Textarea, Message],
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
          <label for="title" class="text-sm font-medium text-foreground">Titre</label>
          <input id="title" type="text" formControlName="title" pInputText fluid />
          @if (form.controls.title.touched && form.controls.title.errors?.['required']) {
            <p-message
              severity="error"
              text="Ce champ est obligatoire"
              size="small"
              variant="simple"
            />
          }
        </div>

        <div>
          <label for="provider" class="text-sm font-medium text-foreground">Organisme</label>
          <input id="provider" type="text" formControlName="provider" pInputText fluid />
          @if (form.controls.provider.touched && form.controls.provider.errors?.['required']) {
            <p-message
              severity="error"
              text="Ce champ est obligatoire"
              size="small"
              variant="simple"
            />
          }
        </div>

        <div>
          <label for="shortDescription" class="text-sm font-medium text-foreground"
            >Description courte</label
          >
          <textarea
            id="shortDescription"
            formControlName="shortDescription"
            rows="3"
            pTextarea
          ></textarea>
        </div>

        <div>
          <div class="flex items-center justify-between mb-1.5">
            <span class="block text-sm font-medium text-foreground">Compétences</span>
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
                  class="flex-1 px-4 py-2.5 rounded-lg bg-foreground/5 border border-foreground/20 text-foreground placeholder-muted focus:border-primary focus:outline-none transition-colors"
                  pInputText
                  fluid
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
        <p-button
          type="submit"
          [label]="isEditMode() ? 'Enregistrer' : 'Créer'"
          [disabled]="form.invalid"
        />
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
        this.router.navigate(['/admin/content/diplomas']);
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
    this.router.navigate(['/admin/content/diplomas']);
  }
}
